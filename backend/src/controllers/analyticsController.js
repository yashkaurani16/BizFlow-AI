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
import { generateAnalyticsInsights } from '../services/ai/aiService.js'

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

function filterByDateRange(items = [], range = 'All Time', dateField = 'createdAt') {
  if (range === 'All Time') return items
  const now = new Date()
  let cutoff = new Date()

  if (range === 'Today') {
    cutoff.setHours(0, 0, 0, 0)
  } else if (range === 'Last 7 Days') {
    cutoff.setDate(now.getDate() - 7)
  } else if (range === 'Last 30 Days') {
    cutoff.setDate(now.getDate() - 30)
  }

  return items.filter((item) => {
    const raw = item[dateField] || item.createdAt
    if (!raw) return true
    const d = new Date(raw)
    return !isNaN(d.getTime()) && d >= cutoff
  })
}

function buildTimeSeries(items = [], dateField = 'createdAt') {
  const map = new Map()
  for (const item of items) {
    const raw = item[dateField] || item.createdAt
    if (!raw) continue
    const d = new Date(raw)
    if (isNaN(d.getTime())) continue
    const day = d.toISOString().split('T')[0]
    map.set(day, (map.get(day) || 0) + 1)
  }
  return Array.from(map.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Aggregates operational metrics for a specific user and filters
 */
async function aggregateUserMetrics(userId, queryParams = {}) {
  const {
    range = 'All Time',
    status = 'All',
    priority = 'All',
    channel = 'All',
  } = queryParams

  const isDbConnected = mongoose.connection.readyState === 1
  const dateFilter = getDateFilter(range)

  let leads = []
  let agents = []
  let workflows = []
  let executions = []
  let tasks = []
  let activities = []

  if (isDbConnected) {
    const [fetchedLeads, fetchedAgents, fetchedWorkflows, fetchedTasks, fetchedActivities] =
      await Promise.all([
        Lead.find({ owner: userId, ...dateFilter }),
        Agent.find({ owner: userId }),
        Workflow.find({ owner: userId }),
        FollowUpTask.find({ owner: userId, ...dateFilter }),
        Activity.find({ owner: userId, ...dateFilter }).sort({ createdAt: -1 }),
      ])

    leads = fetchedLeads
    agents = fetchedAgents
    workflows = fetchedWorkflows
    tasks = fetchedTasks
    activities = fetchedActivities

    const userWorkflowIds = workflows.map((w) => w._id)
    const userLeadIds = leads.map((l) => l._id)

    if (userWorkflowIds.length > 0 || userLeadIds.length > 0) {
      executions = await WorkflowExecution.find({
        ...dateFilter,
        $or: [
          ...(userWorkflowIds.length > 0 ? [{ workflow: { $in: userWorkflowIds } }] : []),
          ...(userLeadIds.length > 0 ? [{ lead: { $in: userLeadIds } }] : []),
        ],
      })
        .populate('workflow', 'name')
        .populate('lead', 'name email')
        .sort({ createdAt: -1 })
    }
  } else {
    leads = filterByDateRange(getDevUserLeads(userId), range)
    agents = getDevUserAgents(userId)
    workflows = getDevUserWorkflows(userId)
    executions = filterByDateRange(getDevUserExecutions(userId), range)
    tasks = filterByDateRange(getDevUserTasks(userId), range)
    activities = filterByDateRange(getDevUserActivities(userId), range)
  }

  // Apply contextual filters
  let filteredLeads = leads
  if (status && status !== 'All') {
    filteredLeads = filteredLeads.filter((l) => l.status === status)
  }
  if (priority && priority !== 'All') {
    filteredLeads = filteredLeads.filter(
      (l) =>
        l.aiIntelligence?.priority === priority ||
        l.aiMetadata?.leadQuality === priority
    )
  }

  let filteredActivities = activities
  if (channel && channel !== 'All') {
    filteredActivities = filteredActivities.filter((a) => a.channel === channel)
  }

  // 1. CRM & Lead Status Metrics
  const totalLeads = filteredLeads.length
  const countsByStatus = {
    New: 0,
    Contacted: 0,
    Qualified: 0,
    Converted: 0,
    Lost: 0,
  }

  for (const lead of filteredLeads) {
    if (countsByStatus[lead.status] !== undefined) {
      countsByStatus[lead.status] += 1
    }
  }

  const conversionRate =
    totalLeads > 0 ? ((countsByStatus.Converted / totalLeads) * 100).toFixed(1) : '0.0'
  const qualificationRate =
    totalLeads > 0
      ? (((countsByStatus.Qualified + countsByStatus.Converted) / totalLeads) * 100).toFixed(1)
      : '0.0'

  // Priority Distribution
  const priorityBreakdown = {
    High: 0,
    Medium: 0,
    Low: 0,
  }

  for (const lead of filteredLeads) {
    const pri = lead.aiIntelligence?.priority || lead.aiMetadata?.leadQuality || 'Medium'
    if (priorityBreakdown[pri] !== undefined) {
      priorityBreakdown[pri] += 1
    } else {
      priorityBreakdown.Medium += 1
    }
  }

  // AI Score Distribution Tiers
  const scoreTiers = {
    tierLow: 0, // 0 - 39
    tierModerate: 0, // 40 - 69
    tierStrong: 0, // 70 - 89
    tierExceptional: 0, // 90 - 100
  }

  const validScores = []
  for (const lead of filteredLeads) {
    const s = lead.aiIntelligence?.score
    if (typeof s === 'number' && !isNaN(s)) {
      validScores.push(s)
      if (s >= 90) scoreTiers.tierExceptional += 1
      else if (s >= 70) scoreTiers.tierStrong += 1
      else if (s >= 40) scoreTiers.tierModerate += 1
      else scoreTiers.tierLow += 1
    }
  }

  const averageAiScore =
    validScores.length > 0
      ? Number((validScores.reduce((sum, val) => sum + val, 0) / validScores.length).toFixed(1))
      : 0

  // Follow-up status
  const pendingTasks = tasks.filter((t) => t.status === 'Pending' || t.status === 'Active').length
  const completedTasks = tasks.filter((t) => t.status === 'Completed').length
  const overdueTasks = tasks.filter((t) => {
    if (t.status !== 'Pending' && t.status !== 'Active') return false
    if (!t.dueDate) return false
    return new Date(t.dueDate) < new Date()
  }).length

  const leadsRequiringFollowUp = filteredLeads.filter(
    (l) => l.status === 'New' || l.status === 'Contacted'
  ).length

  // 2. Workflow Analytics
  const totalWorkflows = workflows.length
  const activeWorkflows = workflows.filter((w) => w.status === 'Active').length
  const inactiveWorkflows = workflows.filter((w) => w.status === 'Inactive').length

  const totalExecutions = executions.length
  const successfulExecutions = executions.filter((e) => e.status === 'Succeeded').length
  const failedExecutions = executions.filter((e) => e.status === 'Failed').length
  const waitingReviewExecutions = executions.filter(
    (e) => e.status === 'Waiting for Human Review'
  ).length
  const executionSuccessRate =
    totalExecutions > 0
      ? `${((successfulExecutions / totalExecutions) * 100).toFixed(1)}%`
      : '100%'

  const recentExecutions = executions.slice(0, 10).map((e) => ({
    id: e._id || e.id,
    workflowName: e.workflow?.name || 'New Lead Follow-Up',
    leadName: e.lead?.name || 'Inbound Lead',
    status: e.status,
    startedAt: e.startedAt,
    completedAt: e.completedAt,
    error: e.error || null,
  }))

  // 3. Communication Analytics (Activity records from Step 20)
  const emailDrafts = activities.filter(
    (a) => a.type === 'communication_draft_generated' && a.channel === 'email'
  ).length
  const whatsappDrafts = activities.filter(
    (a) => a.type === 'communication_draft_generated' && a.channel === 'whatsapp'
  ).length
  const smsDrafts = activities.filter(
    (a) => a.type === 'communication_draft_generated' && a.channel === 'sms'
  ).length
  const totalDrafts = emailDrafts + whatsappDrafts + smsDrafts

  const humanApprovedCount = activities.filter((a) => a.humanApproved === true).length
  const simulatedSends = activities.filter(
    (a) => a.type === 'communication_sent' && (a.metadata?.simulated === true || a.metadata?.mode === 'sandbox')
  ).length
  const failedSends = activities.filter((a) => a.type === 'communication_failed').length

  // 4. AI Analytics
  const analyzedLeadsCount = filteredLeads.filter(
    (l) => Boolean(l.aiIntelligence || l.aiAnalysis)
  ).length
  const realAiCount = filteredLeads.filter(
    (l) => Boolean(l.aiIntelligence?.isRealAI || l.aiMetadata?.isRealAI)
  ).length
  const fallbackCount = Math.max(0, analyzedLeadsCount - realAiCount)

  // 5. Time-Series Trends
  const leadsOverTime = buildTimeSeries(filteredLeads, 'createdAt')
  const workflowRunsOverTime = buildTimeSeries(executions, 'startedAt')
  const activitiesOverTime = buildTimeSeries(filteredActivities, 'createdAt')

  // 6. Pipeline Funnel Stages
  const pipelineFunnel = [
    {
      stage: 'New',
      label: '1. Captured',
      count: countsByStatus.New + countsByStatus.Contacted + countsByStatus.Qualified + countsByStatus.Converted,
      description: 'Inbound lead captured in CRM',
    },
    {
      stage: 'Contacted',
      label: '2. Contacted',
      count: countsByStatus.Contacted + countsByStatus.Qualified + countsByStatus.Converted,
      description: 'Initial outreach or follow-up initiated',
    },
    {
      stage: 'Qualified',
      label: '3. Qualified',
      count: countsByStatus.Qualified + countsByStatus.Converted,
      description: 'Lead evaluated with strong business fit',
    },
    {
      stage: 'Converted',
      label: '4. Converted',
      count: countsByStatus.Converted,
      description: 'Successfully won customer accounts',
    },
  ]

  // Compute conversion drop-off
  const topStageCount = pipelineFunnel[0].count
  const funnelStagesWithRates = pipelineFunnel.map((stage, idx) => ({
    ...stage,
    share: topStageCount > 0 ? `${((stage.count / topStageCount) * 100).toFixed(1)}%` : '0.0%',
    dropoff:
      idx > 0 && pipelineFunnel[idx - 1].count > 0
        ? `${(((pipelineFunnel[idx - 1].count - stage.count) / pipelineFunnel[idx - 1].count) * 100).toFixed(1)}%`
        : '0.0%',
  }))

  const metricsSummary = {
    totalLeads,
    newLeads: countsByStatus.New,
    qualifiedLeads: countsByStatus.Qualified,
    convertedLeads: countsByStatus.Converted,
    highPriorityLeads: priorityBreakdown.High,
    averageAiScore,
    leadsRequiringFollowUp,
    completedTasks,
    pendingTasks,
    activeWorkflows,
    workflowSuccessRate: executionSuccessRate,
    communicationDrafts: totalDrafts,
    humanApprovedSends: simulatedSends,
    channelBreakdown: { email: emailDrafts, whatsapp: whatsappDrafts, sms: smsDrafts },
  }

  return {
    filters: {
      range,
      status,
      priority,
      channel,
    },
    kpis: {
      totalLeads,
      newLeads: countsByStatus.New,
      contactedLeads: countsByStatus.Contacted,
      qualifiedLeads: countsByStatus.Qualified,
      convertedLeads: countsByStatus.Converted,
      lostLeads: countsByStatus.Lost,
      highPriorityLeads: priorityBreakdown.High,
      averageAiScore,
      leadsRequiringFollowUp,
      completedFollowUpTasks: completedTasks,
      activeAiAgents: agents.filter((a) => a.status === 'Active').length,
      activeWorkflows,
      pendingTasks,
    },
    pipeline: {
      funnel: funnelStagesWithRates,
      statusBreakdown: [
        { status: 'New', count: countsByStatus.New, tone: 'new' },
        { status: 'Contacted', count: countsByStatus.Contacted, tone: 'contacted' },
        { status: 'Qualified', count: countsByStatus.Qualified, tone: 'qualified' },
        { status: 'Converted', count: countsByStatus.Converted, tone: 'converted' },
        { status: 'Lost', count: countsByStatus.Lost, tone: 'lost' },
      ],
      conversionRate: `${conversionRate}%`,
      qualificationRate: `${qualificationRate}%`,
      priorityBreakdown,
      scoreDistribution: scoreTiers,
    },
    workflows: {
      totalWorkflows,
      activeWorkflows,
      inactiveWorkflows,
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      waitingReviewExecutions,
      successRate: executionSuccessRate,
      recentExecutions,
    },
    communications: {
      emailDrafts,
      whatsappDrafts,
      smsDrafts,
      totalDrafts,
      humanApprovedCount,
      simulatedSends,
      failedSends,
      channelBreakdown: {
        email: emailDrafts,
        whatsapp: whatsappDrafts,
        sms: smsDrafts,
      },
      sandboxNotice:
        'All communication channels operate in Development Sandbox Mode. Simulated sends are marked internally and not delivered to external carrier networks.',
    },
    aiAnalytics: {
      averageAiScore,
      highPriorityLeads: priorityBreakdown.High,
      mediumPriorityLeads: priorityBreakdown.Medium,
      lowPriorityLeads: priorityBreakdown.Low,
      analyzedLeadsCount,
      realAiCount,
      fallbackCount,
      humanReviewRequiredCount: analyzedLeadsCount,
    },
    tasks: {
      pendingTasks,
      completedTasks,
      overdueTasks,
      totalTasks: tasks.length,
    },
    timeSeries: {
      leadsOverTime,
      workflowRunsOverTime,
      activitiesOverTime,
    },
    crmIntelligence: {
      analyzedLeads: analyzedLeadsCount,
      highPriorityLeads: priorityBreakdown.High,
      averageAiScore,
      leadsRequiringFollowUp,
    },
    leadAnalytics: {
      totalLeads,
      conversionRate,
      qualifiedRate: qualificationRate,
      leadStatusBreakdown: [
        { status: 'New', count: countsByStatus.New, tone: 'new' },
        { status: 'Contacted', count: countsByStatus.Contacted, tone: 'contacted' },
        { status: 'Qualified', count: countsByStatus.Qualified, tone: 'qualified' },
        { status: 'Converted', count: countsByStatus.Converted, tone: 'converted' },
        { status: 'Lost', count: countsByStatus.Lost, tone: 'lost' },
      ],
    },
    workflowAnalytics: {
      totalWorkflows,
      activeWorkflows,
      inactiveWorkflows,
      successfulExecutions,
      failedExecutions,
    },
    taskAnalytics: {
      pendingTasks,
      completedTasks,
      overdueTasks,
      totalTasks: tasks.length,
    },
    recentActivities: activities.slice(0, 15),
    metricsSummary,
  }
}

/**
 * GET /api/analytics
 * Dynamically aggregate operational metrics based on real database data
 */
export const getAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id
    const aggregated = await aggregateUserMetrics(userId, req.query)

    // Generate bounded AI insights from aggregate summary
    let aiInsights = null
    try {
      aiInsights = await generateAnalyticsInsights(aggregated.metricsSummary)
    } catch (aiErr) {
      console.warn('[AnalyticsController] AI Insights fallback:', aiErr.message)
      aiInsights = {
        insights: [
          {
            title: 'Operational Baseline Established',
            category: 'Pipeline',
            insight: `Workspace currently managing ${aggregated.kpis.totalLeads} leads with ${aggregated.kpis.activeWorkflows} active workflows.`,
            supportingMetric: `${aggregated.kpis.totalLeads} Leads`,
            recommendedAction: 'Review high-priority leads and follow-up task queue.',
          },
        ],
        isRealAI: false,
        humanReviewRequired: true,
        generatedAt: new Date().toISOString(),
      }
    }

    // Never commingle internal stack traces or metricsSummary internals
    const { metricsSummary, ...clientAnalytics } = aggregated

    return res.status(200).json({
      success: true,
      analytics: {
        ...clientAnalytics,
        aiInsights,
      },
    })
  } catch (error) {
    next(error)
  }
}

/**
 * GET /api/analytics/insights
 * Generates fresh on-demand AI Insights for the authenticated user
 */
export const getInsightsEndpoint = async (req, res, next) => {
  try {
    const userId = req.user._id
    const aggregated = await aggregateUserMetrics(userId, req.query)
    const aiInsights = await generateAnalyticsInsights(aggregated.metricsSummary)

    return res.status(200).json({
      success: true,
      aiInsights,
    })
  } catch (error) {
    next(error)
  }
}

export default {
  getAnalytics,
  getInsightsEndpoint,
}
