import { Link } from 'react-router-dom'
import ActivityItem from '../components/ActivityItem.jsx'
import ActiveWorkflowCard from '../components/ActiveWorkflowCard.jsx'
import { EmptyState, ErrorState } from '../components/EmptyState.jsx'
import LeadStatusOverview from '../components/LeadStatusOverview.jsx'
import LoadingSkeleton from '../components/LoadingSkeleton.jsx'
import QuickAction from '../components/QuickAction.jsx'
import SectionCard from '../components/SectionCard.jsx'
import StatCard from '../components/StatCard.jsx'
import { useDashboardData } from '../hooks/useDashboardData.js'
import { getGreeting } from '../utils/greeting.js'

function DashboardPage() {
  const { status, data, error, isEmpty, retry } = useDashboardData()

  if (status === 'loading') {
    return <LoadingSkeleton />
  }

  if (status === 'error') {
    return <ErrorState title="Dashboard unavailable" message={error} onRetry={retry} />
  }

  if (isEmpty) {
    return (
      <EmptyState
        title="No leads yet"
        message="Add a lead to start the New Lead follow-up workflow, track activities, and see business metrics here."
        actionLabel="+ Add Lead"
        actionTo="/leads/new"
      />
    )
  }

  const greeting = `${getGreeting()}, ${data.user.name}`

  return (
    <div className="dashboard">
      <div className="dashboard-welcome">
        <div>
          <h1>{greeting}</h1>
          <p>Here's what's happening with your business automation today.</p>
        </div>
        <Link to="/leads/new" className="btn btn-primary">
          + Add Lead
        </Link>
      </div>

      <section className="stat-grid" aria-label="Key metrics">
        {data.stats.map((stat) => (
          <StatCard
            key={stat.id}
            label={stat.label}
            value={stat.value}
            hint={stat.hint}
            tone={stat.tone}
            icon={stat.icon}
          />
        ))}
      </section>

      <div className="dashboard-split">
        <SectionCard title="Lead status overview">
          <LeadStatusOverview items={data.leadStatusOverview} />
        </SectionCard>
        <SectionCard title="New Lead Follow-Up">
          <ActiveWorkflowCard workflow={data.activeWorkflow} />
        </SectionCard>
      </div>

      <SectionCard title="Recent activities">
        <ol className="activity-list">
          {data.recentActivities.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))}
        </ol>
      </SectionCard>

      <SectionCard title="Quick actions">
        <div className="quick-actions">
          {data.quickActions.map((action) => (
            <QuickAction
              key={action.id}
              label={action.label}
              to={action.to}
              variant={action.variant}
            />
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

export default DashboardPage
