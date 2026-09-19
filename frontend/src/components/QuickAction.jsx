import { Link } from 'react-router-dom'

function QuickAction({ label, to, variant = 'secondary' }) {
  return (
    <Link to={to} className={`btn btn-${variant} quick-action`}>
      {label}
    </Link>
  )
}

export default QuickAction
