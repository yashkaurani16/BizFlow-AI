import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Card from '../components/Card.jsx'
import { ErrorState } from '../components/EmptyState.jsx'
import LeadForm from '../components/LeadForm.jsx'
import { useLeads } from '../context/LeadsContext.jsx'
import { useToast } from '../context/ToastContext.jsx'

function EditLeadPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getLead, updateLead } = useLeads()
  const { showToast } = useToast()
  const lead = getLead(id)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  if (!lead) {
    return (
      <ErrorState
        title="Lead not found"
        message="This lead is not in the current mock list."
        actionLabel="Back to Leads"
        actionTo="/leads"
      />
    )
  }

  function handleSubmit(values) {
    setSubmitError('')
    setSubmitting(true)

    try {
      updateLead(lead.id, values)
      showToast('Lead updated')
      navigate(`/leads/${lead.id}`)
    } catch (error) {
      setSubmitError(error.message || 'Unable to update this lead.')
      setSubmitting(false)
    }
  }

  return (
    <div className="leads-page">
      <div className="page-heading">
        <div>
          <h1>Edit lead</h1>
          <p>Update {lead.name}. Status changes are recorded in the activity timeline.</p>
        </div>
      </div>
      <Card>
        <LeadForm
          initialValues={lead}
          submitLabel="Save changes"
          onSubmit={handleSubmit}
          onCancel={() => navigate(`/leads/${lead.id}`)}
          submitting={submitting}
          submitError={submitError}
        />
      </Card>
    </div>
  )
}

export default EditLeadPage
