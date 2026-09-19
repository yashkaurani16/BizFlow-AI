import { Link } from 'react-router-dom'
import Alert from './Alert.jsx'
import SectionCard from './SectionCard.jsx'
import StatusBadge from './StatusBadge.jsx'

function AgentAnalyticsSection({ data }) {
  const { totalAgents, activeAgents, inactiveAgents, agentActivityList = [] } = data

  return (
    <SectionCard
      title="AI Agent Utilization & Activity"
      actions={
        <Link to="/agents" className="btn btn-secondary btn-compact">
          Manage Agents
        </Link>
      }
    >
      <div className="analytics-summary-chips">
        <div className="summary-chip">
          <span className="chip-label">Total Agents</span>
          <span className="chip-value">{totalAgents}</span>
        </div>
        <div className="summary-chip">
          <span className="chip-label">Active Agents</span>
          <span className="chip-value text-success">{activeAgents}</span>
        </div>
        <div className="summary-chip">
          <span className="chip-label">Inactive Agents</span>
          <span className="chip-value text-muted">{inactiveAgents}</span>
        </div>
      </div>

      <div className="analytics-table-wrap" style={{ marginTop: '1rem' }}>
        <table className="analytics-table" aria-label="AI Agent Activity Summary">
          <thead>
            <tr>
              <th scope="col">Agent</th>
              <th scope="col">Type</th>
              <th scope="col">Status</th>
              <th scope="col">Activity Count</th>
              <th scope="col">Last Activity</th>
            </tr>
          </thead>
          <tbody>
            {agentActivityList.map((agent) => (
              <tr key={agent.id}>
                <td>
                  <strong>{agent.name}</strong>
                </td>
                <td>
                  <span className="agent-type-tag">{agent.type}</span>
                </td>
                <td>
                  <StatusBadge status={agent.status} />
                </td>
                <td>
                  <span className="activity-count-badge">{agent.activityCount} actions</span>
                </td>
                <td>{agent.lastActivity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <Alert tone="info">
          <p>
            <strong>AI Provider: Not connected.</strong> AI agent activity shown above represents mock/configuration-level data. No autonomous AI executions or external messaging channels are active.
          </p>
        </Alert>
      </div>
    </SectionCard>
  )
}

export default AgentAnalyticsSection
