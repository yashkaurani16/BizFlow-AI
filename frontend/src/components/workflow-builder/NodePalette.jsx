import React from 'react'

export const PALETTE_CATEGORIES = [
  {
    id: 'trigger',
    name: 'Triggers',
    color: '#0891b2',
    description: 'Starting events for the workflow',
    items: [
      {
        type: 'trigger_new_lead',
        label: 'New Lead',
        category: 'trigger',
        icon: '⚡',
        description: 'Fires when an inbound lead is received or captured in the CRM.',
        defaultConfig: { triggerEvent: 'lead_created' },
      },
    ],
  },
  {
    id: 'ai',
    name: 'AI Intelligence',
    color: '#7c3aed',
    description: 'Powered by Google Gemini',
    items: [
      {
        type: 'ai_analyze_lead',
        label: 'Analyze Lead',
        category: 'ai',
        icon: '🧠',
        description: 'Evaluates lead fit, assigns 0–100 score, and generates recommendations.',
        defaultConfig: { model: 'gemini-1.5-flash', minScoreThreshold: 60 },
      },
      {
        type: 'ai_generate_draft',
        label: 'Generate Communication Draft',
        category: 'ai',
        icon: '✨',
        description: 'Drafts tailored outreach messages for human review (Email, WhatsApp, or SMS).',
        defaultConfig: { channel: 'email', tone: 'professional' },
      },
    ],
  },
  {
    id: 'crm',
    name: 'CRM Operations',
    color: '#059669',
    description: 'Lead records, tasks, and audit logs',
    items: [
      {
        type: 'crm_update_lead',
        label: 'Update Lead',
        category: 'crm',
        icon: '📝',
        description: 'Saves AI analysis, qualification scores, or updated status to the CRM lead record.',
        defaultConfig: { updateFields: ['aiScore', 'aiSummary', 'priority'] },
      },
      {
        type: 'crm_create_task',
        label: 'Create Follow-Up Task',
        category: 'crm',
        icon: '✅',
        description: 'Generates prioritized follow-up task for team members with due timing.',
        defaultConfig: { taskTitle: 'Follow up with lead', priority: 'High', dueInHours: 24 },
      },
      {
        type: 'crm_record_activity',
        label: 'Record Activity',
        category: 'crm',
        icon: '📋',
        description: 'Logs execution step to the workspace activity audit trail.',
        defaultConfig: { activityType: 'Workflow Step', status: 'Completed' },
      },
    ],
  },
  {
    id: 'communication',
    name: 'External Communication',
    color: '#d97706',
    description: 'Requires explicit human approval',
    items: [
      {
        type: 'comm_send_email',
        label: 'Send Email',
        category: 'communication',
        icon: '✉️',
        description: 'Queues sandbox email draft. Mandatory Human Approval Required before sending.',
        requiresHumanApproval: true,
        defaultConfig: {
          channel: 'email',
          humanApprovalRequired: true,
          template: 'introductory_outreach',
        },
      },
      {
        type: 'comm_send_whatsapp',
        label: 'Send WhatsApp',
        category: 'communication',
        icon: '💬',
        description: 'Queues sandbox WhatsApp draft. Mandatory Human Approval Required before sending.',
        requiresHumanApproval: true,
        defaultConfig: {
          channel: 'whatsapp',
          humanApprovalRequired: true,
          template: 'quick_followup',
        },
      },
      {
        type: 'comm_send_sms',
        label: 'Send SMS',
        category: 'communication',
        icon: '📱',
        description: 'Queues sandbox SMS draft. Mandatory Human Approval Required before sending.',
        requiresHumanApproval: true,
        defaultConfig: {
          channel: 'sms',
          humanApprovalRequired: true,
          template: 'sms_alert',
        },
      },
    ],
  },
]

function NodePalette({ onAddNode }) {
  return (
    <aside className="wf-palette" aria-label="Step Palette">
      <div className="wf-palette-header">
        <h3 className="wf-palette-title">Step Library</h3>
        <p className="wf-palette-subtitle">Click a step to add it to your workflow canvas.</p>
      </div>

      <div className="wf-palette-categories">
        {PALETTE_CATEGORIES.map((cat) => (
          <div key={cat.id} className="wf-palette-cat-group">
            <div className="wf-palette-cat-header">
              <span
                className="wf-palette-cat-dot"
                style={{ backgroundColor: cat.color }}
                aria-hidden="true"
              />
              <span className="wf-palette-cat-name">{cat.name}</span>
            </div>

            <div className="wf-palette-items">
              {cat.items.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  className={`wf-palette-item wf-palette-item--${item.category}`}
                  onClick={() => onAddNode(item)}
                  title={`Add ${item.label} to canvas`}
                >
                  <div className="wf-palette-item-top">
                    <span className="wf-palette-item-icon" aria-hidden="true">
                      {item.icon}
                    </span>
                    <span className="wf-palette-item-label">{item.label}</span>
                  </div>
                  <p className="wf-palette-item-desc">{item.description}</p>
                  {item.requiresHumanApproval && (
                    <span className="wf-badge-locked-approval" title="Communication nodes require human approval">
                      🔒 Human Review Required
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}

export default NodePalette
