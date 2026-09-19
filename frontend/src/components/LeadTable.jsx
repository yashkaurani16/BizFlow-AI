import { Link } from 'react-router-dom'
import Button from './Button.jsx'
import StatusBadge from './StatusBadge.jsx'

function LeadActions({ lead, onDelete }) {
  return (
    <div className="lead-actions">
      <Link className="btn btn-secondary btn-compact" to={`/leads/${lead.id}`}>
        View
      </Link>
      <Link className="btn btn-secondary btn-compact" to={`/leads/${lead.id}/edit`}>
        Edit
      </Link>
      <Button variant="danger" className="btn-compact" onClick={() => onDelete(lead)}>
        Delete
      </Button>
    </div>
  )
}

function LeadTable({ leads, onDelete }) {
  return (
    <>
      <div className="leads-table-wrap">
        <table className="leads-table">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">Email</th>
              <th scope="col">Phone</th>
              <th scope="col">Company</th>
              <th scope="col">Status</th>
              <th scope="col">Created Date</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id}>
                <td>{lead.name}</td>
                <td>{lead.email || '—'}</td>
                <td>{lead.phone || '—'}</td>
                <td>{lead.company || '—'}</td>
                <td>
                  <StatusBadge status={lead.status} />
                </td>
                <td>{lead.createdLabel}</td>
                <td>
                  <LeadActions lead={lead} onDelete={onDelete} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="leads-cards">
        {leads.map((lead) => (
          <li key={lead.id} className="lead-card">
            <div className="lead-card-top">
              <h2>{lead.name}</h2>
              <StatusBadge status={lead.status} />
            </div>
            <p>{lead.company || 'No company'}</p>
            <p className="muted-copy">
              {lead.email || 'No email'} · {lead.phone || 'No phone'}
            </p>
            <p className="muted-copy">Created {lead.createdLabel}</p>
            <LeadActions lead={lead} onDelete={onDelete} />
          </li>
        ))}
      </ul>
    </>
  )
}

export default LeadTable
