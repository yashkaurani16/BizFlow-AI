import { Link } from 'react-router-dom'
import Button from './Button.jsx'
import Card from './Card.jsx'
import StatusBadge from './StatusBadge.jsx'

function WorkflowCard({ workflow, onToggleStatus, onDelete }) {
  const isActive = workflow.status === 'Active'
  const isVisual = workflow.isVisualWorkflow || (workflow.nodes && workflow.nodes.length > 0)
  const stepCount = isVisual ? workflow.nodes.length : workflow.steps?.length || 5
  const hasCommNodes = isVisual && workflow.nodes?.some((n) => n.category === 'communication')

  return (
    <Card className={`workflow-card ${isActive ? 'is-active' : 'is-inactive'}`}>
      <div className="workflow-card-header">
        <div className="workflow-card-title-group">
          <h2 className="workflow-card-name">{workflow.name}</h2>
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            <span className="workflow-trigger-badge">Trigger: {workflow.trigger}</span>
            {isVisual && (
              <span className="workflow-trigger-badge" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                🎨 Visual
              </span>
            )}
            {hasCommNodes && (
              <span className="workflow-trigger-badge" style={{ background: '#fef3c7', color: '#b45309' }}>
                🔒 Human Review
              </span>
            )}
          </div>
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
          <span className="meta-value">
            {stepCount} Steps {isVisual ? '(Visual Flow)' : '(Fixed MVP Flow)'}
          </span>
        </div>
        <div className="workflow-meta-item">
          <span className="meta-label">Last Execution</span>
          <span className="meta-value">{workflow.lastExecution || 'Never executed'}</span>
        </div>
        <div className="workflow-meta-item">
          <span className="meta-label">Execution Status</span>
          <span className="meta-value">
            <StatusBadge status={workflow.executionStatus || 'Pending'} />
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
        {onDelete && (
          <Button
            variant="danger"
            className="btn-compact"
            onClick={() => onDelete(workflow)}
            title="Delete workflow"
          >
            Delete
          </Button>
        )}
      </div>
    </Card>
  )
}

export default WorkflowCard

