import { useEffect, useMemo, useState } from 'react'
import AgentAnalyticsSection from '../components/AgentAnalyticsSection.jsx'
import { EmptyState, ErrorState } from '../components/EmptyState.jsx'
import LeadAnalyticsSection from '../components/LeadAnalyticsSection.jsx'
import RecentActivitySection from '../components/RecentActivitySection.jsx'
import Select from '../components/Select.jsx'
import StatCard from '../components/StatCard.jsx'
import TaskAnalyticsSection from '../components/TaskAnalyticsSection.jsx'
import WorkflowAnalyticsSection from '../components/WorkflowAnalyticsSection.jsx'
import { useAgents } from '../context/AgentsContext.jsx'
import { useLeads } from '../context/LeadsContext.jsx'
import { useWorkflows } from '../context/WorkflowsContext.jsx'
import { computeAnalyticsMetrics, DATE_RANGE_OPTIONS } from '../data/analyticsData.js'
import { analyticsApi } from '../services/api.js'

function AnalyticsPage() {
  const { leads } = useLeads()
  const { agents } = useAgents()
  const { workflows } = useWorkflows()
  const [dateRange, setDateRange] = useState('All Time')
  const [retryKey, setRetryKey] = useState(0)
  const [serverAnalytics, setServerAnalytics] = useState(null)

  useEffect(() => {
    let active = true
    analyticsApi
      .getAnalytics(dateRange)
      .then((res) => {
        if (active && res && res.success && res.analytics) {
          setServerAnalytics(res.analytics)
        }
      })
      .catch((err) => {
        console.warn('[AnalyticsPage] Server analytics unavailable, using local calculation:', err.message)
      })

    return () => {
      active = false
    }
  }, [dateRange, retryKey])

  const { analytics, error } = useMemo(() => {
    try {
      if (serverAnalytics) {
        return { analytics: serverAnalytics, error: null }
      }
      return {
        analytics: computeAnalyticsMetrics(leads, agents, workflows, dateRange),
        error: null,
      }
    } catch (err) {
      return {
        analytics: null,
        error: err?.message || 'Unable to compute analytics.',
      }
    }
  }, [serverAnalytics, leads, agents, workflows, dateRange])

  if (error) {
    return (
      <ErrorState
        title="Unable to load analytics"
        message={error}
        onRetry={() => setRetryKey((k) => k + 1)}
        actionLabel="Back to Dashboard"
        actionTo="/dashboard"
      />
    )
  }

  const hasNoDataAtAll = leads.length === 0 && agents.length === 0 && workflows.length === 0

  if (hasNoDataAtAll) {
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
    kpis,
    leadAnalytics,
    agentAnalytics,
    workflowAnalytics,
    taskAnalytics,
    recentActivities,
  } = analytics

  return (
    <div className="analytics-page">
      <div className="page-heading">
        <div>
          <h1>Analytics</h1>
          <p>Monitor leads, AI agent activity, workflow activity, and basic business performance.</p>
        </div>
        <div className="analytics-header-actions">
          <Select
            id="analytics-date-range"
            label="Date Range"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            {DATE_RANGE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <section className="analytics-kpi-grid" aria-label="Key Performance Indicators">
        <StatCard
          label="Total Leads"
          value={kpis.totalLeads}
          hint="Captured in CRM"
          tone="info"
          icon="leads"
        />
        <StatCard
          label="New Leads"
          value={kpis.newLeads}
          hint="Awaiting outreach"
          tone="neutral"
          icon="leads"
        />
        <StatCard
          label="Qualified Leads"
          value={kpis.qualifiedLeads}
          hint="High business fit"
          tone="success"
          icon="leads"
        />
        <StatCard
          label="Converted Leads"
          value={kpis.convertedLeads}
          hint="Closed customers"
          tone="success"
          icon="leads"
        />
        <StatCard
          label="Active AI Agents"
          value={kpis.activeAgents}
          hint={`${agentAnalytics.totalAgents} configured`}
          tone="info"
          icon="agents"
        />
        <StatCard
          label="Active Workflows"
          value={kpis.activeWorkflows}
          hint={`${workflowAnalytics.totalWorkflows} configured`}
          tone="neutral"
          icon="workflows"
        />
        <StatCard
          label="Follow-Up Tasks"
          value={kpis.totalTasks}
          hint={`${taskAnalytics.pendingTasks} pending`}
          tone="warning"
          icon="tasks"
        />
      </section>

      <LeadAnalyticsSection data={leadAnalytics} />

      <div className="dashboard-split">
        <TaskAnalyticsSection data={taskAnalytics} />
        <AgentAnalyticsSection data={agentAnalytics} />
      </div>

      <WorkflowAnalyticsSection data={workflowAnalytics} workflows={workflows} />

      <RecentActivitySection activities={recentActivities} />
    </div>
  )
}

export default AnalyticsPage
