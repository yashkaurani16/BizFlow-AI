import { Link } from 'react-router-dom'
import Button from './Button.jsx'

function EmptyState({ title, message, actionLabel, actionTo }) {
  return (
    <div className="card empty-state" role="status">
      <h2>{title}</h2>
      <p>{message}</p>
      {actionTo && actionLabel ? (
        <Link to={actionTo} className="btn btn-primary">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  )
}

function ErrorState({ title, message, onRetry, actionLabel, actionTo }) {
  return (
    <div className="card error-state" role="alert">
      <h2>{title}</h2>
      <p>{message}</p>
      <div className="form-actions">
        {onRetry ? (
          <Button type="button" onClick={onRetry}>
            Retry
          </Button>
        ) : null}
        {actionTo && actionLabel ? (
          <Link to={actionTo} className="btn btn-primary">
            {actionLabel}
          </Link>
        ) : null}
      </div>
    </div>
  )
}

export { EmptyState, ErrorState }
