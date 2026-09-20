import React from 'react'
import SectionCard from './SectionCard.jsx'

const CATEGORY_STYLES = {
  Pipeline: { color: '#0369a1', bg: '#e0f2fe', border: '#bae6fd', icon: '📊' },
  'Follow-Up': { color: '#b45309', bg: '#fef3c7', border: '#fde68a', icon: '⏱️' },
  'AI Quality': { color: '#6d28d9', bg: '#ede9fe', border: '#ddd6fe', icon: '🧠' },
  Workflows: { color: '#047857', bg: '#d1fae5', border: '#a7f3d0', icon: '⚡' },
  Communications: { color: '#b91c1c', bg: '#fee2e2', border: '#fecaca', icon: '✉️' },
}

function AIInsightsSection({
  insights = [],
  isRefreshing = false,
  onRefresh,
  isRealAI = false,
  generatedAt,
}) {
  return (
    <SectionCard
      title="Strategic AI Insights"
      actions={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
            {isRealAI ? '🤖 Google Gemini Powered' : '⚡ Bounded Operational AI'}
          </span>
          {onRefresh && (
            <button
              type="button"
              className="btn btn-secondary btn-compact"
              onClick={onRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? 'Analyzing...' : '✨ Refresh Insights'}
            </button>
          )}
        </div>
      }
    >
      <div className="ai-insights-container">
        <div className="ai-insights-disclaimer">
          <span className="ai-insights-disclaimer-icon" aria-hidden="true">
            🛡️
          </span>
          <p className="ai-insights-disclaimer-text">
            <strong>Advisory AI Analysis:</strong> Insights are derived exclusively from aggregate
            CRM, workflow, and communication data. AI insights are purely advisory and cannot
            perform automated mutations or external actions.
          </p>
        </div>

        {insights.length === 0 ? (
          <div className="ai-insights-empty">
            <p>No operational insights available for the current filter selection.</p>
          </div>
        ) : (
          <div className="ai-insights-grid">
            {insights.map((item, idx) => {
              const catStyle = CATEGORY_STYLES[item.category] || CATEGORY_STYLES.Pipeline
              return (
                <article key={idx} className="ai-insight-card">
                  <div className="ai-insight-card-top">
                    <span
                      className="ai-insight-category-pill"
                      style={{
                        color: catStyle.color,
                        backgroundColor: catStyle.bg,
                        borderColor: catStyle.border,
                      }}
                    >
                      <span aria-hidden="true">{catStyle.icon}</span>
                      {item.category}
                    </span>
                    <span className="ai-insight-advisory-badge">Advisory Only</span>
                  </div>

                  <h3 className="ai-insight-title">{item.title}</h3>
                  <p className="ai-insight-body">{item.insight}</p>

                  <div className="ai-insight-metric-pill">
                    <span className="ai-metric-label">Data Evidence:</span>
                    <strong className="ai-metric-value">{item.supportingMetric}</strong>
                  </div>

                  <div className="ai-insight-action-box">
                    <div className="ai-action-header">
                      <span className="ai-action-icon" aria-hidden="true">
                        💡
                      </span>
                      <span className="ai-action-label">Recommended Action:</span>
                    </div>
                    <p className="ai-action-text">{item.recommendedAction}</p>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {generatedAt && (
          <div className="ai-insights-footer">
            <span>
              Generated at: {new Date(generatedAt).toLocaleTimeString()} • Mandatory Human Review
              Required
            </span>
          </div>
        )}
      </div>
    </SectionCard>
  )
}

export default AIInsightsSection
