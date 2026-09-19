import { useEffect, useState } from 'react'
import Alert from './Alert.jsx'
import Card from './Card.jsx'
import { aiApi } from '../services/api.js'

function WorkflowSafetyNotice({
  aiProvider: initialAiProvider = 'Not connected',
  executionMode: initialExecutionMode = 'Mock / Configuration Only',
  humanReview = 'Required',
  externalActions = 'Not enabled',
}) {
  const [safetyState, setSafetyState] = useState({
    aiProvider: initialAiProvider,
    executionMode: initialExecutionMode,
    isConfigured: false,
  })

  useEffect(() => {
    let active = true
    aiApi
      .getStatus()
      .then((res) => {
        if (active && res && res.success) {
          setSafetyState({
            aiProvider: res.provider || (res.isConfigured ? 'Connected' : 'Not connected'),
            executionMode: res.isConfigured ? 'Live AI Analysis' : 'Fallback / Bounded Preview',
            isConfigured: Boolean(res.isConfigured),
          })
        }
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  return (
    <Card className="workflow-safety-card">
      <div className="workflow-safety-header">
        <h2>Workflow Safety & AI Transparency</h2>
        <span className={`badge ${safetyState.isConfigured ? 'badge-success' : 'badge-warning'}`}>
          {safetyState.isConfigured ? 'AI Provider Connected' : 'Bounded Workflow'}
        </span>
      </div>

      <dl className="detail-list provider-meta-list">
        <div>
          <dt>AI Provider</dt>
          <dd>
            <span
              className={`status-indicator-dot ${safetyState.isConfigured ? 'dot-active' : 'dot-inactive'}`}
              aria-hidden="true"
            />
            {safetyState.aiProvider}
          </dd>
        </div>
        <div>
          <dt>Execution Mode</dt>
          <dd>
            <span
              className={`status-indicator-dot ${safetyState.isConfigured ? 'dot-active' : 'dot-pending'}`}
              aria-hidden="true"
            />
            {safetyState.executionMode}
          </dd>
        </div>
        <div>
          <dt>Human Review</dt>
          <dd>
            <span className="status-indicator-dot dot-active" aria-hidden="true" />
            <span className="badge badge-warning">{humanReview}</span>
          </dd>
        </div>
        <div>
          <dt>External Actions</dt>
          <dd>
            <span className="status-indicator-dot dot-inactive" aria-hidden="true" />
            {externalActions}
          </dd>
        </div>
      </dl>

      <Alert tone="info">
        <ul className="safety-bullets">
          <li>
            <strong>{safetyState.isConfigured ? 'AI Provider Connected:' : 'AI Fallback Mode:'}</strong>{' '}
            {safetyState.isConfigured
              ? 'Leads are analyzed via secure backend AI provider with bounded business prompts.'
              : 'Prompts and analysis use bounded fallback heuristics.'}
          </li>
          <li><strong>No external messaging:</strong> No WhatsApp, Email, or SMS messages are transmitted.</li>
          <li><strong>No autonomous external actions:</strong> Workflows do not execute third-party mutations.</li>
          <li><strong>Human review enforced:</strong> All AI-generated outputs require human review and approval.</li>
        </ul>
      </Alert>
    </Card>
  )
}

export default WorkflowSafetyNotice
