import mongoose from 'mongoose'
import {
  Activity,
  Agent,
  FollowUpTask,
  Lead,
  Workflow,
  WorkflowExecution,
} from '../models/index.js'

import {
  getDevUserActivities,
  getDevUserAgents,
  getDevUserExecutions,
  getDevUserTasks,
  getDevUserWorkflows,
} from '../utils/devStore.js'

/**
 * Executes the fixed MVP New Lead Follow-Up workflow:
 * 1. New Lead (already persisted)
 * 2. Analyze Lead (bounded mock AI analysis)
 * 3. Save Analysis & Suggested Next Step to CRM Lead
 * 4. Create Follow-Up Task
 * 5. Record Activity
 * 6. Record Workflow Execution Status
 *
 * If analysis fails, the lead is preserved and error is recorded.
 */
export const executeNewLeadWorkflow = async (lead, userId) => {
  const isDbConnected = mongoose.connection.readyState === 1
  const executionStartTime = new Date()

  // Find or determine the assigned agent (default to active Sales Agent)
  let assignedAgent = null
  let workflow = null

  try {
    if (isDbConnected) {
      workflow = await Workflow.findOne({
        owner: userId,
        trigger: 'New Lead Created',
        status: 'Active',
      })

      if (workflow && workflow.assignedAgent) {
        assignedAgent = await Agent.findById(workflow.assignedAgent)
      } else {
        assignedAgent = await Agent.findOne({
          owner: userId,
          type: { $in: ['Sales', 'Sales Agent'] },
          status: 'Active',
        })
      }
    } else {
      const devWorkflows = getDevUserWorkflows(userId)
      workflow = devWorkflows.find((w) => w.status === 'Active') || devWorkflows[0] || null
      const devAgents = getDevUserAgents(userId)
      assignedAgent = devAgents.find((a) => a.type === 'Sales' && a.status === 'Active') || devAgents[0] || null
    }
  } catch (err) {
    console.warn('[WorkflowEngine] Could not lookup agent/workflow:', err.message)
  }

  const agentName = assignedAgent ? assignedAgent.name : 'Sales Agent'

  try {
    // 2. Generate Bounded AI Analysis (Mock / Configuration-level per MVP policy)
    const analysisText = `Lead qualified based on company profile (${lead.company || 'Direct'}). Expressed high intent for workflow automation. Potential value: Tier-1 enterprise account.`
    const suggestedNextStep = `Schedule a 20-minute discovery call with ${lead.name} to demonstrate tailored business automations.`

    // 3. Save Analysis to CRM Lead
    lead.aiAnalysis = analysisText
    lead.suggestedNextStep = suggestedNextStep
    if (isDbConnected && typeof lead.save === 'function') {
      await lead.save()
    }

    // 4. Create Follow-Up Task
    const dueDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days from now
    let task = null

    if (isDbConnected) {
      task = await FollowUpTask.create({
        lead: lead._id,
        assignedAgent: assignedAgent ? assignedAgent._id : undefined,
        title: `Follow up with ${lead.name} (${lead.company || 'Inbound'})`,
        description: suggestedNextStep,
        status: 'Pending',
        dueDate,
        owner: userId,
      })
    } else {
      task = {
        _id: new mongoose.Types.ObjectId(),
        lead: lead._id,
        assignedAgent: assignedAgent ? assignedAgent._id : undefined,
        title: `Follow up with ${lead.name} (${lead.company || 'Inbound'})`,
        description: suggestedNextStep,
        status: 'Pending',
        dueDate,
        owner: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      getDevUserTasks(userId).unshift(task)
    }

    // 5. Record Activity
    let activityAnalyzed = null
    let activityTask = null

    if (isDbConnected) {
      activityAnalyzed = await Activity.create({
        type: 'lead_analyzed',
        title: `Lead analyzed by ${agentName}`,
        description: analysisText,
        lead: lead._id,
        agent: assignedAgent ? assignedAgent._id : undefined,
        workflow: workflow ? workflow._id : undefined,
        status: 'Succeeded',
        owner: userId,
      })

      activityTask = await Activity.create({
        type: 'task_created',
        title: `Follow-up task created: ${task.title}`,
        description: `Due on ${dueDate.toLocaleDateString()}`,
        lead: lead._id,
        agent: assignedAgent ? assignedAgent._id : undefined,
        status: 'New',
        owner: userId,
      })
    } else {
      activityAnalyzed = {
        _id: new mongoose.Types.ObjectId(),
        type: 'lead_analyzed',
        title: `Lead analyzed by ${agentName}`,
        description: analysisText,
        lead: lead._id,
        agent: assignedAgent ? assignedAgent._id : undefined,
        workflow: workflow ? workflow._id : undefined,
        status: 'Succeeded',
        owner: userId,
        createdAt: new Date(),
      }
      activityTask = {
        _id: new mongoose.Types.ObjectId(),
        type: 'task_created',
        title: `Follow-up task created: ${task.title}`,
        description: `Due on ${dueDate.toLocaleDateString()}`,
        lead: lead._id,
        agent: assignedAgent ? assignedAgent._id : undefined,
        status: 'New',
        owner: userId,
        createdAt: new Date(),
      }
      const devActs = getDevUserActivities(userId)
      devActs.unshift(activityTask)
      devActs.unshift(activityAnalyzed)
    }

    // Attach to in-memory lead for direct lookup
    lead.tasks = [task]
    lead.activities = [activityTask, activityAnalyzed]

    // 6. Record Workflow Execution Status
    let execution = null
    if (isDbConnected) {
      execution = await WorkflowExecution.create({
        workflow: workflow ? workflow._id : undefined,
        lead: lead._id,
        agent: assignedAgent ? assignedAgent._id : undefined,
        status: 'Succeeded',
        startedAt: executionStartTime,
        completedAt: new Date(),
        error: null,
      })
    } else {
      execution = {
        _id: new mongoose.Types.ObjectId(),
        workflow: workflow ? workflow._id : undefined,
        lead: { _id: lead._id, name: lead.name, email: lead.email, company: lead.company, status: lead.status },
        agent: assignedAgent ? { _id: assignedAgent._id, name: assignedAgent.name, type: assignedAgent.type } : undefined,
        status: 'Succeeded',
        startedAt: executionStartTime,
        completedAt: new Date(),
        error: null,
        owner: userId,
        createdAt: new Date(),
      }
      getDevUserExecutions(userId).unshift(execution)
    }

    return {
      success: true,
      lead,
      task,
      execution,
    }
  } catch (error) {
    console.error('[WorkflowEngine] Execution failed:', error.message)

    // On failure: Lead remains saved. Failure recorded in execution and activity.
    if (isDbConnected) {
      try {
        await WorkflowExecution.create({
          workflow: workflow ? workflow._id : undefined,
          lead: lead._id,
          agent: assignedAgent ? assignedAgent._id : undefined,
          status: 'Failed',
          startedAt: executionStartTime,
          completedAt: new Date(),
          error: error.message,
        })

        await Activity.create({
          type: 'workflow_failed',
          title: `Workflow execution failed for ${lead.name}`,
          description: error.message,
          lead: lead._id,
          status: 'Failed',
          owner: userId,
        })
      } catch (logErr) {
        console.error('[WorkflowEngine] Failed to record error execution:', logErr.message)
      }
    }

    return {
      success: false,
      lead, // Lead is still safely returned
      error: error.message,
    }
  }
}

export default {
  executeNewLeadWorkflow,
}
