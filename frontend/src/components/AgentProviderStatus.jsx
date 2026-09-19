import { useEffect, useState } from 'react'
import Alert from './Alert.jsx'
import Card from './Card.jsx'
import { aiApi } from '../services/api.js'

function AgentProviderStatus({
  provider: initialProvider = 'Not connected',
  status: initialStatus = 'Mock / Configuration Only',
  humanReview = 'Required',
}) {
  const [providerState, setProviderState] = useState({
    provider: initialProvider,
    status: initialStatus,
    isConfigured: false,
  })

  useEffect(() => {
    let active = true
    aiApi
      .getStatus()
      .then((res) => {
        if (active && res && res.success) {
          setProviderState({
            provider: res.provider || (res.isConfigured ? 'Connected' : 'Not connected'),
            status: res.status || (res.isConfigured ? 'AI Provider Connected' : 'AI Provider Unavailable — Fallback Analysis'),
            isConfigured: Boolean(res.isConfigured),
          })
        }
      })
      .catch(() => {
        // Safe fallback
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <Card className="agent-provider-status-card">
      <div className="provider-status-header">
        <h2>AI Provider & Safety Status</h2>
        <span className={`badge ${providerState.isConfigured ? 'badge-success' : 'badge-warning'}`}>
          {providerState.isConfigured ? 'AI Provider Connected' : 'Bounded AI'}
        </span>
      </div>

      <dl className="detail-list provider-meta-list">
        <div>
          <dt>AI Provider</dt>
          <dd>
            <span
              className={`status-indicator-dot ${providerState.isConfigured ? 'dot-active' : 'dot-inactive'}`}
              aria-hidden="true"
            />
            {providerState.provider}
          </dd>
        </div>
        <div>
          <dt>AI Status</dt>
          <dd>
            <span
              className={`status-indicator-dot ${providerState.isConfigured ? 'dot-active' : 'dot-pending'}`}
              aria-hidden="true"
            />
            {providerState.status}
          </dd>
        </div>
        <div>
          <dt>Human Review</dt>
          <dd>
            <span className="status-indicator-dot dot-active" aria-hidden="true" />
            <span className="badge badge-warning">{humanReview}</span>
          </dd>
        </div>
      </dl>

      <Alert tone="info">
        <p>
          <strong>Bounded MVP Policy:</strong> AI generates structured qualification notes and drafts for human review.
          No autonomous messaging (WhatsApp, Email, SMS) or external financial transactions are executed.
        </p>
      </Alert>
    </Card>
  )
}

export default AgentProviderStatus
