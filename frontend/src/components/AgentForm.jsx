import { useState } from 'react'
import { agentStatuses, agentTypes } from '../data/enums.js'
import { hasAgentErrors, validateAgent } from '../utils/agentValidation.js'
import Alert from './Alert.jsx'
import Button from './Button.jsx'
import Input from './Input.jsx'
import Select from './Select.jsx'

function AgentForm({
  initialValues,
  submitLabel = 'Save Agent',
  onSubmit,
  onCancel,
  submitting = false,
  submitError = '',
}) {
  const [values, setValues] = useState({
    name: initialValues?.name || '',
    type: initialValues?.type || '',
    description: initialValues?.description || '',
    instructions: initialValues?.instructions || '',
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
    const nextErrors = validateAgent(values)
    setErrors(nextErrors)

    if (hasAgentErrors(nextErrors)) {
      const firstId = nextErrors.name
        ? 'agent-name'
        : nextErrors.type
          ? 'agent-type'
          : nextErrors.description
            ? 'agent-description'
            : nextErrors.instructions
              ? 'agent-instructions'
              : null
      if (firstId) {
        document.getElementById(firstId)?.focus()
      }
      return
    }

    onSubmit(values)
  }

  return (
    <form className="agent-form" onSubmit={handleSubmit} noValidate>
      <Alert tone="info">
        Agent configurations define bounded automation rules for business workflows. Live AI provider integration is deferred; configurations are saved locally for human review.
      </Alert>

      {submitError ? <Alert tone="error">{submitError}</Alert> : null}

      <div className="form-grid">
        <Input
          id="agent-name"
          name="name"
          label="Agent Name"
          value={values.name}
          onChange={updateField}
          error={errors.name}
          placeholder="e.g. Sales Agent"
          required
        />

        <Select
          id="agent-type"
          name="type"
          label="Agent Type"
          value={values.type}
          onChange={updateField}
          error={errors.type}
          required
        >
          <option value="">Select agent type</option>
          {agentTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </Select>

        <Select
          id="agent-status"
          name="status"
          label="Status"
          value={values.status}
          onChange={updateField}
        >
          {agentStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </Select>
      </div>

      <div className="field">
        <label htmlFor="agent-description">
          Description
          <span className="required-mark"> required</span>
        </label>
        <textarea
          id="agent-description"
          name="description"
          className={`input textarea${errors.description ? ' is-invalid' : ''}`}
          rows="3"
          value={values.description}
          onChange={updateField}
          placeholder="Short summary of what this agent helps accomplish"
          aria-invalid={errors.description ? true : undefined}
          required
        />
        {errors.description ? <p className="field-error">{errors.description}</p> : null}
      </div>

      <div className="field">
        <label htmlFor="agent-instructions">
          Instructions
          <span className="required-mark"> required</span>
        </label>
        <textarea
          id="agent-instructions"
          name="instructions"
          className={`input textarea${errors.instructions ? ' is-invalid' : ''}`}
          rows="5"
          value={values.instructions}
          onChange={updateField}
          placeholder="Specific operational instructions and bounded analysis behavior..."
          aria-invalid={errors.instructions ? true : undefined}
          required
        />
        {errors.instructions ? <p className="field-error">{errors.instructions}</p> : null}
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

export default AgentForm
