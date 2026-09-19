import Alert from './Alert.jsx'
import Card from './Card.jsx'

function WorkflowSafetyNotice({
  aiProvider = 'Not connected',
  executionMode = 'Mock / Configuration Only',
  humanReview = 'Required',
  externalActions = 'Not enabled',
}) {
  return (
    <Card className="workflow-safety-card">
      <div className="workflow-safety-header">
        <h2>Workflow Safety & AI Transparency</h2>
        <span className="badge badge-warning">Simulated Flow</span>
      </div>

      <dl className="detail-list provider-meta-list">
        <div>
          <dt>AI Provider</dt>
          <dd>
            <span className="status-indicator-dot dot-inactive" aria-hidden="true" />
            {aiProvider}
          </dd>
        </div>
        <div>
          <dt>Execution Mode</dt>
          <dd>
            <span className="status-indicator-dot dot-pending" aria-hidden="true" />
            {executionMode}
          </dd>
        </div>
        <div>
          <dt>Human Review</dt>
          <dd>
            <span className="status-indicator-dot dot-active" aria-hidden="true" />
            {humanReview}
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
          <li><strong>No live AI provider connected:</strong> Prompts and analysis are local mock previews.</li>
          <li><strong>No channel messages:</strong> No WhatsApp, Email, or SMS messages are transmitted.</li>
          <li><strong>No autonomous external actions:</strong> Workflow runs do not invoke third-party services.</li>
          <li><strong>Human review enforced:</strong> All AI-generated analysis and follow-up tasks must be reviewed manually by team members.</li>
        </ul>
      </Alert>
    </Card>
  )
}

export default WorkflowSafetyNotice
