import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AgentProviderStatus from '../components/AgentProviderStatus.jsx'
import Button from '../components/Button.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { ErrorState } from '../components/EmptyState.jsx'
import SectionCard from '../components/SectionCard.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { useAgents } from '../context/AgentsContext.jsx'
import { useToast } from '../context/ToastContext.jsx'

function AgentDetailsPage() {
  const { id } = useParams()
  const { getAgent, toggleAgentStatus } = useAgents()
  const { showToast } = useToast()
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)

  const agent = getAgent(id)

  if (!agent) {
    return (
      <ErrorState
        title="Agent not found"
        message="This agent is not in the current configuration list."
        actionLabel="Back to AI Agents"
        actionTo="/agents"
      />
    )
  }

  const isActive = agent.status === 'Active'

  function handleStatusToggleClick() {
    if (isActive) {
      setConfirmDeactivate(true)
    } else {
      toggleAgentStatus(agent.id)
      showToast(`${agent.name} is now active.`)
    }
  }

  function handleConfirmDeactivate() {
    toggleAgentStatus(agent.id)
    showToast(`${agent.name} is now inactive.`, 'info')
    setConfirmDeactivate(false)
  }

  return (
    <div className="agent-details-page">
      <div className="page-heading">
        <div>
          <div className="heading-with-badge">
            <h1>{agent.name}</h1>
            <StatusBadge status={agent.status} />
          </div>
          <p>Review agent settings, operational instructions, and safety parameters.</p>
        </div>
        <div className="heading-actions">
          <Button to={`/agents/${agent.id}/edit`}>Edit</Button>
          <Button
            variant={isActive ? 'secondary' : 'primary'}
            onClick={handleStatusToggleClick}
          >
            {isActive ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      </div>

      <div className="agent-details-grid">
        <div className="agent-details-main">
          <SectionCard title="Agent Overview">
            <dl className="detail-list">
              <div>
                <dt>Agent Name</dt>
                <dd>{agent.name}</dd>
              </div>
              <div>
                <dt>Agent Type</dt>
                <dd>
                  <span className="agent-type-tag">{agent.type}</span>
                </dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  <StatusBadge status={agent.status} />
                </dd>
              </div>
              <div>
                <dt>Created Date</dt>
                <dd>{agent.createdLabel}</dd>
              </div>
              <div className="detail-span">
                <dt>Last Activity</dt>
                <dd>{agent.lastActivity}</dd>
              </div>
              <div className="detail-span">
                <dt>Description</dt>
                <dd>{agent.description}</dd>
              </div>
            </dl>
          </SectionCard>

          <SectionCard
            title="Operational Instructions"
            actions={
              <Link to={`/agents/${agent.id}/edit`} className="btn btn-ghost btn-compact">
                Edit Instructions
              </Link>
            }
          >
            <div className="instructions-container">
              <p className="instructions-text">{agent.instructions}</p>
            </div>
          </SectionCard>
        </div>

        <div className="agent-details-side">
          <AgentProviderStatus
            provider={agent.aiProvider}
            status={agent.aiStatus}
            humanReview={agent.humanReview}
          />

          <SectionCard title="Workflow Usage">
            <p className="muted-copy">
              Configured for automated analysis within the <strong>New Lead Follow-Up</strong> workflow.
            </p>
            <div className="form-actions" style={{ marginTop: '1rem' }}>
              <Link to="/workflows" className="btn btn-secondary btn-compact">
                View Workflows
              </Link>
              <Link to="/agents" className="btn btn-ghost btn-compact">
                Back to AI Agents
              </Link>
            </div>
          </SectionCard>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDeactivate}
        title={`Deactivate ${agent.name}?`}
        message="Existing configuration will remain available, but the agent will no longer be active."
        confirmLabel="Deactivate"
        onConfirm={handleConfirmDeactivate}
        onCancel={() => setConfirmDeactivate(false)}
      />
    </div>
  )
}

export default AgentDetailsPage
