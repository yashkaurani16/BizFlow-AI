import StatusBadge from './StatusBadge.jsx'

function FollowUpTaskCard({ task }) {
  if (!task) {
    return (
      <p className="muted-copy">No follow-up task yet. Tasks are created after a successful mock analysis.</p>
    )
  }

  return (
    <dl className="detail-list">
      <div>
        <dt>Status</dt>
        <dd>
          <StatusBadge status={task.status} />
        </dd>
      </div>
      <div>
        <dt>Task</dt>
        <dd>{task.task}</dd>
      </div>
      <div>
        <dt>Created</dt>
        <dd>{task.created}</dd>
      </div>
    </dl>
  )
}

export default FollowUpTaskCard
