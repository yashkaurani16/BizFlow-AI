import React from 'react'

function NodeConfigPanel({ node, onUpdate, onClose, onDelete }) {
  if (!node) return null

  const config = node.config || {}
  const isComm = node.category === 'communication'

  function handleLabelChange(e) {
    onUpdate({
      ...node,
      label: e.target.value,
    })
  }

  function handleConfigChange(key, value) {
    onUpdate({
      ...node,
      config: {
        ...node.config,
        [key]: value,
      },
    })
  }

  return (
    <aside className="wf-config-panel" aria-label="Step Configuration Drawer">
      <div className="wf-config-header">
        <div>
          <span className={`wf-config-category-badge wf-badge--${node.category}`}>
            {node.category.toUpperCase()} STEP
          </span>
          <h3 className="wf-config-title">Configure Step</h3>
        </div>
        <button
          type="button"
          className="wf-config-close-btn"
          onClick={onClose}
          aria-label="Close configuration panel"
        >
          ✕
        </button>
      </div>

      <div className="wf-config-body">
        {/* Step Label */}
        <div className="wf-form-group">
          <label htmlFor="node-label-input" className="wf-form-label">
            Step Label
          </label>
          <input
            id="node-label-input"
            type="text"
            className="wf-input"
            value={node.label || ''}
            onChange={handleLabelChange}
            placeholder="e.g. Analyze Inbound Lead"
          />
          <span className="wf-form-hint">Display name shown on the visual canvas.</span>
        </div>

        {/* Step Type (Read Only) */}
        <div className="wf-form-group">
          <label className="wf-form-label">Step Type Identifier</label>
          <input
            type="text"
            className="wf-input wf-input--readonly"
            value={node.type}
            readOnly
          />
        </div>

        {/* Type Specific Fields */}
        {node.type === 'trigger_new_lead' && (
          <div className="wf-config-section">
            <h4 className="wf-section-title">Trigger Configuration</h4>
            <div className="wf-form-group">
              <label htmlFor="trigger-event-select" className="wf-form-label">
                CRM Event
              </label>
              <select
                id="trigger-event-select"
                className="wf-select"
                value={config.triggerEvent || 'lead_created'}
                onChange={(e) => handleConfigChange('triggerEvent', e.target.value)}
              >
                <option value="lead_created">New Lead Created in CRM</option>
                <option value="lead_form_submitted">Web Form Lead Capture</option>
              </select>
            </div>
            <p className="wf-help-text">
              This step triggers when a new lead enters the CRM system.
            </p>
          </div>
        )}

        {node.type === 'ai_analyze_lead' && (
          <div className="wf-config-section">
            <h4 className="wf-section-title">Gemini AI Intelligence</h4>
            <div className="wf-form-group">
              <label htmlFor="ai-model-select" className="wf-form-label">
                AI Model
              </label>
              <select
                id="ai-model-select"
                className="wf-select"
                value={config.model || 'gemini-1.5-flash'}
                onChange={(e) => handleConfigChange('model', e.target.value)}
              >
                <option value="gemini-1.5-flash">Google Gemini 1.5 Flash (Fast & Bounded)</option>
                <option value="gemini-1.5-pro">Google Gemini 1.5 Pro (Deep Reasoning)</option>
              </select>
            </div>

            <div className="wf-form-group">
              <label htmlFor="ai-threshold-input" className="wf-form-label">
                Qualification Score Threshold (0–100)
              </label>
              <input
                id="ai-threshold-input"
                type="number"
                min="0"
                max="100"
                className="wf-input"
                value={config.minScoreThreshold ?? 60}
                onChange={(e) =>
                  handleConfigChange('minScoreThreshold', parseInt(e.target.value, 10) || 0)
                }
              />
              <span className="wf-form-hint">Leads scoring above this receive High Priority.</span>
            </div>

            <div className="wf-form-group">
              <label htmlFor="ai-criteria-input" className="wf-form-label">
                Custom Evaluation Focus
              </label>
              <textarea
                id="ai-criteria-input"
                className="wf-textarea"
                rows="3"
                value={config.evaluationCriteria || ''}
                onChange={(e) => handleConfigChange('evaluationCriteria', e.target.value)}
                placeholder="Assess budget, urgency, and decision-maker status..."
              />
            </div>
          </div>
        )}

        {node.type === 'ai_generate_draft' && (
          <div className="wf-config-section">
            <h4 className="wf-section-title">Outreach Draft Settings</h4>
            <div className="wf-form-group">
              <label htmlFor="draft-channel-select" className="wf-form-label">
                Target Channel
              </label>
              <select
                id="draft-channel-select"
                className="wf-select"
                value={config.channel || 'email'}
                onChange={(e) => handleConfigChange('channel', e.target.value)}
              >
                <option value="email">Email Outreach</option>
                <option value="whatsapp">WhatsApp Message</option>
                <option value="sms">SMS Text</option>
              </select>
            </div>

            <div className="wf-form-group">
              <label htmlFor="draft-tone-select" className="wf-form-label">
                Draft Tone
              </label>
              <select
                id="draft-tone-select"
                className="wf-select"
                value={config.tone || 'professional'}
                onChange={(e) => handleConfigChange('tone', e.target.value)}
              >
                <option value="professional">Professional & Direct</option>
                <option value="friendly">Warm & Welcoming</option>
                <option value="urgent">Urgent & Time-Sensitive</option>
                <option value="consultative">Consultative & Helpful</option>
              </select>
            </div>
          </div>
        )}

        {node.type === 'crm_update_lead' && (
          <div className="wf-config-section">
            <h4 className="wf-section-title">CRM Lead Update Fields</h4>
            <p className="wf-help-text">
              Select which fields from preceding AI steps to persist to the Lead record:
            </p>
            <div className="wf-checkbox-group">
              <label className="wf-checkbox-label">
                <input
                  type="checkbox"
                  checked={true}
                  readOnly
                  disabled
                />
                <span>AI Fit Score (0–100)</span>
              </label>
              <label className="wf-checkbox-label">
                <input
                  type="checkbox"
                  checked={true}
                  readOnly
                  disabled
                />
                <span>AI Qualification Summary</span>
              </label>
              <label className="wf-checkbox-label">
                <input
                  type="checkbox"
                  checked={true}
                  readOnly
                  disabled
                />
                <span>Calculated Priority (High / Medium / Low)</span>
              </label>
            </div>
          </div>
        )}

        {node.type === 'crm_create_task' && (
          <div className="wf-config-section">
            <h4 className="wf-section-title">Follow-Up Task Configuration</h4>
            <div className="wf-form-group">
              <label htmlFor="task-title-input" className="wf-form-label">
                Default Task Title
              </label>
              <input
                id="task-title-input"
                type="text"
                className="wf-input"
                value={config.taskTitle || 'Follow up with lead'}
                onChange={(e) => handleConfigChange('taskTitle', e.target.value)}
              />
            </div>

            <div className="wf-form-group">
              <label htmlFor="task-priority-select" className="wf-form-label">
                Task Priority
              </label>
              <select
                id="task-priority-select"
                className="wf-select"
                value={config.priority || 'High'}
                onChange={(e) => handleConfigChange('priority', e.target.value)}
              >
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </div>

            <div className="wf-form-group">
              <label htmlFor="task-due-input" className="wf-form-label">
                Due In (Hours)
              </label>
              <input
                id="task-due-input"
                type="number"
                min="1"
                max="168"
                className="wf-input"
                value={config.dueInHours ?? 24}
                onChange={(e) =>
                  handleConfigChange('dueInHours', parseInt(e.target.value, 10) || 24)
                }
              />
            </div>
          </div>
        )}

        {node.type === 'crm_record_activity' && (
          <div className="wf-config-section">
            <h4 className="wf-section-title">Audit Trail Activity</h4>
            <div className="wf-form-group">
              <label htmlFor="activity-type-select" className="wf-form-label">
                Activity Category
              </label>
              <select
                id="activity-type-select"
                className="wf-select"
                value={config.activityType || 'Workflow Step'}
                onChange={(e) => handleConfigChange('activityType', e.target.value)}
              >
                <option value="Workflow Step">Workflow Step Execution</option>
                <option value="AI Analysis">AI Intelligence Summary</option>
                <option value="Lead Qualification">Lead Qualification Note</option>
              </select>
            </div>
          </div>
        )}

        {/* Communication Nodes — STRICT HUMAN APPROVAL REQUIREMENT */}
        {isComm && (
          <div className="wf-config-section wf-config-section--comm">
            <div className="wf-safety-banner">
              <div className="wf-safety-banner-header">
                <span className="wf-safety-icon" aria-hidden="true">
                  🛡️
                </span>
                <strong>Mandatory Safety Control</strong>
              </div>
              <p className="wf-safety-banner-text">
                External communication channels must <strong>never send automatically</strong>.
                Messages are queued as drafts in <em>Development Sandbox Mode</em> and require
                explicit human review and approval.
              </p>
            </div>

            <div className="wf-form-group">
              <label className="wf-form-label">Approval Governance</label>
              <div className="wf-locked-toggle-box">
                <span className="wf-locked-toggle-badge">
                  🔒 Human Approval Required: LOCKED ON
                </span>
                <p className="wf-locked-desc">
                  This setting is locked by system policy to prevent autonomous message dispatch.
                </p>
              </div>
            </div>

            <div className="wf-form-group">
              <label htmlFor="comm-template-input" className="wf-form-label">
                Message Template Reference
              </label>
              <input
                id="comm-template-input"
                type="text"
                className="wf-input"
                value={config.template || 'standard_outreach'}
                onChange={(e) => handleConfigChange('template', e.target.value)}
                placeholder="standard_outreach"
              />
            </div>

            <div className="wf-form-group">
              <label className="wf-form-label">Adapter Mode</label>
              <div className="wf-sandbox-tag">
                <span>🧪 Development Sandbox Adapter (Simulated Delivery)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="wf-config-footer">
        <button
          type="button"
          className="btn btn-secondary btn-compact"
          onClick={onClose}
        >
          Done
        </button>
        <button
          type="button"
          className="btn btn-danger btn-compact"
          onClick={() => {
            onDelete(node.id)
            onClose()
          }}
        >
          Delete Step
        </button>
      </div>
    </aside>
  )
}

export default NodeConfigPanel
