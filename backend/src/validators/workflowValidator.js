/**
 * Graph & Node Validation for BizFlow AI Visual Workflow Builder
 * Enforces strict structure, allowlisted node types, connectivity, and human approval safety.
 */

export const ALLOWED_NODE_TYPES = {
  trigger_new_lead: {
    type: 'trigger_new_lead',
    category: 'trigger',
    label: 'New Lead',
    description: 'Triggered whenever a new lead is captured or created in the CRM.',
    maxInputs: 0,
    maxOutputs: 5,
  },
  ai_analyze_lead: {
    type: 'ai_analyze_lead',
    category: 'ai',
    label: 'Analyze Lead',
    description: 'Evaluates lead fit, assigns qualification score (0-100), and generates recommendations.',
    maxInputs: 5,
    maxOutputs: 5,
  },
  ai_generate_draft: {
    type: 'ai_generate_draft',
    category: 'ai',
    label: 'Generate Communication Draft',
    description: 'Drafts tailored outreach messages for human review (Email, WhatsApp, or SMS).',
    maxInputs: 5,
    maxOutputs: 5,
  },
  crm_update_lead: {
    type: 'crm_update_lead',
    category: 'crm',
    label: 'Update Lead',
    description: 'Saves AI analysis, qualification scores, or updated status to the CRM lead record.',
    maxInputs: 5,
    maxOutputs: 5,
  },
  crm_create_task: {
    type: 'crm_create_task',
    category: 'crm',
    label: 'Create Follow-Up Task',
    description: 'Generates prioritized follow-up task for team members with due timing.',
    maxInputs: 5,
    maxOutputs: 5,
  },
  crm_record_activity: {
    type: 'crm_record_activity',
    category: 'crm',
    label: 'Record Activity',
    description: 'Logs execution step to the workspace activity audit trail.',
    maxInputs: 5,
    maxOutputs: 5,
  },
  comm_send_email: {
    type: 'comm_send_email',
    category: 'communication',
    label: 'Send Email',
    description: 'Dispatches or queues email to lead. Requires explicit human review and approval.',
    maxInputs: 5,
    maxOutputs: 5,
    requiresHumanApproval: true,
  },
  comm_send_whatsapp: {
    type: 'comm_send_whatsapp',
    category: 'communication',
    label: 'Send WhatsApp',
    description: 'Dispatches or queues WhatsApp message. Requires explicit human review and approval.',
    maxInputs: 5,
    maxOutputs: 5,
    requiresHumanApproval: true,
  },
  comm_send_sms: {
    type: 'comm_send_sms',
    category: 'communication',
    label: 'Send SMS',
    description: 'Dispatches or queues SMS text message. Requires explicit human review and approval.',
    maxInputs: 5,
    maxOutputs: 5,
    requiresHumanApproval: true,
  },
}

/**
 * Validates a visual workflow definition.
 * Returns { isValid: boolean, errors: string[] }
 */
