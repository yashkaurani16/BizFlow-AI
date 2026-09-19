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
import { analyzeLead } from './ai/aiService.js'

/**
 * Executes the fixed MVP New Lead Follow-Up workflow:
 * 1. New Lead (already persisted)
 * 2. Validate Assigned Agent (inactive agents cannot perform AI processing)
 * 3. Analyze Lead via dedicated AI Service (real provider or safe bounded fallback)
 * 4. Save Analysis & Suggested Next Step to CRM Lead
 * 5. Create Follow-Up Task
 * 6. Record Activity (flagging human review required)
 * 7. Record Workflow Execution Status
 *
 * If analysis fails, the lead is preserved and error is recorded.
 */
export const executeNewLeadWorkflow = async (lead, userId) => {
  const isDbConnected = mongoose.connection.readyState === 1
  const executionStartTime = new Date()

  // Find or determine the assigned agent (default to Sales Agent)
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
        })
      }
    } else {
      const devWorkflows = getDevUserWorkflows(userId)
      workflow = devWorkflows.find((w) => w.status === 'Active') || devWorkflows[0] || null
      const devAgents = getDevUserAgents(userId)
      assignedAgent = devAgents.find((a) => a.type === 'Sales') || devAgents[0] || null
    }
  } catch (err) {
    console.warn('[WorkflowEngine] Could not lookup agent/workflow:', err.message)
  }

  // Enforce Section 6: Inactive agent check
  if (assignedAgent && assignedAgent.status !== 'Active') {
    const skipReason = `AI processing skipped: assigned agent "${assignedAgent.name}" is Inactive`
    console.log(`[WorkflowEngine] ${skipReason}`)

    if (isDbConnected) {
      await WorkflowExecution.create({
        workflow: workflow ? workflow._id : undefined,
        lead: lead._id,
        agent: assignedAgent._id,
        status: 'Failed',
        startedAt: executionStartTime,
        completedAt: new Date(),
        error: skipReason,
      })

      await Activity.create({
        type: 'workflow_skipped',
        title: `AI analysis skipped for ${lead.name}`,
        description: skipReason,
        lead: lead._id,
        agent: assignedAgent._id,
        status: 'Failed',
        owner: userId,
      })
    } else {
      const skipAct = {
        _id: new mongoose.Types.ObjectId(),
        type: 'workflow_skipped',
        title: `AI analysis skipped for ${lead.name}`,
        description: skipReason,
        lead: lead._id,
        agent: assignedAgent ? assignedAgent._id : undefined,
        status: 'Failed',
        owner: userId,
        createdAt: new Date(),
      }
      getDevUserActivities(userId).unshift(skipAct)
      getDevUserExecutions(userId).unshift({
        _id: new mongoose.Types.ObjectId(),
        workflow: workflow ? workflow._id : undefined,
        lead: { _id: lead._id, name: lead.name, email: lead.email },
        agent: { _id: assignedAgent._id, name: assignedAgent.name, type: assignedAgent.type },
        status: 'Failed',
        startedAt: executionStartTime,
        completedAt: new Date(),
        error: skipReason,
        owner: userId,
        createdAt: new Date(),
      })
    }

    return {
      success: false,
      lead,
      error: skipReason,
      skipped: true,
    }
  }

  const agentName = assignedAgent ? assignedAgent.name : 'Sales Agent'

  try {
    // 3. Analyze Lead via dedicated AI Service (real provider or bounded fallback)
    const aiResult = await analyzeLead(lead, assignedAgent)

    const analysisText = aiResult.summary || 'Lead analyzed.'
    const suggestedNextStep = aiResult.suggestedNextStep || 'Review lead details.'
    const isRealAI = Boolean(aiResult.isRealAI)
    const providerTag = isRealAI ? 'AI Provider Connected' : 'AI Provider Unavailable — Fallback Analysis'

    const structuredIntelligence = {
      score: typeof aiResult.score === 'number' ? aiResult.score : 50,
      priority: aiResult.priority || aiResult.leadQuality || 'Medium',
      summary: analysisText,
      keySignals: Array.isArray(aiResult.keySignals) ? aiResult.keySignals : [],
      risks: Array.isArray(aiResult.risks) ? aiResult.risks : [],
      recommendedNextAction: aiResult.recommendedNextAction || suggestedNextStep,
      followUpSuggestion: aiResult.followUpSuggestion || '',
      analyzedAt: aiResult.analyzedAt || new Date().toISOString(),
      isRealAI,
      provider: aiResult.provider || 'fallback',
      model: aiResult.model || 'bounded-fallback-v1',
      humanReviewRequired: true,
    }

    // 4. Save Structured Intelligence, Analysis, & AI Metadata to CRM Lead
    lead.aiIntelligence = structuredIntelligence
    lead.aiAnalysis = analysisText
    lead.suggestedNextStep = suggestedNextStep
    lead.aiMetadata = {
      isRealAI,
      provider: aiResult.provider || 'fallback',
      model: aiResult.model || 'bounded-fallback-v1',
      leadQuality: structuredIntelligence.priority,
      reasoningSummary: aiResult.reasoningSummary || '',
      humanReviewRequired: true,
      analyzedAt: structuredIntelligence.analyzedAt,
    }

    if (isDbConnected && typeof lead.save === 'function') {
      await lead.save()
    }

    // 5. Create Follow-Up Task
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

    // 6. Record Activity
    let activityAnalyzed = null
    let activityTask = null

    const activityTitle = `Lead analyzed by ${agentName} [${isRealAI ? 'Live AI' : 'Fallback'}]`
    const activityDesc = `${analysisText} (${providerTag}) — Human Review Required.`

    if (isDbConnected) {
      activityAnalyzed = await Activity.create({
        type: 'lead_analyzed',
        title: activityTitle,
        description: activityDesc,
        lead: lead._id,
        agent: assignedAgent ? assignedAgent._id : undefined,
        workflow: workflow ? workflow._id : undefined,
        status: 'Succeeded',
        owner: userId,
      })

      activityTask = await Activity.create({
        type: 'task_created',
        title: `Follow-up task created: ${task.title}`,
        description: `Due on ${dueDate.toLocaleDateString()} — Human Review Required.`,
        lead: lead._id,
        agent: assignedAgent ? assignedAgent._id : undefined,
        status: 'New',
        owner: userId,
      })
    } else {
      activityAnalyzed = {
        _id: new mongoose.Types.ObjectId(),
        type: 'lead_analyzed',
        title: activityTitle,
        description: activityDesc,
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
        description: `Due on ${dueDate.toLocaleDateString()} — Human Review Required.`,
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
    } else {
      const failAct = {
        _id: new mongoose.Types.ObjectId(),
        type: 'workflow_failed',
        title: `Workflow execution failed for ${lead.name}`,
        description: error.message,
        lead: lead._id,
        status: 'Failed',
        owner: userId,
        createdAt: new Date(),
      }
      getDevUserActivities(userId).unshift(failAct)
      getDevUserExecutions(userId).unshift({
        _id: new mongoose.Types.ObjectId(),
        workflow: workflow ? workflow._id : undefined,
        lead: { _id: lead._id, name: lead.name, email: lead.email },
        agent: assignedAgent ? { _id: assignedAgent._id, name: assignedAgent.name } : undefined,
        status: 'Failed',
        startedAt: executionStartTime,
        completedAt: new Date(),
        error: error.message,
        owner: userId,
        createdAt: new Date(),
      })
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
