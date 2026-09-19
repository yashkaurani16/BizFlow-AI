import Alert from './Alert.jsx'
import Card from './Card.jsx'

function AgentProviderStatus({ provider = 'Not connected', status = 'Mock / Configuration Only', humanReview = 'Required' }) {
  return (
    <Card className="agent-provider-status-card">
      <div className="provider-status-header">
        <h2>AI Provider & Safety Status</h2>
        <span className="badge badge-warning">Bounded AI</span>
      </div>

      <dl className="detail-list provider-meta-list">
        <div>
          <dt>AI Provider</dt>
          <dd>
            <span className="status-indicator-dot dot-inactive" aria-hidden="true" />
            {provider}
          </dd>
        </div>
        <div>
          <dt>AI Status</dt>
          <dd>
            <span className="status-indicator-dot dot-pending" aria-hidden="true" />
            {status}
          </dd>
        </div>
        <div>
          <dt>Human Review</dt>
          <dd>
            <span className="status-indicator-dot dot-active" aria-hidden="true" />
            {humanReview}
          </dd>
        </div>
      </dl>

      <Alert tone="info">
        <p>
          <strong>Bounded MVP Policy:</strong> Agent configurations are maintained locally for workflow orchestration.
          External AI provider integration is deferred to the API integration stage. No autonomous messaging or external
          actions are executed.
        </p>
      </Alert>
    </Card>
  )
}

export default AgentProviderStatus
