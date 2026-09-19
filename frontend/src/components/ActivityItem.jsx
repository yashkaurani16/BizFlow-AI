import StatusBadge from './StatusBadge.jsx'

function ActivityIcon({ type }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }

  if (type === 'lead_analyzed') {
    return (
      <svg {...common}>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3-3" />
      </svg>
    )
  }

  if (type === 'task_created') {
    return (
      <svg {...common}>
        <path d="M9 11l2 2 4-4" />
        <rect x="4" y="4" width="16" height="16" rx="2" />
      </svg>
    )
  }

  if (type === 'status_changed') {
    return (
      <svg {...common}>
        <path d="M4 7h11M4 12h16M4 17h9" />
      </svg>
    )
  }

  if (type === 'workflow_executed') {
    return (
      <svg {...common}>
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    )
  }

  return (
    <svg {...common}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function ActivityItem({ activity }) {
  return (
    <li className="activity-item">
      <span className="activity-icon">
        <ActivityIcon type={activity.type} />
      </span>
      <div className="activity-body">
        <div className="activity-top">
          <p className="activity-title">{activity.title}</p>
          <StatusBadge status={activity.status} />
        </div>
        <p className="activity-description">{activity.description}</p>
        <p className="activity-time">
          <time dateTime={activity.time}>{activity.time}</time>
        </p>
      </div>
    </li>
  )
}

export default ActivityItem
