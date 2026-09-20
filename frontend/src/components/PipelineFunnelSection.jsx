import React from 'react'
import SectionCard from './SectionCard.jsx'

function PipelineFunnelSection({ pipeline }) {
  if (!pipeline) return null

  const {
    funnel = [],
    conversionRate = '0.0%',
    qualificationRate = '0.0%',
    priorityBreakdown = { High: 0, Medium: 0, Low: 0 },
    scoreDistribution = { tierLow: 0, tierModerate: 0, tierStrong: 0, tierExceptional: 0 },
  } = pipeline

  const totalScoredLeads =
    (scoreDistribution.tierLow || 0) +
    (scoreDistribution.tierModerate || 0) +
    (scoreDistribution.tierStrong || 0) +
    (scoreDistribution.tierExceptional || 0)

  return (
    <SectionCard
      title="Lead Pipeline Funnel & Quality Distribution"
      actions={
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
            Conversion: {conversionRate}
          </span>
          <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
            Qualification: {qualificationRate}
          </span>
        </div>
      }
    >
      <div className="pipeline-analytics-grid">
        {/* Funnel Stages */}
        <div className="pipeline-funnel-card">
          <h3 className="subheading-title">Conversion Funnel & Drop-Off</h3>
          <p className="muted-copy" style={{ fontSize: '0.8125rem', marginBottom: 'var(--space-3)' }}>
            Track lead velocity and conversion across critical lifecycle milestones.
          </p>

          <div className="funnel-stages-container">
            {funnel.map((stage, idx) => {
              const count = stage.count || 0
              const topCount = funnel[0]?.count || 1
              const pct = topCount > 0 ? Math.max(8, Math.round((count / topCount) * 100)) : 8

              return (
                <div key={stage.stage || idx} className="funnel-stage-row">
                  <div className="funnel-stage-header">
                    <span className="funnel-stage-title">{stage.label}</span>
                    <span className="funnel-stage-count">
                      <strong>{count}</strong> leads ({stage.share || '0%'})
                    </span>
                  </div>

                  <div className="funnel-bar-track">
                    <div
                      className={`funnel-bar-fill funnel-bar-stage-${idx}`}
                      style={{ width: `${pct}%` }}
                      role="progressbar"
                      aria-valuenow={count}
                      aria-valuemin={0}
                      aria-valuemax={topCount}
                    />
                  </div>

                  <div className="funnel-stage-meta">
                    <span className="funnel-stage-desc">{stage.description}</span>
                    {idx > 0 && (
                      <span className="funnel-dropoff-tag">
                        Drop-off: <strong>{stage.dropoff}</strong>
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Lead Quality & AI Score Tiers */}
        <div className="pipeline-quality-card">
          <h3 className="subheading-title">AI Score Distribution Tiers</h3>
          <p className="muted-copy" style={{ fontSize: '0.8125rem', marginBottom: 'var(--space-3)' }}>
            Categorized by AI qualification rating ({totalScoredLeads} scored leads).
          </p>

          <div className="score-tiers-list">
            <div className="score-tier-row">
              <div className="score-tier-label">
                <span className="score-tier-badge tier-exceptional">90–100</span>
                <span>Exceptional Fit</span>
              </div>
              <div className="score-tier-bar-wrap">
                <div
                  className="score-tier-bar fill-exceptional"
                  style={{
                    width: totalScoredLeads > 0
                      ? `${(scoreDistribution.tierExceptional / totalScoredLeads) * 100}%`
                      : '0%',
                  }}
                />
              </div>
              <span className="score-tier-count">
                <strong>{scoreDistribution.tierExceptional || 0}</strong>
              </span>
            </div>

            <div className="score-tier-row">
              <div className="score-tier-label">
                <span className="score-tier-badge tier-strong">70–89</span>
                <span>Strong Fit</span>
              </div>
              <div className="score-tier-bar-wrap">
                <div
                  className="score-tier-bar fill-strong"
                  style={{
                    width: totalScoredLeads > 0
                      ? `${(scoreDistribution.tierStrong / totalScoredLeads) * 100}%`
                      : '0%',
                  }}
                />
              </div>
              <span className="score-tier-count">
                <strong>{scoreDistribution.tierStrong || 0}</strong>
              </span>
            </div>

            <div className="score-tier-row">
              <div className="score-tier-label">
                <span className="score-tier-badge tier-moderate">40–69</span>
                <span>Moderate Fit</span>
              </div>
              <div className="score-tier-bar-wrap">
                <div
                  className="score-tier-bar fill-moderate"
                  style={{
                    width: totalScoredLeads > 0
                      ? `${(scoreDistribution.tierModerate / totalScoredLeads) * 100}%`
                      : '0%',
                  }}
                />
              </div>
              <span className="score-tier-count">
                <strong>{scoreDistribution.tierModerate || 0}</strong>
              </span>
            </div>

            <div className="score-tier-row">
              <div className="score-tier-label">
                <span className="score-tier-badge tier-low">0–39</span>
                <span>Low Fit</span>
              </div>
              <div className="score-tier-bar-wrap">
                <div
                  className="score-tier-bar fill-low"
                  style={{
                    width: totalScoredLeads > 0
                      ? `${(scoreDistribution.tierLow / totalScoredLeads) * 100}%`
                      : '0%',
                  }}
                />
              </div>
              <span className="score-tier-count">
                <strong>{scoreDistribution.tierLow || 0}</strong>
              </span>
            </div>
          </div>

          <hr style={{ margin: 'var(--space-4) 0', border: 'none', borderTop: '1px solid var(--color-border)' }} />

          <h3 className="subheading-title" style={{ fontSize: '0.875rem' }}>Priority Distribution</h3>
          <div className="priority-distribution-chips">
            <div className="priority-chip priority-high">
              <span className="priority-chip-dot" />
              <span className="priority-chip-label">High Priority</span>
              <strong className="priority-chip-val">{priorityBreakdown.High || 0}</strong>
            </div>
            <div className="priority-chip priority-medium">
              <span className="priority-chip-dot" />
              <span className="priority-chip-label">Medium Priority</span>
              <strong className="priority-chip-val">{priorityBreakdown.Medium || 0}</strong>
            </div>
            <div className="priority-chip priority-low">
              <span className="priority-chip-dot" />
              <span className="priority-chip-label">Low Priority</span>
              <strong className="priority-chip-val">{priorityBreakdown.Low || 0}</strong>
            </div>
          </div>
        </div>
      </div>
    </SectionCard>
  )
}

export default PipelineFunnelSection
