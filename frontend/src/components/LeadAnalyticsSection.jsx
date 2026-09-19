import { Link } from 'react-router-dom'
import SectionCard from './SectionCard.jsx'
import StatusBadge from './StatusBadge.jsx'

function LeadAnalyticsSection({ data }) {
  const {
    totalLeads,
    conversionRate,
    qualifiedRate,
    leadStatusBreakdown = [],
  } = data

  return (
    <SectionCard
      title="Lead Overview & Pipeline Performance"
      actions={
        <Link to="/leads" className="btn btn-secondary btn-compact">
          View All Leads
        </Link>
      }
    >
      <div className="lead-analytics-grid">
        <div className="lead-chart-column">
          <div className="conversion-stats-banner">
            <div className="rate-card">
              <span className="rate-value">{conversionRate}%</span>
              <span className="rate-label">Lead Conversion Rate</span>
            </div>
            <div className="rate-card">
              <span className="rate-value">{qualifiedRate}%</span>
              <span className="rate-label">Lead Qualification Rate</span>
            </div>
          </div>

          <div className="lead-distribution-container">
            <h3 className="subheading-title">Status Distribution</h3>
            <div className="lead-bar" role="img" aria-label="Lead status distribution chart">
              {leadStatusBreakdown.map((item) => {
                const width = totalLeads > 0 ? `${(item.count / totalLeads) * 100}%` : '0%'
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
              {leadStatusBreakdown.map((item) => (
                <li key={item.status}>
                  <span className={`legend-dot lead-bar-${item.tone}`} aria-hidden="true" />
                  <span>
                    {item.status}: <strong>{item.count}</strong>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="lead-table-column">
          <h3 className="subheading-title">Status Breakdown (Data Table)</h3>
          <div className="analytics-table-wrap">
            <table className="analytics-table" aria-label="Lead Status Breakdown">
              <thead>
                <tr>
                  <th scope="col">Status</th>
                  <th scope="col">Count</th>
                  <th scope="col">Share</th>
                </tr>
              </thead>
              <tbody>
                {leadStatusBreakdown.map((item) => {
                  const share =
                    totalLeads > 0
                      ? `${((item.count / totalLeads) * 100).toFixed(1)}%`
                      : '0.0%'
                  return (
                    <tr key={item.status}>
                      <td>
                        <StatusBadge status={item.status} />
                      </td>
                      <td><strong>{item.count}</strong></td>
                      <td>{share}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SectionCard>
  )
}

export default LeadAnalyticsSection
