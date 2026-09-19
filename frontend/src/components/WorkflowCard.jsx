import { Link } from 'react-router-dom'
import Button from './Button.jsx'
import Card from './Card.jsx'
import StatusBadge from './StatusBadge.jsx'

function WorkflowCard({ workflow, onToggleStatus }) {
  const isActive = workflow.status === 'Active'
  const stepCount = workflow.steps?.length || 5

  return (
    <Card className={`workflow-card ${isActive ? 'is-active' : 'is-inactive'}`}>
      <div className="workflow-card-header">
        <div className="workflow-card-title-group">
          <h2 className="workflow-card-name">{workflow.name}</h2>
          <span className="workflow-trigger-badge">Trigger: {workflow.trigger}</span>
        </div>
        <StatusBadge status={workflow.status} />
      </div>

      <p className="workflow-card-description">{workflow.description}</p>

      <div className="workflow-card-meta">
        <div className="workflow-meta-item">
          <span className="meta-label">Assigned Agent</span>
          <span className="meta-value">{workflow.agent}</span>
        </div>
        <div className="workflow-meta-item">
          <span className="meta-label">Steps</span>
          <span className="meta-value">{stepCount} Steps (Fixed MVP Flow)</span>
        </div>
        <div className="workflow-meta-item">
          <span className="meta-label">Last Execution</span>
          <span className="meta-value">{workflow.lastExecution}</span>
        </div>
        <div className="workflow-meta-item">
          <span className="meta-label">Execution Status</span>
          <span className="meta-value">
            <StatusBadge status={workflow.executionStatus} />
          </span>
        </div>
      </div>

      <div className="workflow-card-actions">
        <Link to={`/workflows/${workflow.id}`} className="btn btn-secondary btn-compact">
          View Details
        </Link>
        <Link to={`/workflows/${workflow.id}/edit`} className="btn btn-secondary btn-compact">
          Edit
        </Link>
        <Button
          variant={isActive ? 'ghost' : 'primary'}
          className={`btn-compact ${isActive ? 'btn-deactivate' : 'btn-activate'}`}
          onClick={() => onToggleStatus(workflow)}
        >
          {isActive ? 'Deactivate' : 'Activate'}
        </Button>
      </div>
    </Card>
  )
}

export default WorkflowCard
