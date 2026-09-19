function LeadStatusOverview({ items }) {
  const total = items.reduce((sum, item) => sum + item.count, 0)

  return (
    <div className="lead-overview">
      <div className="lead-bar" role="img" aria-label="Lead status distribution">
        {items.map((item) => {
          const width = total ? `${(item.count / total) * 100}%` : '0%'
          return (
            <span
              key={item.status}
              className={`lead-bar-segment lead-bar-${item.tone}`}
              style={{ width }}
              title={`${item.status}: ${item.count}`}
            />
          )
        })}
      </div>
      <ul className="lead-legend">
        {items.map((item) => (
          <li key={item.status}>
            <span className={`legend-dot lead-bar-${item.tone}`} aria-hidden="true" />
            <span>
              {item.status}: {item.count}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default LeadStatusOverview
