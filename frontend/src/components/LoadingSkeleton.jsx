function LoadingSkeleton({ variant = 'dashboard' }) {
  if (variant === 'leads') {
    return (
      <div className="leads-page" aria-busy="true" aria-live="polite">
        <p className="sr-only">Loading leads</p>
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-text" />
        <div className="skeleton skeleton-panel skeleton-panel-wide" />
      </div>
    )
  }

  return (
    <div className="dashboard" aria-busy="true" aria-live="polite">
      <p className="sr-only">Loading dashboard</p>
      <div className="dashboard-welcome">
        <div>
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-text" />
        </div>
        <div className="skeleton skeleton-button" />
      </div>
      <div className="stat-grid">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="skeleton skeleton-stat" />
        ))}
      </div>
      <div className="dashboard-split">
        <div className="skeleton skeleton-panel" />
        <div className="skeleton skeleton-panel" />
      </div>
      <div className="skeleton skeleton-panel skeleton-panel-wide" />
    </div>
  )
}

export default LoadingSkeleton
