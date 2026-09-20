import React, { useState } from 'react'
import SectionCard from './SectionCard.jsx'

function TimeSeriesChartSection({ timeSeries }) {
  const [activeMetric, setActiveMetric] = useState('leads')

  if (!timeSeries) return null

  const {
    leadsOverTime = [],
    workflowRunsOverTime = [],
    activitiesOverTime = [],
  } = timeSeries

  const activeSeries =
    activeMetric === 'leads'
      ? leadsOverTime
      : activeMetric === 'workflows'
      ? workflowRunsOverTime
      : activitiesOverTime

  const maxCount = activeSeries.reduce((max, item) => Math.max(max, item.count), 0) || 1
  const totalCount = activeSeries.reduce((sum, item) => sum + item.count, 0)

  return (
    <SectionCard
      title="Operational Velocity & Activity Trends"
      actions={
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          <button
            type="button"
            className={`btn btn-compact ${activeMetric === 'leads' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveMetric('leads')}
          >
            Leads Captured ({leadsOverTime.reduce((s, i) => s + i.count, 0)})
          </button>
          <button
            type="button"
            className={`btn btn-compact ${activeMetric === 'workflows' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveMetric('workflows')}
          >
            Workflow Executions ({workflowRunsOverTime.reduce((s, i) => s + i.count, 0)})
          </button>
          <button
            type="button"
            className={`btn btn-compact ${activeMetric === 'activities' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveMetric('activities')}
          >
            Total Events ({activitiesOverTime.reduce((s, i) => s + i.count, 0)})
          </button>
        </div>
      }
    >
      <div className="time-series-container">
        <div className="time-series-header">
          <div>
            <h3 className="subheading-title" style={{ margin: 0 }}>
              {activeMetric === 'leads'
                ? 'Daily Inbound Leads'
                : activeMetric === 'workflows'
                ? 'Daily Workflow Executions'
                : 'Daily Operational Activities'}
            </h3>
            <span className="muted-copy" style={{ fontSize: '0.8125rem' }}>
              Real operational timestamps from database records ({totalCount} total in period)
            </span>
          </div>
        </div>

        {activeSeries.length === 0 ? (
          <div className="time-series-empty">
            <span aria-hidden="true" style={{ fontSize: '1.75rem', marginBottom: 'var(--space-2)' }}>
              📅
            </span>
            <p style={{ margin: 0, fontWeight: 500, color: 'var(--color-text)' }}>
              No activity recorded in the selected date range.
            </p>
            <span className="muted-copy" style={{ fontSize: '0.8125rem' }}>
              Create or modify leads, run workflows, or select &quot;All Time&quot; to see trend data.
            </span>
          </div>
        ) : (
          <div className="time-series-chart">
            <div className="time-series-bars-scroll">
              <div className="time-series-bars-track">
                {activeSeries.map((point) => {
                  const heightPercent = Math.max(12, Math.round((point.count / maxCount) * 100))
                  return (
                    <div key={point.date} className="time-series-bar-column">
                      <div className="bar-count-tip">{point.count}</div>
                      <div className="bar-outer-slot">
                        <div
                          className={`bar-inner-fill fill-metric-${activeMetric}`}
                          style={{ height: `${heightPercent}%` }}
                          title={`${point.date}: ${point.count}`}
                        />
                      </div>
                      <span className="bar-date-label">
                        {point.date.slice(5)} {/* MM-DD */}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  )
}

export default TimeSeriesChartSection
