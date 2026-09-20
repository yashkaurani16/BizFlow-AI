import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Button from '../components/Button.jsx'
import Card from '../components/Card.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { ErrorState } from '../components/EmptyState.jsx'
import SectionCard from '../components/SectionCard.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import WorkflowExecutionViewer from '../components/WorkflowExecutionViewer.jsx'
import WorkflowSafetyNotice from '../components/WorkflowSafetyNotice.jsx'
import { useWorkflows } from '../context/WorkflowsContext.jsx'
import { useToast } from '../context/ToastContext.jsx'

function WorkflowDetailsPage() {
  const { id } = useParams()
  const { getWorkflow, toggleWorkflowStatus } = useWorkflows()
  const { showToast } = useToast()
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)

  const workflow = getWorkflow(id)

  if (!workflow) {
    return (
      <ErrorState
        title="Workflow not found"
        message="This workflow is not in the current configuration list."
        actionLabel="Back to Workflows"
        actionTo="/workflows"
      />
    )
  }

  const isActive = workflow.status === 'Active'

  function handleStatusToggleClick() {
    if (isActive) {
      setConfirmDeactivate(true)
    } else {
      toggleWorkflowStatus(workflow.id)
      showToast(`${workflow.name} is now active.`)
    }
  }

  function handleConfirmDeactivate() {
    toggleWorkflowStatus(workflow.id)
    showToast(`${workflow.name} is now inactive.`, 'info')
    setConfirmDeactivate(false)
  }

  return (
    <div className="workflow-details-page">
      <div className="page-heading">
        <div>
          <div className="heading-with-badge">
            <h1>{workflow.name}</h1>
            <StatusBadge status={workflow.status} />
          </div>
          <p>Review automation sequence, execution runs, and AI safety controls.</p>
        </div>
        <div className="heading-actions">
          <Button to={`/workflows/${workflow.id}/edit`}>Edit</Button>
          <Button
            variant={isActive ? 'secondary' : 'primary'}
            onClick={handleStatusToggleClick}
          >
            {isActive ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      </div>

      <div className="workflow-details-grid">
        <div className="workflow-details-main">
          <SectionCard title="Workflow Overview">
            <dl className="detail-list">
              <div>
                <dt>Workflow Name</dt>
                <dd>{workflow.name}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  <StatusBadge status={workflow.status} />
                </dd>
              </div>
              <div>
                <dt>Trigger</dt>
                <dd>
                  <span className="workflow-trigger-badge">{workflow.trigger}</span>
                </dd>
              </div>
              <div>
                <dt>Assigned Agent</dt>
                <dd>
                  <span className="agent-type-tag">{workflow.agent}</span>
                </dd>
              </div>
              <div>
                <dt>Created Date</dt>
                <dd>{workflow.createdLabel}</dd>
              </div>
              <div>
                <dt>Last Execution</dt>
                <dd>{workflow.lastExecution}</dd>
              </div>
              <div className="detail-span">
                <dt>Description</dt>
                <dd>{workflow.description}</dd>
              </div>
            </dl>
          </SectionCard>

          <SectionCard title="Approved Workflow Steps Sequence">
            {workflow.nodes && workflow.nodes.length > 0 ? (
              <div className="wf-visual-flow-viewer">
                <p className="muted-copy" style={{ marginBottom: '0.75rem' }}>
                  Connected visual steps for this automated workflow ({workflow.nodes.length} steps):
                </p>
                <div className="wf-visual-flow-nodes">
                  {workflow.nodes.map((node, idx) => (
                    <div key={node.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div className="wf-visual-flow-node">
                        <span
                          className={`wf-node-cat-pill`}
                          style={{
                            fontSize: '0.62rem',
                            padding: '0.1rem 0.3rem',
                            alignSelf: 'flex-start',
                          }}
                        >
                          {node.category.toUpperCase()}
                        </span>
                        <strong style={{ fontSize: '0.8rem', color: 'var(--color-text)' }}>
                          {node.label || node.type}
                        </strong>
                        {node.category === 'communication' && (
                          <span
                            style={{
                              fontSize: '0.65rem',
                              color: '#b45309',
                              background: '#fef3c7',
                              padding: '0.1rem 0.25rem',
                              borderRadius: '4px',
                            }}
                          >
                            🔒 Human Approval
                          </span>
                        )}
                      </div>
                      {idx < workflow.nodes.length - 1 && (
                        <span className="wf-visual-flow-connector" aria-hidden="true">
                          →
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <p className="muted-copy" style={{ marginBottom: '1.25rem' }}>
                  The fixed 5-step follow-up automation executing on every new lead:
                </p>
                <ol className="vertical-workflow-stepper">
                  {workflow.steps.map((stepName, index) => (
                    <li key={typeof stepName === 'object' ? stepName.name || stepName.id : stepName} className="vertical-step-item">
                      <div className="vertical-marker-col">
                        <span className="vertical-step-badge">{index + 1}</span>
                        {index < workflow.steps.length - 1 ? <span className="vertical-step-arrow" aria-hidden="true" /> : null}
                      </div>
                      <div className="vertical-step-content">
                        <h3 className="vertical-step-title">{typeof stepName === 'object' ? stepName.name : stepName}</h3>
                        <p className="vertical-step-desc">
                          {index === 0 && 'Inbound lead captured and safely stored in CRM.'}
                          {index === 1 && 'Assigned AI Agent reviews lead details and evaluates next actions.'}
                          {index === 2 && 'Structured analysis output saved directly to the lead record.'}
                          {index === 3 && 'Actionable follow-up task created for human team review.'}
                          {index === 4 && 'Activity timeline record created for audit and workspace tracking.'}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </>
            )}
          </SectionCard>

          <WorkflowExecutionViewer executions={workflow.executions} />
        </div>

        <div className="workflow-details-side">
          <WorkflowSafetyNotice
            aiProvider={workflow.aiProvider}
            executionMode={workflow.executionMode}
            humanReview={workflow.humanReview}
            externalActions={workflow.externalActions}
          />

          <Card className="workflow-actions-card">
            <h2>Quick Navigation</h2>
            <p className="muted-copy">Manage leads or review the assigned AI agent configuration.</p>
            <div className="form-actions" style={{ marginTop: '1rem' }}>
              <Link to="/leads" className="btn btn-secondary btn-compact">
                View CRM Leads
              </Link>
              <Link to="/agents" className="btn btn-secondary btn-compact">
                View AI Agents
              </Link>
              <Link to="/workflows" className="btn btn-ghost btn-compact">
                Back to Workflows
              </Link>
            </div>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDeactivate}
        title={`Deactivate ${workflow.name}?`}
        message="The workflow configuration will remain available, but new executions will not start while it is inactive."
        confirmLabel="Deactivate"
        onConfirm={handleConfirmDeactivate}
        onCancel={() => setConfirmDeactivate(false)}
      />
    </div>
  )
}

export default WorkflowDetailsPage