export function validateWorkflowDefinition(workflowData = {}) {
  const errors = []
  const { name, nodes = [], edges = [] } = workflowData

  // 1. Basic Metadata Validation
  if (!name || typeof name !== 'string' || !name.trim()) {
    errors.push('Workflow name is required.')
  }

  // If this is a legacy workflow without visual nodes, pass through if name is present
  if (!Array.isArray(nodes) || nodes.length === 0) {
    return {
      isValid: errors.length === 0,
      errors,
      isLegacy: true,
    }
  }

  // 2. Node Allowlist & Configuration Validation
  const nodeMap = new Map()
  const triggerNodes = []

  for (const node of nodes) {
    if (!node.id || typeof node.id !== 'string') {
      errors.push('Each node must have a valid string ID.')
      continue
    }

    if (nodeMap.has(node.id)) {
      errors.push(`Duplicate node ID detected: "${node.id}". Node IDs must be unique.`)
      continue
    }

    nodeMap.set(node.id, node)

    const definition = ALLOWED_NODE_TYPES[node.type]
    if (!definition) {
      errors.push(`Invalid node type: "${node.type}". Node type must be an allowlisted type.`)
      continue
    }

    if (definition.category === 'trigger') {
      triggerNodes.push(node)
    }

    const config = node.config || {}

    // CRITICAL SAFETY CHECK: Communication nodes must mandate human approval
    if (definition.requiresHumanApproval) {
      if (config.humanApprovalRequired !== true) {
        errors.push(
          `Communication node "${node.label || definition.label}" must have Human Approval Required enabled.`
        )
      }
    }

    // Specific config checks
    if (node.type === 'ai_generate_draft') {
      if (config.channel && !['email', 'whatsapp', 'sms'].includes(config.channel)) {
        errors.push(`Invalid draft channel: "${config.channel}". Must be email, whatsapp, or sms.`)
      }
    }
  }

  // 3. Exactly One Starting Trigger
  if (triggerNodes.length === 0) {
    errors.push('Workflow must contain exactly one starting Trigger node (e.g. New Lead).')
  } else if (triggerNodes.length > 1) {
    errors.push(`Workflow contains ${triggerNodes.length} starting triggers. Only one trigger is permitted.`)
  }

  // 4. Edge Validation
  const outgoingMap = new Map()
  const incomingMap = new Map()

  for (const node of nodes) {
    outgoingMap.set(node.id, [])
    incomingMap.set(node.id, [])
  }

  if (Array.isArray(edges)) {
    const edgeIdSet = new Set()

    for (const edge of edges) {
      if (!edge.source || !edge.target) {
        errors.push('All connections must have a source and a target.')
        continue
      }

      if (edge.source === edge.target) {
        errors.push(`Self-connecting edge detected on node "${edge.source}". Self-loops are not allowed.`)
        continue
      }

      if (!nodeMap.has(edge.source)) {
        errors.push(`Edge connects from non-existent node ID: "${edge.source}".`)
        continue
      }

      if (!nodeMap.has(edge.target)) {
        errors.push(`Edge connects to non-existent node ID: "${edge.target}".`)
        continue
      }

      // Check trigger cannot have incoming edges
      const targetNode = nodeMap.get(edge.target)
      if (targetNode && ALLOWED_NODE_TYPES[targetNode.type]?.category === 'trigger') {
        errors.push('Starting Trigger nodes cannot have incoming connections.')
      }

      outgoingMap.get(edge.source).push(edge.target)
      incomingMap.get(edge.target).push(edge.source)

      const edgeKey = `${edge.source}->${edge.target}`
      if (edgeIdSet.has(edgeKey)) {
        errors.push(`Duplicate connection between "${edge.source}" and "${edge.target}".`)
      }
      edgeIdSet.add(edgeKey)
    }
  }

  // 5. Reachability / Orphan Nodes Check (BFS from Trigger)
  if (triggerNodes.length === 1 && nodes.length > 1) {
    const startNodeId = triggerNodes[0].id
    const reachable = new Set()
    const queue = [startNodeId]

    while (queue.length > 0) {
      const current = queue.shift()
      if (!reachable.has(current)) {
        reachable.add(current)
        const neighbors = outgoingMap.get(current) || []
        for (const neighbor of neighbors) {
          if (!reachable.has(neighbor)) {
            queue.push(neighbor)
          }
        }
      }
    }

    const orphanNodes = nodes.filter((n) => !reachable.has(n.id))
    if (orphanNodes.length > 0) {
      const orphanNames = orphanNodes.map((n) => `"${n.label || n.type}"`).join(', ')
      errors.push(`Orphan nodes detected: ${orphanNames}. All nodes must be connected from the starting Trigger.`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    isLegacy: false,
  }
}

export default {
  ALLOWED_NODE_TYPES,
  validateWorkflowDefinition,
}
