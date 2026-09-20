import React, { useEffect, useMemo, useState } from 'react'
import AgentAnalyticsSection from '../components/AgentAnalyticsSection.jsx'
import AIInsightsSection from '../components/AIInsightsSection.jsx'
import CommunicationAnalyticsSection from '../components/CommunicationAnalyticsSection.jsx'
import { EmptyState, ErrorState } from '../components/EmptyState.jsx'
import PipelineFunnelSection from '../components/PipelineFunnelSection.jsx'
import RecentActivitySection from '../components/RecentActivitySection.jsx'
import StatCard from '../components/StatCard.jsx'
import TaskAnalyticsSection from '../components/TaskAnalyticsSection.jsx'
import TimeSeriesChartSection from '../components/TimeSeriesChartSection.jsx'
import WorkflowAnalyticsSection from '../components/WorkflowAnalyticsSection.jsx'
import { useAgents } from '../context/AgentsContext.jsx'
import { useLeads } from '../context/LeadsContext.jsx'
import { useWorkflows } from '../context/WorkflowsContext.jsx'
import { computeAnalyticsMetrics, DATE_RANGE_OPTIONS } from '../data/analyticsData.js'
import { analyticsApi } from '../services/api.js'

const STATUS_OPTIONS = ['All', 'New', 'Contacted', 'Qualified', 'Converted', 'Lost']
const PRIORITY_OPTIONS = ['All', 'High', 'Medium', 'Low']
const CHANNEL_OPTIONS = [
  { value: 'All', label: 'All Channels' },
  { value: 'email', label: 'Email' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'sms', label: 'SMS' },
]

