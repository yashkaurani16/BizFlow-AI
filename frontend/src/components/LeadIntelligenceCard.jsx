import { useState } from 'react'

function LeadIntelligenceCard({ lead }) {
  const [copied, setCopied] = useState(false)

  if (!lead) return null

  const intel = lead.aiIntelligence || {}
  const score = typeof intel.score === 'number' ? intel.score : (lead.score || 50)
  const priority = intel.priority || lead.aiMetadata?.leadQuality || 'Medium'
  const summary = intel.summary || lead.aiAnalysis?.summary || lead.aiAnalysis || 'No intelligence available.'
  const keySignals = Array.isArray(intel.keySignals) && intel.keySignals.length > 0
    ? intel.keySignals
    : [
        lead.company ? `Company verified: ${lead.company}` : 'Direct inbound inquiry',
        lead.phone ? `Phone contact provided: ${lead.phone}` : 'Email-only channel',
        lead.email ? `Email: ${lead.email}` : null,
      ].filter(Boolean)
  const risks = Array.isArray(intel.risks) && intel.risks.length > 0
    ? intel.risks
    : [
        !lead.phone ? 'No phone number provided' : null,
        !lead.company ? 'No company name provided' : null,
        'Requires human discovery to verify technical scope',
      ].filter(Boolean)
  const recommendedNextAction = intel.recommendedNextAction || lead.suggestedNextStep || 'Review lead details and contact prospect.'
  const followUpSuggestion = intel.followUpSuggestion || `Hi ${lead.name}, thanks for reaching out to BizFlow AI. Let us know a convenient time to connect regarding your business workflows.`
  const isRealAI = Boolean(intel.isRealAI || lead.aiMetadata?.isRealAI)
  const provider = intel.provider || lead.aiMetadata?.provider || (isRealAI ? 'gemini' : 'fallback')
  const model = intel.model || lead.aiMetadata?.model || (isRealAI ? 'gemini-2.5-flash' : 'bounded-fallback-v1')
  const timestamp = intel.analyzedAt || lead.updatedAt || lead.createdAt

  const scoreTone = score >= 75 ? 'high' : score >= 50 ? 'medium' : 'low'
  const priorityBadgeClass = priority === 'High' ? 'badge-success' : priority === 'Medium' ? 'badge-warning' : 'badge-neutral'

  const formattedTimestamp = timestamp
    ? new Date(timestamp).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Recently'

  function handleCopy() {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(followUpSuggestion)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <section className="card section-card ai-intelligence-card" aria-label="AI Lead Intelligence">
      <div className="section-card-header ai-intel-header">
        <div>
          <h2>AI Lead Intelligence</h2>
          <p className="muted-copy" style={{ margin: '2px 0 0', fontSize: '0.8125rem' }}>
            AI-generated evaluation &bull; Strictly advisory for human sales review
          </p>
        </div>
        <div className="ai-intel-badges">
          <span className={`badge ${isRealAI ? 'badge-success' : 'badge-neutral'}`}>
            {isRealAI ? 'AI Provider Connected' : 'Fallback Analysis'}
          </span>
          <span className="badge badge-warning">Human Review Required</span>
        </div>
      </div>

      {/* Score & Priority Banner */}
      <div className={`ai-score-banner score-tone-${scoreTone}`}>
        <div className="score-metric-group">
          <div className="score-circle">
            <span className="score-number">{score}</span>
            <span className="score-denom">/100</span>
          </div>
          <div className="score-labels">
            <div className="score-title">AI Lead Score</div>
            <div className="score-subtext">
              {score >= 75
                ? 'High purchase intent & profile match'
                : score >= 50
                  ? 'Moderate fit; discovery needed'
                  : 'Early-stage inquiry; requires qualification'}
            </div>
          </div>
        </div>

        <div className="priority-pill-wrap">
          <span className="priority-label">Priority:</span>
          <span className={`badge ${priorityBadgeClass} priority-badge`}>
            {priority} Priority
          </span>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="ai-intel-block">
        <h3 className="ai-intel-subheading">Assessment Summary</h3>
        <p className="ai-summary-text">{summary}</p>
      </div>

      {/* Signals & Risks Grid */}
      <div className="ai-signals-grid">
        <div className="ai-signals-column">
          <h3 className="ai-intel-subheading">
            <span className="indicator-dot dot-success" />
            Key Signals
          </h3>
          <ul className="ai-signals-list">
            {keySignals.map((signal, idx) => (
              <li key={idx} className="signal-item signal-positive">
                <span className="signal-icon">&check;</span>
                <span>{signal}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="ai-signals-column">
          <h3 className="ai-intel-subheading">
            <span className="indicator-dot dot-warning" />
            Risks & Information Gaps
          </h3>
          <ul className="ai-signals-list">
            {risks.map((risk, idx) => (
              <li key={idx} className="signal-item signal-risk">
                <span className="signal-icon">&excl;</span>
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recommended Next Action */}
      <div className="ai-action-box">
        <div className="ai-action-header">
          <span className="ai-action-title">Recommended Next Action</span>
          <span className="badge badge-info">Action Item</span>
        </div>
        <p className="ai-action-content">{recommendedNextAction}</p>
      </div>

      {/* Follow-Up Suggestion Draft */}
      <div className="ai-draft-box">
        <div className="ai-draft-header">
          <span className="ai-draft-title">Suggested Follow-Up Outreach</span>
          <button
            type="button"
            className="btn btn-ghost btn-compact copy-btn"
            onClick={handleCopy}
            title="Copy draft to clipboard"
          >
            {copied ? 'Copied!' : 'Copy Draft'}
          </button>
        </div>
        <p className="ai-draft-text">&ldquo;{followUpSuggestion}&rdquo;</p>
      </div>

      {/* Footer Audit Information */}
      <div className="ai-intel-footer">
        <span>Last analyzed: {formattedTimestamp}</span>
        <span className="footer-sep">&bull;</span>
        <span>Provider: {provider} ({model})</span>
      </div>
    </section>
  )
}

export default LeadIntelligenceCard
