import React from 'react'

const CATEGORY_META = {
  trigger: {
    color: '#0891b2',
    bgColor: '#ecfeff',
    borderColor: '#a5f3fc',
    icon: '⚡',
    label: 'Trigger',
  },
  ai: {
    color: '#7c3aed',
    bgColor: '#f5f3ff',
    borderColor: '#ddd6fe',
    icon: '🧠',
    label: 'AI Step',
  },
  crm: {
    color: '#059669',
    bgColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    icon: '📝',
    label: 'CRM Step',
  },
  communication: {
    color: '#d97706',
    bgColor: '#fffbeb',
    borderColor: '#fde68a',
    icon: '✉️',
    label: 'Communication',
  },
}

function getNodeSummary(node) {
  const config = node.config || {}
  switch (node.type) {
    case 'trigger_new_lead':
      return 'Event: Inbound Lead Captured'
    case 'ai_analyze_lead':
      return `Model: ${config.model || 'Gemini 1.5 Flash'} • Fit Score (0–100)`
    case 'ai_generate_draft':
      return `Draft ${config.channel ? config.channel.toUpperCase() : 'Message'} • ${config.tone || 'Professional'}`
    case 'crm_update_lead':
      return 'Sync AI Score, Priority & Summary'
    case 'crm_create_task':
      return `Task: ${config.priority || 'High'} Priority (${config.dueInHours || 24}h due)`
    case 'crm_record_activity':
      return `Audit Log: ${config.activityType || 'Workflow Execution'}`
    case 'comm_send_email':
      return 'Simulated Email • Locked Human Review'
    case 'comm_send_whatsapp':
      return 'Simulated WhatsApp • Locked Human Review'
    case 'comm_send_sms':
      return 'Simulated SMS • Locked Human Review'
    default:
      return node.type
  }
}

function WorkflowNodeCard({
  node,
  isSelected,
  isConnectSource,
  onSelect,
  onDelete,
  onStartConnect,
  onEndConnect,
  onMouseDown,
}) {
  const meta = CATEGORY_META[node.category] || CATEGORY_META.ai
  const isTrigger = node.category === 'trigger'
  const isComm = node.category === 'communication'

  return (
    <div
      id={`wf-node-${node.id}`}
      className={`wf-node-card ${isSelected ? 'wf-node--selected' : ''} ${
        isConnectSource ? 'wf-node--connect-source' : ''
      } wf-node--${node.category}`}
      style={{
        transform: `translate(${node.position.x}px, ${node.position.y}px)`,
      }}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(node)
      }}
      onMouseDown={(e) => {
        // Prevent drag when clicking ports or buttons
        if (e.target.closest('.wf-port') || e.target.closest('.wf-node-delete-btn')) return
        onMouseDown(e, node)
      }}
    >
      {/* Input Port (Left) - Not shown on starting triggers */}
      {!isTrigger && (
        <button
          type="button"
          className="wf-port wf-port--input"
          title="Connect input to this step"
          onClick={(e) => {
            e.stopPropagation()
            onEndConnect(node.id)
          }}
          aria-label={`Input connector for ${node.label}`}
        >
          <span className="wf-port-dot" />
        </button>
      )}

      {/* Output Port (Right) */}
      <button
        type="button"
        className="wf-port wf-port--output"
        title="Drag or click to connect next step"
        onClick={(e) => {
          e.stopPropagation()
          onStartConnect(node.id)
        }}
        aria-label={`Output connector for ${node.label}`}
      >
        <span className="wf-port-dot" />
      </button>

      {/* Card Header */}
      <div className="wf-node-header">
        <div className="wf-node-title-group">
          <span
            className="wf-node-cat-pill"
            style={{
              color: meta.color,
              backgroundColor: meta.bgColor,
              borderColor: meta.borderColor,
            }}
          >
            <span className="wf-node-cat-icon">{meta.icon}</span>
            {meta.label}
          </span>
          <h4 className="wf-node-label">{node.label || meta.label}</h4>
        </div>

        <button
          type="button"
          className="wf-node-delete-btn"
          title="Delete step from workflow"
          onClick={(e) => {
            e.stopPropagation()
            onDelete(node.id)
          }}
          aria-label={`Delete ${node.label}`}
        >
          ×
        </button>
      </div>

      {/* Node Body / Summary */}
      <div className="wf-node-body">
        <p className="wf-node-summary">{getNodeSummary(node)}</p>

        {isComm && (
          <div className="wf-node-safety-badge">
            <span className="wf-lock-icon" aria-hidden="true">
              🔒
            </span>
            <span>Human Approval Required</span>
          </div>
        )}
      </div>

      {/* Node Footer / ID Indicator */}
      <div className="wf-node-footer">
        <span className="wf-node-type-name">{node.type}</span>
        {isSelected && <span className="wf-selected-indicator">Configuring</span>}
      </div>
    </div>
  )
}

export default WorkflowNodeCard
