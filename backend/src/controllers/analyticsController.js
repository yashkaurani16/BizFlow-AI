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
  getDevUserLeads,
  getDevUserTasks,
  getDevUserWorkflows,
} from '../utils/devStore.js'

function getDateFilter(range) {
  const now = new Date()
  if (range === 'Today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    return { createdAt: { $gte: start } }
  }
  if (range === 'Last 7 Days') {
    const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    return { createdAt: { $gte: start } }
  }
  if (range === 'Last 30 Days') {
    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    return { createdAt: { $gte: start } }
  }
  return {}
}

/**
 * GET /api/analytics
 * Dynamically aggregate operational metrics without separate analytics collection
 */
export const getAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id
    const range = req.query.range || 'All Time'
    const isDbConnected = mongoose.connection.readyState === 1
    const dateFilter = getDateFilter(range)

    let leads = []
    let agents = []
    let workflows = []
    let executions = []
    let tasks = []
    let activities = []

    if (isDbConnected) {
      ;[leads, agents, workflows, executions, tasks, activities] = await Promise.all([
        Lead.find({ owner: userId, ...dateFilter }),
        Agent.find({ owner: userId }),
        Workflow.find({ owner: userId }),
        WorkflowExecution.find({ ...dateFilter }),
        FollowUpTask.find({ owner: userId }),
        Activity.find({ owner: userId, ...dateFilter }).sort({ createdAt: -1 }).limit(10),
      ])
    } else {
      leads = getDevUserLeads(userId)
      agents = getDevUserAgents(userId)
      workflows = getDevUserWorkflows(userId)
      executions = getDevUserExecutions(userId)
      tasks = getDevUserTasks(userId)
      activities = getDevUserActivities(userId)
    }

    const totalLeads = leads.length
    const countsByStatus = {
      New: 0,
      Contacted: 0,
      Qualified: 0,
      Converted: 0,
      Lost: 0,
    }

    leads.forEach((l) => {
      if (countsByStatus[l.status] !== undefined) {
        countsByStatus[l.status] += 1
      }
    })

    const conversionRate =
      totalLeads > 0 ? ((countsByStatus.Converted / totalLeads) * 100).toFixed(1) : '0.0'
    const qualificationRate =
      totalLeads > 0
        ? (((countsByStatus.Qualified + countsByStatus.Converted) / totalLeads) * 100).toFixed(1)
        : '0.0'

    const activeAgents = agents.filter((a) => a.status === 'Active').length
    const activeWorkflows = workflows.filter((w) => w.status === 'Active').length
    const pendingTasks = tasks.filter((t) => t.status === 'Pending').length
    const completedTasks = tasks.filter((t) => t.status === 'Completed').length

    // Step 19: Operational AI CRM Intelligence metrics
    const analyzedLeads = leads.filter((l) => Boolean(l.aiIntelligence || l.aiAnalysis)).length
    const highPriorityLeads = leads.filter(
      (l) => l.aiIntelligence?.priority === 'High' || l.aiMetadata?.leadQuality === 'High',
    ).length

    const scores = leads
      .map((l) => l.aiIntelligence?.score)
      .filter((s) => typeof s === 'number' && !isNaN(s))

    const averageAiScore =
      scores.length > 0
        ? Number((scores.reduce((sum, s) => sum + s, 0) / scores.length).toFixed(1))
        : (analyzedLeads > 0 ? 70 : 0)

    const leadsRequiringFollowUp = leads.filter(
      (l) => l.status === 'New' || l.status === 'Contacted' || pendingTasks > 0,
    ).length

    return res.status(200).json({
      success: true,
      analytics: {
        range,
        kpis: {
          totalLeads,
          newLeads: countsByStatus.New,
          qualifiedLeads: countsByStatus.Qualified,
          convertedLeads: countsByStatus.Converted,
          activeAiAgents: activeAgents,
          activeWorkflows,
          followUpTasks: pendingTasks,
        },
        crmIntelligence: {
          analyzedLeads,
          highPriorityLeads,
          averageAiScore,
          leadsRequiringFollowUp,
        },
        leadAnalytics: {
          countsByStatus,
          conversionRate: `${conversionRate}%`,
          qualificationRate: `${qualificationRate}%`,
        },
        agentAnalytics: {
          totalAgents: agents.length,
          activeAgents,
          inactiveAgents: agents.length - activeAgents,
          agentsList: agents,
        },
        workflowAnalytics: {
          totalWorkflows: workflows.length,
          activeWorkflows,
          inactiveWorkflows: workflows.length - activeWorkflows,
          successfulRuns: executions.filter((e) => e.status === 'Succeeded').length,
          failedRuns: executions.filter((e) => e.status === 'Failed').length,
        },
        taskAnalytics: {
          pendingTasks,
          completedTasks,
          overdueTasks: 0,
          totalTasks: tasks.length,
        },
        recentActivities: activities.slice(0, 10),
      },
    })
  } catch (error) {
    next(error)
  }
}

export default {
  getAnalytics,
}
