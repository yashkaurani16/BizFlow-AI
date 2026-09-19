import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { EmptyState } from '../components/EmptyState.jsx'
import Input from '../components/Input.jsx'
import LeadTable from '../components/LeadTable.jsx'
import Select from '../components/Select.jsx'
import { useLeads } from '../context/LeadsContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { leadStatuses } from '../data/enums.js'

function matchesSearch(lead, query) {
  if (!query) {
    return true
  }

  const haystack = [lead.name, lead.email, lead.phone, lead.company].join(' ').toLowerCase()
  return haystack.includes(query)
}

function LeadsPage() {
  const { leads, deleteLead } = useLeads()
  const { showToast } = useToast()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All')
  const [pendingDelete, setPendingDelete] = useState(null)

  const normalizedQuery = query.trim().toLowerCase()
  const filteredLeads = useMemo(
    () =>
      leads.filter((lead) => {
        const statusMatch = status === 'All' || lead.status === status
        return statusMatch && matchesSearch(lead, normalizedQuery)
      }),
    [leads, status, normalizedQuery],
  )

  function confirmDelete() {
    if (!pendingDelete) {
      return
    }
    deleteLead(pendingDelete.id)
    showToast(`Deleted ${pendingDelete.name}.`)
    setPendingDelete(null)
  }

  const noLeadsAtAll = leads.length === 0
  const noMatches = !noLeadsAtAll && filteredLeads.length === 0

  return (
    <div className="leads-page">
      <div className="page-heading">
        <div>
          <h1>Leads</h1>
          <p>Track and update your CRM leads. Search and filter stay on this device until the API is connected.</p>
        </div>
        <Link to="/leads/new" className="btn btn-primary">
          Add Lead
        </Link>
      </div>

      {noLeadsAtAll ? (
        <EmptyState
          title="No leads yet"
          message="Add your first lead to start the New Lead follow-up workflow."
          actionLabel="Add your first lead"
          actionTo="/leads/new"
        />
      ) : (
        <>
          <div className="leads-toolbar">
            <Input
              id="lead-search"
              label="Search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, email, phone, or company"
            />
            <Select id="lead-status-filter" label="Status" value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="All">All</option>
              {leadStatuses.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </div>

          {noMatches ? (
            <EmptyState
              title="No matching leads"
              message="Try a different search or status filter."
            />
          ) : (
            <LeadTable leads={filteredLeads} onDelete={setPendingDelete} />
          )}
        </>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete lead"
        message={
          pendingDelete
            ? `Delete ${pendingDelete.name}? This only removes the lead from the current mock list.`
            : ''
        }
        confirmLabel="Delete lead"
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  )
}

export default LeadsPage
