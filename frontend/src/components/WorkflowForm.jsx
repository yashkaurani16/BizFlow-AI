import { useState } from 'react'
import { workflowAgents, workflowStatuses, workflowTriggers } from '../data/enums.js'
import { hasWorkflowErrors, validateWorkflow } from '../utils/workflowValidation.js'
import Alert from './Alert.jsx'
import Button from './Button.jsx'
import Input from './Input.jsx'
import Select from './Select.jsx'

function WorkflowForm({
  initialValues,
  submitLabel = 'Save Workflow',
  onSubmit,
  onCancel,
  submitting = false,
  submitError = '',
}) {
  const [values, setValues] = useState({
    name: initialValues?.name || '',
    description: initialValues?.description || '',
    trigger: initialValues?.trigger || 'New Lead Created',
    agent: initialValues?.agent || 'Sales Agent',
    status: initialValues?.status || 'Active',
  })
  const [errors, setErrors] = useState({})

  function updateField(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    if (errors[name]) {
      setErrors((current) => ({ ...current, [name]: undefined }))
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validateWorkflow(values)
    setErrors(nextErrors)

    if (hasWorkflowErrors(nextErrors)) {
      const firstId = nextErrors.name
        ? 'workflow-name'
        : nextErrors.description
          ? 'workflow-description'
          : nextErrors.trigger
            ? 'workflow-trigger'
            : nextErrors.agent
              ? 'workflow-agent'
              : nextErrors.status
                ? 'workflow-status'
                : null
      if (firstId) {
        document.getElementById(firstId)?.focus()
      }
      return
    }

    onSubmit(values)
  }

  return (
    <form className="workflow-form" onSubmit={handleSubmit} noValidate>
      <Alert tone="info">
        Workflows run the fixed 5-step follow-up automation: <strong>New Lead → Analyze Lead → Save Analysis → Create Follow-Up Task → Record Activity</strong>. External messaging and live AI integrations are currently mocked.
      </Alert>

      {submitError ? <Alert tone="error">{submitError}</Alert> : null}

      <div className="form-grid">
        <Input
          id="workflow-name"
          name="name"
          label="Workflow Name"
          value={values.name}
          onChange={updateField}
          error={errors.name}
          placeholder="e.g. New Lead Follow-Up"
          required
        />

        <Select
          id="workflow-trigger"
          name="trigger"
          label="Trigger"
          value={values.trigger}
          onChange={updateField}
          error={errors.trigger}
          required
        >
          {workflowTriggers.map((trigger) => (
            <option key={trigger} value={trigger}>
              {trigger}
            </option>
          ))}
        </Select>

        <Select
          id="workflow-agent"
          name="agent"
          label="Assigned Agent"
          value={values.agent}
          onChange={updateField}
          error={errors.agent}
          required
        >
          {workflowAgents.map((agent) => (
            <option key={agent} value={agent}>
              {agent}
            </option>
          ))}
        </Select>

        <Select
          id="workflow-status"
          name="status"
          label="Status"
          value={values.status}
          onChange={updateField}
          error={errors.status}
          required
        >
          {workflowStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </Select>
      </div>

      <div className="field">
        <label htmlFor="workflow-description">
          Description
          <span className="required-mark"> required</span>
        </label>
        <textarea
          id="workflow-description"
          name="description"
          className={`input textarea${errors.description ? ' is-invalid' : ''}`}
          rows="3"
          value={values.description}
          onChange={updateField}
          placeholder="Detailed summary of this automation workflow"
          aria-invalid={errors.description ? true : undefined}
          required
        />
        {errors.description ? <p className="field-error">{errors.description}</p> : null}
      </div>

      <div className="form-actions">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

export default WorkflowForm
