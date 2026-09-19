import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ActivityItem from '../components/ActivityItem.jsx'
import Alert from '../components/Alert.jsx'
import Button from '../components/Button.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { ErrorState } from '../components/EmptyState.jsx'
import FollowUpTaskCard from '../components/FollowUpTaskCard.jsx'
import SectionCard from '../components/SectionCard.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { useLeads } from '../context/LeadsContext.jsx'
import { useToast } from '../context/ToastContext.jsx'

function LeadDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getLead, deleteLead } = useLeads()
  const { showToast } = useToast()
  const [pendingDelete, setPendingDelete] = useState(false)
  const lead = getLead(id)

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

  function confirmDelete() {
    deleteLead(lead.id)
    showToast(`Deleted ${lead.name}.`)
    navigate('/leads')
  }

  return (
    <div className="lead-details">
      <div className="page-heading">
        <div>
          <h1>{lead.name}</h1>
          <p>Review lead details, mock AI analysis, and follow-up activity.</p>
        </div>
        <div className="heading-actions">
          <Button to={`/leads/${lead.id}/edit`}>Edit</Button>
          <Button variant="danger" onClick={() => setPendingDelete(true)}>
            Delete
          </Button>
        </div>
      </div>

      <div className="details-split">
        <SectionCard title="Lead information">
          <dl className="detail-list">
            <div>
              <dt>Name</dt>
              <dd>{lead.name}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{lead.email || '—'}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{lead.phone || '—'}</dd>
            </div>
            <div>
              <dt>Company</dt>
              <dd>{lead.company || '—'}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <StatusBadge status={lead.status} />
              </dd>
            </div>
            <div>
              <dt>Created date</dt>
              <dd>{lead.createdLabel}</dd>
            </div>
            <div className="detail-span">
              <dt>Notes</dt>
              <dd>{lead.notes || 'No notes yet.'}</dd>
            </div>
          </dl>
        </SectionCard>

        <div className="details-side">
          <SectionCard title="AI Analysis">
            {lead.aiAnalysis.status === 'pending' ? (
              <p className="muted-copy">Analysis pending. A real AI provider is not connected.</p>
            ) : lead.aiAnalysis.status === 'failed' ? (
              <Alert tone="error">
                Mock analysis failed. The lead was still saved. Integration will be connected during the AI
                integration stage.
              </Alert>
            ) : (
              <p>{lead.aiAnalysis.summary}</p>
            )}
          </SectionCard>

          <SectionCard title="Suggested next step">
            <p>{lead.suggestedNextStep || 'No suggested next step until mock analysis succeeds.'}</p>
          </SectionCard>

          <SectionCard title="Follow-up task">
            <FollowUpTaskCard task={lead.followUpTask} />
          </SectionCard>
        </div>
      </div>

      <SectionCard
        title="Activity"
        actions={
          <Link to="/leads" className="btn btn-ghost btn-compact">
            Back to Leads
          </Link>
        }
      >
        <ol className="activity-list">
          {lead.activities.map((item) => (
            <ActivityItem key={item.id} activity={item} />
          ))}
        </ol>
      </SectionCard>

      <ConfirmDialog
        open={pendingDelete}
        title="Delete lead"
        message={`Delete ${lead.name}? This only removes the lead from the current mock list.`}
        confirmLabel="Delete lead"
        onCancel={() => setPendingDelete(false)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}

export default LeadDetailsPage
