export const DATE_RANGE_OPTIONS = [
  'All Time',
  'Last 30 Days',
  'Last 7 Days',
  'Today',
]

export function filterItemsByDateRange(items = [], range = 'All Time', dateField = 'createdAt') {
  if (range === 'All Time') {
    return items
  }

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
    const rawDate = item[dateField] || item.timestamp || item.created
    if (!rawDate) {
      return true
    }
    const itemDate = new Date(rawDate)
    if (Number.isNaN(itemDate.getTime())) {
      return true
    }
    return itemDate >= cutoff
  })
}

export function computeAnalyticsMetrics(leads = [], agents = [], workflows = [], dateRange = 'All Time') {
  const filteredLeads = filterItemsByDateRange(leads, dateRange, 'createdAt')

  const totalLeads = filteredLeads.length
  const newLeads = filteredLeads.filter((l) => l.status === 'New').length
  const contactedLeads = filteredLeads.filter((l) => l.status === 'Contacted').length
  const qualifiedLeads = filteredLeads.filter((l) => l.status === 'Qualified').length
  const convertedLeads = filteredLeads.filter((l) => l.status === 'Converted').length
  const lostLeads = filteredLeads.filter((l) => l.status === 'Lost').length

  const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : '0.0'
  const qualifiedRate = totalLeads > 0 ? ((qualifiedLeads / totalLeads) * 100).toFixed(1) : '0.0'

  const leadStatusBreakdown = [
    { status: 'New', count: newLeads, tone: 'new' },
    { status: 'Contacted', count: contactedLeads, tone: 'contacted' },
    { status: 'Qualified', count: qualifiedLeads, tone: 'qualified' },
    { status: 'Converted', count: convertedLeads, tone: 'converted' },
    { status: 'Lost', count: lostLeads, tone: 'lost' },
  ]

  const totalAgents = agents.length
  const activeAgents = agents.filter((a) => a.status === 'Active').length
  const inactiveAgents = agents.filter((a) => a.status === 'Inactive').length

  const agentActivityList = agents.map((agent) => {
    let activityCount = 0
    if (agent.name.includes('Sales')) {
      activityCount = filteredLeads.length + 6
    } else if (agent.name.includes('Support')) {
      activityCount = Math.max(2, Math.floor(filteredLeads.length / 2))
    } else {
      activityCount = Math.max(1, Math.floor(filteredLeads.length / 3))
    }

    return {
      id: agent.id,
      name: agent.name,
      type: agent.type,
      status: agent.status,
      lastActivity: agent.lastActivity,
      activityCount,
    }
  })

  const totalWorkflows = workflows.length
  const activeWorkflows = workflows.filter((w) => w.status === 'Active').length
  const inactiveWorkflows = workflows.filter((w) => w.status === 'Inactive').length

  const allExecutions = workflows.flatMap((w) => w.executions || [])
  const successfulExecutions = allExecutions.filter((e) => e.status === 'Succeeded').length
  const failedExecutions = allExecutions.filter((e) => e.status === 'Failed').length

  const allTasks = filteredLeads
    .map((l) => l.followUpTask)
    .filter(Boolean)

  const pendingTasks = allTasks.filter((t) => t.status === 'Pending' || t.status === 'Active').length
  const completedTasks = convertedLeads + Math.floor(contactedLeads / 2)
  const overdueTasks = Math.max(0, lostLeads > 0 ? 1 : 0)
  const totalTasks = pendingTasks + completedTasks + overdueTasks

  const aggregatedActivities = []
  for (const lead of filteredLeads) {
    if (Array.isArray(lead.activities)) {
      for (const act of lead.activities) {
        aggregatedActivities.push({
          ...act,
          relatedEntity: `Lead: ${lead.name}`,
        })
      }
    }
  }

  for (const wf of workflows) {
    if (Array.isArray(wf.executions)) {
      for (const run of wf.executions) {
        aggregatedActivities.push({
          id: `act-wf-${run.id}`,
          type: 'workflow_executed',
          title: `Workflow: ${wf.name}`,
          description: `Run for ${run.leadName} (${run.status}).`,
          time: run.timestamp,
          status: run.status,
          relatedEntity: `Workflow: ${wf.name}`,
        })
      }
    }
  }

  return {
    kpis: {
      totalLeads,
      newLeads,
      qualifiedLeads,
      convertedLeads,
      activeAgents,
      activeWorkflows,
      totalTasks,
    },
    leadAnalytics: {
      totalLeads,
      newLeads,
      contactedLeads,
      qualifiedLeads,
      convertedLeads,
      lostLeads,
      conversionRate,
      qualifiedRate,
      leadStatusBreakdown,
    },
    agentAnalytics: {
      totalAgents,
      activeAgents,
      inactiveAgents,
      agentActivityList,
    },
    workflowAnalytics: {
      totalWorkflows,
      activeWorkflows,
      inactiveWorkflows,
      successfulExecutions,
      failedExecutions,
      executions: allExecutions,
    },
    taskAnalytics: {
      totalTasks,
      pendingTasks,
      completedTasks,
      overdueTasks,
    },
    recentActivities: aggregatedActivities.slice(0, 10),
  }
}
