function Icon({ name }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }

  if (name === 'agents') {
    return (
      <svg {...common}>
        <circle cx="12" cy="8" r="3" />
        <path d="M5 19a7 7 0 0 1 14 0" />
      </svg>
    )
  }

  if (name === 'workflows') {
    return (
      <svg {...common}>
        <rect x="4" y="4" width="6" height="6" rx="1" />
        <rect x="14" y="14" width="6" height="6" rx="1" />
        <path d="M10 7h4a3 3 0 0 1 3 3v4" />
      </svg>
    )
  }

  if (name === 'tasks') {
    return (
      <svg {...common}>
        <path d="M8 7h12M8 12h12M8 17h8" />
        <path d="M4 7h.01M4 12h.01M4 17h.01" />
      </svg>
    )
  }

  return (
    <svg {...common}>
      <path d="M4 19V7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
    </svg>
  )
}

function StatCard({ label, value, hint, tone = 'neutral', icon = 'leads' }) {
  return (
    <article className={`stat-card stat-card-${tone}`}>
      <div className="stat-card-icon" aria-hidden="true">
        <Icon name={icon} />
      </div>
      <p className="stat-card-label">{label}</p>
      <p className="stat-card-value">{value}</p>
      <p className="stat-card-hint">{hint}</p>
    </article>
  )
}

export default StatCard