function AnalyticsPage() {
  const { leads } = useLeads()
  const { agents } = useAgents()
  const { workflows } = useWorkflows()

  // Filter States
  const [dateRange, setDateRange] = useState('All Time')
  const [statusFilter, setStatusFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [channelFilter, setChannelFilter] = useState('All')

  const [serverAnalytics, setServerAnalytics] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshingInsights, setIsRefreshingInsights] = useState(false)
  const [fetchError, setFetchError] = useState(null)
  const [retryKey, setRetryKey] = useState(0)

  // Fetch real operational metrics from backend
  useEffect(() => {
    let active = true
    setIsLoading(true)
    setFetchError(null)

    const params = {
      range: dateRange,
      status: statusFilter,
      priority: priorityFilter,
      channel: channelFilter,
    }

    analyticsApi
      .getAnalytics(params)
      .then((res) => {
        if (active && res && res.success && res.analytics) {
          setServerAnalytics(res.analytics)
        }
      })
      .catch((err) => {
        if (active) {
          console.warn('[AnalyticsPage] Server analytics unavailable, using local calculation:', err.message)
          // If network failure or local fallback
          setFetchError(null)
        }
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [dateRange, statusFilter, priorityFilter, channelFilter, retryKey])

  // Handle on-demand refresh of AI Strategic Insights
  const handleRefreshInsights = async () => {
    try {
      setIsRefreshingInsights(true)
      const params = {
        range: dateRange,
        status: statusFilter,
        priority: priorityFilter,
        channel: channelFilter,
      }
      const res = await analyticsApi.getInsights(params)
      if (res && res.success && res.aiInsights) {
        setServerAnalytics((prev) => (prev ? { ...prev, aiInsights: res.aiInsights } : prev))
      }
    } catch (err) {
      console.warn('[AnalyticsPage] Failed to refresh insights:', err.message)
    } finally {
      setIsRefreshingInsights(false)
    }
  }

  // Merged operational analytics
  const { analytics, error } = useMemo(() => {
    try {
      const local = computeAnalyticsMetrics(leads, agents, workflows, dateRange)
      if (serverAnalytics) {
        return {
          analytics: {
            ...serverAnalytics,
            // Ensure agentAnalytics fallback if server does not return agent table
            agentAnalytics: serverAnalytics.agentAnalytics || local.agentAnalytics,
          },
          error: null,
        }
      }
      return {
        analytics: local,
        error: null,
      }
    } catch (err) {
      return {
        analytics: null,
        error: err?.message || 'Unable to compute analytics.',
      }
    }
  }, [serverAnalytics, leads, agents, workflows, dateRange])

  if (fetchError || error) {
    return (
      <ErrorState
        title="Unable to load analytics"
        message={fetchError || error}
        onRetry={() => setRetryKey((k) => k + 1)}
        actionLabel="Back to Dashboard"
        actionTo="/dashboard"
      />
    )
  }

  const hasNoDataAtAll = leads.length === 0 && agents.length === 0 && workflows.length === 0

  if (hasNoDataAtAll && !serverAnalytics) {
    return (
      <EmptyState
        title="No analytics data available yet."
        message="Analytics will automatically compute and update as leads, AI agents, workflows, and activities are created."
        actionLabel="Add a Lead"
        actionTo="/leads/new"
      />
    )
  }

  const {
    kpis = {},
    pipeline,
    workflows: workflowData = {},
    communications = {},
    tasks: taskData = {},
    timeSeries = { leadsOverTime: [], workflowRunsOverTime: [], activitiesOverTime: [] },
    recentActivities = [],
    aiInsights = {},
    agentAnalytics = { totalAgents: 0, activeAgents: 0, inactiveAgents: 0, agentActivityList: [] },
  } = analytics || {}

  // Format activities for RecentActivitySection
  const formattedActivities = recentActivities.map((act, idx) => ({
    id: act._id || act.id || `act-${idx}`,
    type: act.type || 'activity_logged',
    title: act.title || (act.type ? act.type.replace(/_/g, ' ').toUpperCase() : 'System Activity'),
    description: act.description || 'Activity recorded in system audit logs.',
    status: act.metadata?.mode === 'sandbox' ? 'Sandbox' : act.status || 'Active',
    time: act.createdAt ? new Date(act.createdAt).toLocaleString() : act.time || 'Recently',
  }))

  return (
    <div className="analytics-page">
      <div className="page-heading">
        <div>
          <h1>Operational Analytics & AI Insights</h1>
          <p>
            Real-time business telemetry, conversion funnels, workflow velocity, and advisory AI insights.
          </p>
        </div>
      </div>

      {/* Step 22 Multi-Filter Bar */}
      <section className="analytics-filter-bar" aria-label="Analytics Filter Controls">
        <div className="analytics-filter-item">
          <label htmlFor="filter-range" className="analytics-filter-label">
            Range:
          </label>
          <select
            id="filter-range"
            className="analytics-filter-select"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            {DATE_RANGE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div className="analytics-filter-item">
          <label htmlFor="filter-status" className="analytics-filter-label">
            Lead Status:
          </label>
          <select
            id="filter-status"
            className="analytics-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        <div className="analytics-filter-item">
          <label htmlFor="filter-priority" className="analytics-filter-label">
            Priority:
          </label>
          <select
            id="filter-priority"
            className="analytics-filter-select"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            {PRIORITY_OPTIONS.map((pr) => (
              <option key={pr} value={pr}>
                {pr}
              </option>
            ))}
          </select>
        </div>

        <div className="analytics-filter-item">
          <label htmlFor="filter-channel" className="analytics-filter-label">
            Channel:
          </label>
          <select
            id="filter-channel"
            className="analytics-filter-select"
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
          >
            {CHANNEL_OPTIONS.map((ch) => (
              <option key={ch.value} value={ch.value}>
                {ch.label}
              </option>
            ))}
          </select>
        </div>

        {isLoading && (
          <span className="badge badge-neutral" style={{ marginLeft: 'auto', fontSize: '0.75rem' }}>
            Updating operational metrics...
          </span>
        )}
      </section>

      {/* Primary CRM Operational KPIs */}
      <section className="analytics-kpi-grid" aria-label="Key Performance Indicators">
        <StatCard
          label="Total Leads"
          value={kpis.totalLeads ?? leads.length}
          hint="Captured in CRM"
          tone="info"
          icon="leads"
        />
        <StatCard
          label="New Leads"
          value={kpis.newLeads ?? 0}
          hint="Awaiting outreach"
          tone="neutral"
          icon="leads"
        />
        <StatCard
          label="Contacted Leads"
          value={kpis.contactedLeads ?? 0}
          hint="Outreach active"
          tone="info"
          icon="leads"
        />
        <StatCard
          label="Qualified Leads"
          value={kpis.qualifiedLeads ?? 0}
          hint="Strong fit profile"
          tone="success"
          icon="leads"
        />
        <StatCard
          label="Converted Leads"
          value={kpis.convertedLeads ?? 0}
          hint="Closed customer accounts"
          tone="success"
          icon="leads"
        />
        <StatCard
          label="Lost Leads"
          value={kpis.lostLeads ?? 0}
          hint="Archived / Unresponsive"
          tone="warning"
          icon="leads"
        />
        <StatCard
          label="High-Priority Leads"
          value={kpis.highPriorityLeads ?? 0}
          hint="AI Score ≥ 75"
          tone="success"
          icon="leads"
        />
        <StatCard
          label="Average AI Score"
          value={kpis.averageAiScore !== undefined ? `${kpis.averageAiScore}` : '0'}
          hint="Evaluated lead quality"
          tone="info"
          icon="leads"
        />
        <StatCard
          label="Requires Follow-Up"
          value={kpis.leadsRequiringFollowUp ?? 0}
          hint="Pending action"
          tone="warning"
          icon="tasks"
        />
        <StatCard
          label="Completed Tasks"
          value={kpis.completedFollowUpTasks ?? taskData.completedTasks ?? 0}
          hint="Processed tasks"
          tone="success"
          icon="tasks"
        />
      </section>

      {/* Step 22: Advisory Strategic AI Insights */}
      <AIInsightsSection
        insights={aiInsights.insights || []}
        isRefreshing={isRefreshingInsights}
        onRefresh={handleRefreshInsights}
        isRealAI={aiInsights.isRealAI}
        generatedAt={aiInsights.generatedAt}
      />

      {/* Step 22: Lead Pipeline Funnel & Quality Distribution */}
      {pipeline && <PipelineFunnelSection pipeline={pipeline} />}

      {/* Step 22: Velocity & Trends Time Series */}
      <TimeSeriesChartSection timeSeries={timeSeries} />

      {/* Step 22: Communication Analytics Section */}
      <CommunicationAnalyticsSection communications={communications} />

      {/* Workflows, Tasks, and Agents */}
      <div className="dashboard-split">
        <WorkflowAnalyticsSection
          data={{
            totalWorkflows: workflowData.totalWorkflows ?? workflows.length,
            activeWorkflows: workflowData.activeWorkflows ?? workflows.filter((w) => w.status === 'Active').length,
            inactiveWorkflows: workflowData.inactiveWorkflows ?? workflows.filter((w) => w.status === 'Inactive').length,
            successfulExecutions: workflowData.successfulExecutions ?? 0,
            failedExecutions: workflowData.failedExecutions ?? 0,
          }}
          workflows={workflows}
        />
        <TaskAnalyticsSection
          data={{
            totalTasks: taskData.totalTasks ?? 0,
            pendingTasks: taskData.pendingTasks ?? kpis.pendingTasks ?? 0,
            completedTasks: taskData.completedTasks ?? 0,
            overdueTasks: taskData.overdueTasks ?? 0,
          }}
        />
      </div>

      <AgentAnalyticsSection data={agentAnalytics} />

      {/* Audit Log / Recent Cross-Module Activity */}
      <RecentActivitySection activities={formattedActivities} />
    </div>
  )
}

export default AnalyticsPage
