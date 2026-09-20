import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../components/Card.jsx'
import WorkflowForm from '../components/WorkflowForm.jsx'
import WorkflowBuilder, { DEFAULT_STARTER_WORKFLOW } from '../components/workflow-builder/WorkflowBuilder.jsx'
import { useWorkflows } from '../context/WorkflowsContext.jsx'
import { useToast } from '../context/ToastContext.jsx'

function CreateWorkflowPage() {
  const navigate = useNavigate()
  const { addWorkflow } = useWorkflows()
  const { showToast } = useToast()
  const [builderMode, setBuilderMode] = useState('visual')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  async function handleLegacySubmit(values) {
    setSubmitError('')
    setSubmitting(true)

    try {
      await addWorkflow(values)
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
          <p>Visually design, connect, and configure automated business follow-up workflows.</p>
        </div>
        <div className="builder-mode-switcher">
          <button
            type="button"
            className={`btn btn-compact ${builderMode === 'visual' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setBuilderMode('visual')}
          >
            🎨 Visual Builder
          </button>
          <button
            type="button"
            className={`btn btn-compact ${builderMode === 'form' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setBuilderMode('form')}
          >
            📋 Quick Form
          </button>
        </div>
      </div>

      {builderMode === 'visual' ? (
        <WorkflowBuilder initialWorkflow={DEFAULT_STARTER_WORKFLOW} isEditing={false} />
      ) : (
        <Card>
          <WorkflowForm
            submitLabel="Create Workflow"
            onSubmit={handleLegacySubmit}
            onCancel={() => navigate('/workflows')}
            submitting={submitting}
            submitError={submitError}
          />
        </Card>
      )}
    </div>
  )
}

export default CreateWorkflowPage

