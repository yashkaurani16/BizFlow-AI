import React from 'react'
import SectionCard from './SectionCard.jsx'

function CommunicationAnalyticsSection({ communications }) {
  if (!communications) return null

  const {
    emailDrafts = 0,
    whatsappDrafts = 0,
    smsDrafts = 0,
    totalDrafts = 0,
    humanApprovedCount = 0,
    simulatedSends = 0,
    failedSends = 0,
    sandboxNotice = 'All communication channels operate in Development Sandbox Mode. Simulated sends are marked internally and not delivered to external carrier networks.',
  } = communications

  return (
    <SectionCard
      title="Communication Audit & Channel Activity"
      actions={
        <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>
          🛡️ Sandbox Mode Active
        </span>
      }
    >
      <div className="communication-analytics-wrapper">
        {/* Sandbox Notice Banner */}
        <div className="sandbox-notice-banner">
          <div className="sandbox-notice-icon" aria-hidden="true">
            🧪
          </div>
          <div className="sandbox-notice-content">
            <strong>Development Sandbox Mode Notice:</strong>
            <p>{sandboxNotice}</p>
          </div>
        </div>

        {/* Channel KPI Grid */}
        <div className="comm-kpi-grid">
          <div className="comm-card comm-card-email">
            <div className="comm-card-icon" aria-hidden="true">
              ✉️
            </div>
            <div className="comm-card-data">
              <span className="comm-card-label">Email Drafts</span>
              <strong className="comm-card-value">{emailDrafts}</strong>
              <span className="comm-card-sub">AI outreach templates</span>
            </div>
          </div>

          <div className="comm-card comm-card-whatsapp">
            <div className="comm-card-icon" aria-hidden="true">
              💬
            </div>
            <div className="comm-card-data">
              <span className="comm-card-label">WhatsApp Drafts</span>
              <strong className="comm-card-value">{whatsappDrafts}</strong>
              <span className="comm-card-sub">Instant messaging drafts</span>
            </div>
          </div>

          <div className="comm-card comm-card-sms">
            <div className="comm-card-icon" aria-hidden="true">
              📱
            </div>
            <div className="comm-card-data">
              <span className="comm-card-label">SMS Drafts</span>
              <strong className="comm-card-value">{smsDrafts}</strong>
              <span className="comm-card-sub">Direct alert messages</span>
            </div>
          </div>

          <div className="comm-card comm-card-approval">
            <div className="comm-card-icon" aria-hidden="true">
              ✅
            </div>
            <div className="comm-card-data">
              <span className="comm-card-label">Human-Approved</span>
              <strong className="comm-card-value">{humanApprovedCount}</strong>
              <span className="comm-card-sub">Explicit user approvals</span>
            </div>
          </div>

          <div className="comm-card comm-card-simulated">
            <div className="comm-card-icon" aria-hidden="true">
              🚀
            </div>
            <div className="comm-card-data">
              <span className="comm-card-label">Simulated Sends</span>
              <strong className="comm-card-value">{simulatedSends}</strong>
              <span className="comm-card-sub">Sandbox simulated dispatch</span>
            </div>
          </div>

          <div className="comm-card comm-card-failed">
            <div className="comm-card-icon" aria-hidden="true">
              ⚠️
            </div>
            <div className="comm-card-data">
              <span className="comm-card-label">Failed Attempts</span>
              <strong className="comm-card-value">{failedSends}</strong>
              <span className="comm-card-sub">Blocked or rejected</span>
            </div>
          </div>
        </div>

        {/* Human Governance Callout */}
        <div className="comm-governance-strip">
          <div className="governance-stat">
            <span className="governance-title">Total AI Communication Drafts Generated:</span>
            <span className="governance-number">{totalDrafts}</span>
          </div>
          <div className="governance-rule">
            <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
              Governance Rule
            </span>
            <span>
              100% of outbound communications require explicit human verification before simulated dispatch.
            </span>
          </div>
        </div>
      </div>
    </SectionCard>
  )
}

export default CommunicationAnalyticsSection
