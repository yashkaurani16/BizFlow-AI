import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AgentForm from '../components/AgentForm.jsx'
import Card from '../components/Card.jsx'
import { ErrorState } from '../components/EmptyState.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { useAgents } from '../context/AgentsContext.jsx'
import { useToast } from '../context/ToastContext.jsx'

function EditAgentPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getAgent, updateAgent } = useAgents()
  const { showToast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

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

  function handleSubmit(values) {
    setSubmitError('')
    setSubmitting(true)

    try {
      updateAgent(agent.id, values)
      showToast('Agent updated')
      navigate('/agents')
    } catch (error) {
      setSubmitError(error.message || 'Unable to update this agent.')
      setSubmitting(false)
    }
  }

  return (
    <div className="agents-page">
      <div className="page-heading">
        <div>
          <div className="heading-with-badge">
            <h1>Edit Agent</h1>
            <StatusBadge status={agent.status} />
          </div>
          <p>Update configuration and operational instructions for {agent.name}.</p>
        </div>
      </div>

      <Card>
        <AgentForm
          initialValues={agent}
          submitLabel="Save changes"
          onSubmit={handleSubmit}
          onCancel={() => navigate('/agents')}
          submitting={submitting}
          submitError={submitError}
        />
      </Card>
    </div>
  )
}

export default EditAgentPage
