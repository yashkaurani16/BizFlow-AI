import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../components/Card.jsx'
import LeadForm from '../components/LeadForm.jsx'
import { useLeads } from '../context/LeadsContext.jsx'
import { useToast } from '../context/ToastContext.jsx'

function AddLeadPage() {
  const navigate = useNavigate()
  const { addLead } = useLeads()
  const { showToast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  function handleSubmit(values) {
    setSubmitError('')
    setSubmitting(true)

    try {
      const lead = addLead(values)
      showToast('Lead saved')
      navigate(`/leads/${lead.id}`)
    } catch (error) {
      setSubmitError(error.message || 'Unable to save this lead.')
      setSubmitting(false)
    }
  }

  return (
    <div className="leads-page">
      <div className="page-heading">
        <div>
          <h1>Add lead</h1>
          <p>Capture a new CRM lead. Mock analysis is recorded after save for human review.</p>
        </div>
      </div>
      <Card>
        <LeadForm
          submitLabel="Add Lead"
          onSubmit={handleSubmit}
          onCancel={() => navigate('/leads')}
          submitting={submitting}
          submitError={submitError}
          showWorkflowNotice
        />
      </Card>
    </div>
  )
}

export default AddLeadPage
