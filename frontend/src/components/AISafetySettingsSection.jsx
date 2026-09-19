import Alert from './Alert.jsx'
import SectionCard from './SectionCard.jsx'

function AISafetySettingsSection({ aiSafetySettings }) {
  return (
    <SectionCard title="AI Safety & Review Policy">
      <dl className="detail-list provider-meta-list">
        <div>
          <dt>AI Provider</dt>
          <dd>
            <span className="status-indicator-dot dot-inactive" aria-hidden="true" />
            {aiSafetySettings.aiProvider}
          </dd>
        </div>
        <div>
          <dt>AI Mode</dt>
          <dd>
            <span className="status-indicator-dot dot-pending" aria-hidden="true" />
            {aiSafetySettings.aiMode}
          </dd>
        </div>
        <div>
          <dt>Human Review</dt>
          <dd>
            <span className="status-indicator-dot dot-active" aria-hidden="true" />
            {aiSafetySettings.humanReview}
          </dd>
        </div>
        <div>
          <dt>External Actions</dt>
          <dd>
            <span className="status-indicator-dot dot-inactive" aria-hidden="true" />
            {aiSafetySettings.externalActions}
          </dd>
        </div>
      </dl>

      <div style={{ marginTop: '1rem' }}>
        <Alert tone="warning">
          <p>
            <strong>Bounded MVP Policy:</strong> {aiSafetySettings.explanation}
          </p>
        </Alert>
      </div>
    </SectionCard>
  )
}

export default AISafetySettingsSection
