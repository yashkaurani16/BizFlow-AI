import { useState } from 'react'
import { leadStatuses } from '../data/enums.js'
import { hasLeadErrors, validateLead } from '../utils/leadValidation.js'
import Alert from './Alert.jsx'
import Button from './Button.jsx'
import Input from './Input.jsx'
import Select from './Select.jsx'

function LeadForm({
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
  submitting,
  submitError,
  showWorkflowNotice,
}) {
  const [values, setValues] = useState({
    name: initialValues?.name || '',
    email: initialValues?.email || '',
    phone: initialValues?.phone || '',
    company: initialValues?.company || '',
    status: initialValues?.status || 'New',
    notes: initialValues?.notes || '',
  })
  const [errors, setErrors] = useState({})

  function updateField(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validateLead(values)
    setErrors(nextErrors)

    if (hasLeadErrors(nextErrors)) {
      const firstId = nextErrors.name
        ? 'lead-name'
        : nextErrors.email
          ? 'lead-email'
          : nextErrors.phone
            ? 'lead-phone'
            : nextErrors.status
              ? 'lead-status'
              : null
      if (firstId) {
        document.getElementById(firstId)?.focus()
      }
      return
    }

    onSubmit(values)
  }

  return (
    <form className="lead-form" onSubmit={handleSubmit} noValidate>
      {showWorkflowNotice ? (
        <Alert>
          Saving will run the New Lead follow-up workflow. Analysis shown after save is mock data until the AI
          integration stage.
        </Alert>
      ) : null}
      {errors.contact ? <Alert tone="error">{errors.contact}</Alert> : null}
      {submitError ? <Alert tone="error">{submitError}</Alert> : null}

      <div className="form-grid">
        <Input
          id="lead-name"
          name="name"
          label="Name"
          value={values.name}
          onChange={updateField}
          error={errors.name}
          required
        />
        <Select
          id="lead-status"
          name="status"
          label="Status"
          value={values.status}
          onChange={updateField}
          error={errors.status}
          required
        >
          {leadStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </Select>
        <Input
          id="lead-email"
          name="email"
          type="email"
          label="Email"
          value={values.email}
          onChange={updateField}
          error={errors.email}
          hint="Email or phone is required."
        />
        <Input
          id="lead-phone"
          name="phone"
          type="tel"
          label="Phone"
          value={values.phone}
          onChange={updateField}
          error={errors.phone}
        />
        <Input
          id="lead-company"
          name="company"
          label="Company"
          value={values.company}
          onChange={updateField}
        />
      </div>

      <div className="field">
        <label htmlFor="lead-notes">Notes</label>
        <textarea
          id="lead-notes"
          name="notes"
          className="input textarea"
          rows="4"
          value={values.notes}
          onChange={updateField}
        />
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

export default LeadForm
