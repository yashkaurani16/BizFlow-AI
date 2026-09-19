import SectionCard from './SectionCard.jsx'

function TaskAnalyticsSection({ data }) {
  const { totalTasks, pendingTasks, completedTasks, overdueTasks } = data

  return (
    <SectionCard title="Follow-Up Tasks & Operational Urgency">
      <div className="task-analytics-grid">
        <div className="task-stat-card card-pending">
          <span className="task-stat-count">{pendingTasks}</span>
          <span className="task-stat-label">Pending Review</span>
          <span className="task-stat-sub">Action required by team</span>
        </div>
        <div className="task-stat-card card-completed">
          <span className="task-stat-count">{completedTasks}</span>
          <span className="task-stat-label">Completed</span>
          <span className="task-stat-sub">Processed through workflow</span>
        </div>
        <div className="task-stat-card card-overdue">
          <span className="task-stat-count">{overdueTasks}</span>
          <span className="task-stat-label">Overdue / Attention</span>
          <span className="task-stat-sub">Pending longer than target</span>
        </div>
        <div className="task-stat-card card-total">
          <span className="task-stat-count">{totalTasks}</span>
          <span className="task-stat-label">Total Tracked</span>
          <span className="task-stat-sub">Across all active CRM leads</span>
        </div>
      </div>
    </SectionCard>
  )
}

export default TaskAnalyticsSection
