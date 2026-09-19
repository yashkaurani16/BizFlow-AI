import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../components/Card.jsx'
import WorkflowForm from '../components/WorkflowForm.jsx'
import { useWorkflows } from '../context/WorkflowsContext.jsx'
import { useToast } from '../context/ToastContext.jsx'

function CreateWorkflowPage() {
  const navigate = useNavigate()
  const { addWorkflow } = useWorkflows()
  const { showToast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  function handleSubmit(values) {
    setSubmitError('')
    setSubmitting(true)

    try {
      addWorkflow(values)
      showToast('Workflow created')
      navigate('/workflows')
    } catch (error) {
      setSubmitError(error.message || 'Unable to create this workflow.')
      setSubmitting(false)
    }
  }

  return (
    <div className="workflows-page">
      <div className="page-heading">
        <div>
          <h1>Create Workflow</h1>
          <p>Configure automated business follow-up rules for CRM leads.</p>
        </div>
      </div>

      <Card>
        <WorkflowForm
          submitLabel="Create Workflow"
          onSubmit={handleSubmit}
          onCancel={() => navigate('/workflows')}
          submitting={submitting}
          submitError={submitError}
        />
      </Card>
    </div>
  )
}

export default CreateWorkflowPage
