import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Card from '../components/Card.jsx'
import { ErrorState } from '../components/EmptyState.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import WorkflowForm from '../components/WorkflowForm.jsx'
import { useWorkflows } from '../context/WorkflowsContext.jsx'
import { useToast } from '../context/ToastContext.jsx'

function EditWorkflowPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getWorkflow, updateWorkflow } = useWorkflows()
  const { showToast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

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

  function handleSubmit(values) {
    setSubmitError('')
    setSubmitting(true)

    try {
      updateWorkflow(workflow.id, values)
      showToast('Workflow updated')
      navigate('/workflows')
    } catch (error) {
      setSubmitError(error.message || 'Unable to update this workflow.')
      setSubmitting(false)
    }
  }

  return (
    <div className="workflows-page">
      <div className="page-heading">
        <div>
          <div className="heading-with-badge">
            <h1>Edit Workflow</h1>
            <StatusBadge status={workflow.status} />
          </div>
          <p>Update configuration and trigger rules for {workflow.name}.</p>
        </div>
      </div>

      <Card>
        <WorkflowForm
          initialValues={workflow}
          submitLabel="Save changes"
          onSubmit={handleSubmit}
          onCancel={() => navigate('/workflows')}
          submitting={submitting}
          submitError={submitError}
        />
      </Card>
    </div>
  )
}

export default EditWorkflowPage
