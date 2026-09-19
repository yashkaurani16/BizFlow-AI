import { Link } from 'react-router-dom'
import Button from './Button.jsx'
import Card from './Card.jsx'
import StatusBadge from './StatusBadge.jsx'

function AgentCard({ agent, onToggleStatus }) {
  const isActive = agent.status === 'Active'

  return (
    <Card className={`agent-card ${isActive ? 'is-active' : 'is-inactive'}`}>
      <div className="agent-card-header">
        <div className="agent-card-title-group">
          <h2 className="agent-card-name">{agent.name}</h2>
          <span className="agent-type-tag">{agent.type}</span>
        </div>
        <StatusBadge status={agent.status} />
      </div>

      <p className="agent-card-description">{agent.description}</p>

      <div className="agent-card-meta">
        <div className="agent-meta-item">
          <span className="meta-label">Created</span>
          <span className="meta-value">{agent.createdLabel}</span>
        </div>
        <div className="agent-meta-item">
          <span className="meta-label">Last activity</span>
          <span className="meta-value">{agent.lastActivity}</span>
        </div>
      </div>

      <div className="agent-card-actions">
        <Link to={`/agents/${agent.id}`} className="btn btn-secondary btn-compact">
          View Details
        </Link>
        <Link to={`/agents/${agent.id}/edit`} className="btn btn-secondary btn-compact">
          Edit
        </Link>
        <Button
          variant={isActive ? 'ghost' : 'primary'}
          className={`btn-compact ${isActive ? 'btn-deactivate' : 'btn-activate'}`}
          onClick={() => onToggleStatus(agent)}
        >
          {isActive ? 'Deactivate' : 'Activate'}
        </Button>
      </div>
    </Card>
  )
}

export default AgentCard
