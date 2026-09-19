import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AgentForm from '../components/AgentForm.jsx'
import Card from '../components/Card.jsx'
import { useAgents } from '../context/AgentsContext.jsx'
import { useToast } from '../context/ToastContext.jsx'

function CreateAgentPage() {
  const navigate = useNavigate()
  const { addAgent } = useAgents()
  const { showToast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  function handleSubmit(values) {
    setSubmitError('')
    setSubmitting(true)

    try {
      addAgent(values)
      showToast('Agent created')
      navigate('/agents')
    } catch (error) {
      setSubmitError(error.message || 'Unable to create this agent.')
      setSubmitting(false)
    }
  }

  return (
    <div className="agents-page">
      <div className="page-heading">
        <div>
          <h1>Create Agent</h1>
          <p>Configure an AI agent to handle bounded analysis tasks in your workflows.</p>
        </div>
      </div>

      <Card>
        <AgentForm
          submitLabel="Create Agent"
          onSubmit={handleSubmit}
          onCancel={() => navigate('/agents')}
          submitting={submitting}
          submitError={submitError}
        />
      </Card>
    </div>
  )
}

export default CreateAgentPage
