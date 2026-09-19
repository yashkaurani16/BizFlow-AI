import Badge from './Badge.jsx'

const variantMap = {
  New: 'new',
  Contacted: 'contacted',
  Qualified: 'qualified',
  Converted: 'converted',
  Lost: 'lost',
  Active: 'active',
  Succeeded: 'success',
  Failed: 'error',
  Pending: 'info',
  Inactive: 'inactive',
}

function StatusBadge({ status }) {
  const variant = variantMap[status] || 'neutral'
  return <Badge variant={variant}>{status}</Badge>
}

export default StatusBadge
