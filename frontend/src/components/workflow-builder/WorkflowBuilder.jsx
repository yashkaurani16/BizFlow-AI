import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../context/ToastContext.jsx'
import { useWorkflows } from '../../context/WorkflowsContext.jsx'
import NodeConfigPanel from './NodeConfigPanel.jsx'
import NodePalette from './NodePalette.jsx'
import WorkflowCanvas from './WorkflowCanvas.jsx'
import WorkflowValidationBanner from './WorkflowValidationBanner.jsx'

export const DEFAULT_STARTER_WORKFLOW = {
  name: 'New Lead Outreach Flow',
  description: 'AI analyzes new leads, updates the CRM, drafts outreach, and creates a follow-up task.',
  trigger: 'New Lead Created',
  status: 'Active',
  isVisualWorkflow: true,
  nodes: [
    {
      id: 'node_trigger',
      type: 'trigger_new_lead',
      label: 'New Lead Inbound',
      category: 'trigger',
      position: { x: 50, y: 140 },
      config: { triggerEvent: 'lead_created' },
    },
    {
      id: 'node_analyze',
      type: 'ai_analyze_lead',
      label: 'Analyze Lead Fit',
      category: 'ai',
      position: { x: 340, y: 140 },
      config: { model: 'gemini-1.5-flash', minScoreThreshold: 60 },
    },
    {
      id: 'node_update_crm',
      type: 'crm_update_lead',
      label: 'Update CRM Record',
      category: 'crm',
      position: { x: 630, y: 140 },
      config: { updateFields: ['aiScore', 'aiSummary', 'priority'] },
    },
    {
      id: 'node_comm_email',
      type: 'comm_send_email',
      label: 'Send Email Outreach',
      category: 'communication',
      position: { x: 920, y: 70 },
      config: {
        humanApprovalRequired: true,
        channel: 'email',
        template: 'introductory_outreach',
      },
    },
    {
      id: 'node_task',
      type: 'crm_create_task',
      label: 'Create Sales Task',
      category: 'crm',
      position: { x: 920, y: 250 },
      config: { taskTitle: 'Review lead score and draft', priority: 'High', dueInHours: 24 },
    },
  ],
  edges: [
    { id: 'edge_trig_ana', source: 'node_trigger', target: 'node_analyze', label: '' },
    { id: 'edge_ana_crm', source: 'node_analyze', target: 'node_update_crm', label: '' },
    { id: 'edge_crm_email', source: 'node_update_crm', target: 'node_comm_email', label: '' },
    { id: 'edge_crm_task', source: 'node_update_crm', target: 'node_task', label: '' },
  ],
}

/**
 * Client-side validation helper mirroring backend validator
 */
function validateWorkflowGraph(name, nodes = [], edges = []) {
  const errors = []

  if (!name || !name.trim()) {
    errors.push('Workflow name is required.')
  }

  if (!Array.isArray(nodes) || nodes.length === 0) {
    errors.push('Workflow must contain at least one Trigger step.')
    return { isValid: false, errors }
  }

  const nodeMap = new Map()
  const triggerNodes = []

  for (const node of nodes) {
    if (!node.id) {
      errors.push('Each node must have a valid string ID.')
      continue
    }

    if (nodeMap.has(node.id)) {
      errors.push(`Duplicate node ID: ${node.id}`)
      continue
    }

    nodeMap.set(node.id, node)

    if (node.category === 'trigger') {
      triggerNodes.push(node)
    }

    // Human review validation on communication nodes
    if (node.category === 'communication') {
      if (node.config?.humanApprovalRequired !== true) {
        errors.push(
          `Communication step "${node.label || node.type}" must mandate human approval.`
        )
      }
    }
  }

  if (triggerNodes.length === 0) {
    errors.push('Workflow must contain exactly one starting Trigger node (New Lead).')
  } else if (triggerNodes.length > 1) {
    errors.push(`Found ${triggerNodes.length} starting triggers. Only one trigger is permitted.`)
  }

  // Reachability check via BFS
  const outgoingMap = new Map()
  for (const node of nodes) {
    outgoingMap.set(node.id, [])
  }

  for (const edge of edges) {
    if (!nodeMap.has(edge.source) || !nodeMap.has(edge.target)) {
      continue
    }
    if (edge.source === edge.target) {
      errors.push(`Self-loop detected on step "${nodeMap.get(edge.source)?.label || edge.source}".`)
      continue
    }
    outgoingMap.get(edge.source).push(edge.target)
  }

  if (triggerNodes.length === 1 && nodes.length > 1) {
    const reachable = new Set()
    const queue = [triggerNodes[0].id]

    while (queue.length > 0) {
      const curr = queue.shift()
      if (!reachable.has(curr)) {
        reachable.add(curr)
        const nbrs = outgoingMap.get(curr) || []
        for (const n of nbrs) {
          if (!reachable.has(n)) queue.push(n)
        }
      }
    }

    const orphans = nodes.filter((n) => !reachable.has(n.id))
    if (orphans.length > 0) {
      const names = orphans.map((n) => `"${n.label || n.type}"`).join(', ')
      errors.push(`Orphan steps detected: ${names}. Connect them from the starting Trigger.`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

function WorkflowBuilder({ initialWorkflow = null, isEditing = false }) {
  const navigate = useNavigate()
  const { addWorkflow, updateWorkflow, validateWorkflow } = useWorkflows()
  const { showToast } = useToast()

  // Workflow Form Fields
  const [name, setName] = useState(initialWorkflow?.name || DEFAULT_STARTER_WORKFLOW.name)
  const [description, setDescription] = useState(
    initialWorkflow?.description || DEFAULT_STARTER_WORKFLOW.description
  )
  const [trigger, setTrigger] = useState(
    initialWorkflow?.trigger || DEFAULT_STARTER_WORKFLOW.trigger
  )
  const [status, setStatus] = useState(initialWorkflow?.status || 'Active')

  // Graph Elements
  const [nodes, setNodes] = useState(
    initialWorkflow?.nodes && initialWorkflow.nodes.length > 0
      ? initialWorkflow.nodes
      : DEFAULT_STARTER_WORKFLOW.nodes
  )
  const [edges, setEdges] = useState(
    initialWorkflow?.edges && initialWorkflow.edges.length > 0
      ? initialWorkflow.edges
      : DEFAULT_STARTER_WORKFLOW.edges
  )

  // Selection & Panel State
  const [selectedNodeId, setSelectedNodeId] = useState(null)
  const [validationErrors, setValidationErrors] = useState([])
  const [isValid, setIsValid] = useState(true)
  const [isValidating, setIsValidating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Local live validation
  const runValidation = useCallback(
    async (currentName, currentNodes, currentEdges) => {
      const localRes = validateWorkflowGraph(currentName, currentNodes, currentEdges)
      setIsValid(localRes.isValid)
      setValidationErrors(localRes.errors)

      // Check with backend validator if available
      try {
        setIsValidating(true)
        const serverRes = await validateWorkflow({
          name: currentName,
          trigger,
          nodes: currentNodes,
          edges: currentEdges,
        })
        if (serverRes && serverRes.errors) {
          setIsValid(serverRes.isValid)
          setValidationErrors(serverRes.errors)
        }
      } catch (_err) {
        // Fallback to local validation
      } finally {
        setIsValidating(false)
      }
    },
    [trigger, validateWorkflow]
  )

  // Trigger validation on graph changes
  useEffect(() => {
    runValidation(name, nodes, edges)
  }, [name, nodes, edges, runValidation])

  // Add node from palette
  function handleAddNode(paletteItem) {
    const newId = `node_${paletteItem.category}_${Date.now().toString().slice(-4)}`
    // Auto position staggered to right of existing nodes
    const maxPosX = nodes.reduce((max, n) => Math.max(max, n.position.x), 50)
    const newPosition = {
      x: maxPosX + 260,
      y: 140 + (nodes.length % 3) * 60,
    }

    const config = { ...(paletteItem.defaultConfig || {}) }
    // Enforce human approval if communication node
    if (paletteItem.requiresHumanApproval || paletteItem.category === 'communication') {
      config.humanApprovalRequired = true
    }

    const newNode = {
      id: newId,
      type: paletteItem.type,
      label: paletteItem.label,
      category: paletteItem.category,
      position: newPosition,
      config,
    }

    setNodes((prev) => [...prev, newNode])
    setSelectedNodeId(newId)
    showToast(`Added ${newNode.label} to canvas`)
  }

  // Update node position from canvas drag
  function handleUpdateNodePosition(nodeId, newPos) {
    setNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, position: newPos } : n))
    )
  }

  // Update node configuration from drawer
  function handleUpdateNodeConfig(updatedNode) {
    // Safety check: ensure communication nodes never disable humanApprovalRequired
    if (updatedNode.category === 'communication') {
      updatedNode.config = {
        ...updatedNode.config,
        humanApprovalRequired: true,
      }
    }

    setNodes((prev) =>
      prev.map((n) => (n.id === updatedNode.id ? updatedNode : n))
    )
  }

  // Delete node
  function handleDeleteNode(nodeId) {
    setNodes((prev) => prev.filter((n) => n.id !== nodeId))
    setEdges((prev) => prev.filter((e) => e.source !== nodeId && e.target !== nodeId))
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null)
    }
    showToast('Step deleted from workflow')
  }

  // Add edge connection
  function handleAddEdge(newEdge) {
    setEdges((prev) => [...prev, newEdge])
    showToast('Steps connected')
  }

  // Delete edge connection
  function handleDeleteEdge(edgeId) {
    setEdges((prev) => prev.filter((e) => e.id !== edgeId))
    showToast('Connection removed')
  }

  // Reset to default layout
  function handleResetDefault() {
    if (window.confirm('Reset workflow to the standard recommended flow?')) {
      setName(DEFAULT_STARTER_WORKFLOW.name)
      setDescription(DEFAULT_STARTER_WORKFLOW.description)
      setNodes(DEFAULT_STARTER_WORKFLOW.nodes)
      setEdges(DEFAULT_STARTER_WORKFLOW.edges)
      setSelectedNodeId(null)
      showToast('Workflow reset to standard flow')
    }
  }

  // Save workflow
  async function handleSave() {
    const validation = validateWorkflowGraph(name, nodes, edges)
    if (!validation.isValid) {
      setValidationErrors(validation.errors)
      showToast(validation.errors[0] || 'Please fix workflow errors before saving.', 'error')
      return
    }

    setIsSaving(true)

    // Ensure all communication nodes have humanApprovalRequired locked
    const sanitizedNodes = nodes.map((node) => {
      if (node.category === 'communication') {
        return {
          ...node,
          config: {
            ...node.config,
            humanApprovalRequired: true,
          },
        }
      }
      return node
    })

    const payload = {
      name: name.trim(),
      description: description.trim(),
      trigger,
      status,
      nodes: sanitizedNodes,
      edges,
      isVisualWorkflow: true,
    }

    try {
      if (isEditing && initialWorkflow) {
        const id = initialWorkflow.id || initialWorkflow._id
        await updateWorkflow(id, payload)
        showToast(`Workflow "${name}" updated successfully`)
      } else {
        await addWorkflow(payload)
        showToast(`Workflow "${name}" created successfully`)
      }
      navigate('/workflows')
    } catch (err) {
      showToast(err.message || 'Error saving workflow', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || null

  return (
    <div className="wf-builder-container">
      {/* Top Action Bar */}
      <header className="wf-builder-header">
        <div className="wf-builder-header-left">
          <button
            type="button"
            className="btn btn-ghost btn-compact"
            onClick={() => navigate('/workflows')}
            title="Back to workflows list"
          >
            ← Back
          </button>
          <div className="wf-builder-title-inputs">
            <input
              type="text"
              className="wf-builder-name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Workflow Name"
              aria-label="Workflow Name"
            />
            <input
              type="text"
              className="wf-builder-desc-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description of this automated flow..."
              aria-label="Workflow Description"
            />
          </div>
        </div>

        <div className="wf-builder-header-right">
          <div className="wf-header-status-toggle">
            <label className="wf-status-toggle-label">
              <span className="wf-status-text">Trigger:</span>
              <select
                className="wf-status-select"
                value={trigger}
                onChange={(e) => setTrigger(e.target.value)}
              >
                <option value="New Lead Created">New Lead Created</option>
                <option value="Lead Form Submitted">Lead Form Submitted</option>
              </select>
            </label>
          </div>

          <div className="wf-header-status-toggle">
            <label className="wf-status-toggle-label">
              <span className="wf-status-text">Status:</span>
              <select
                className="wf-status-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </label>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-compact"
            onClick={() => runValidation(name, nodes, edges)}
            disabled={isValidating}
          >
            {isValidating ? 'Validating...' : 'Validate Graph'}
          </button>

          <button
            type="button"
            className="btn btn-ghost btn-compact"
            onClick={handleResetDefault}
          >
            Reset Flow
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Workflow'}
          </button>
        </div>
      </header>

      {/* Validation Banner */}
      <WorkflowValidationBanner
        errors={validationErrors}
        isValid={isValid}
        isChecking={isValidating}
      />

      {/* Main Workspace Layout */}
      <div className="wf-builder-body">
        {/* Left Palette */}
        <NodePalette onAddNode={handleAddNode} />

        {/* Center Interactive Canvas */}
        <main className="wf-builder-canvas-wrapper">
          <div className="wf-canvas-toolbar">
            <span className="wf-node-count-badge">
              {nodes.length} {nodes.length === 1 ? 'Step' : 'Steps'} • {edges.length} Connections
            </span>
            <span className="wf-canvas-hint">
              Drag cards to position • Click right circle then left circle to link steps
            </span>
          </div>

          <WorkflowCanvas
            nodes={nodes}
            edges={edges}
            selectedNodeId={selectedNodeId}
            onSelectNode={(node) => setSelectedNodeId(node.id)}
            onUpdateNodePosition={handleUpdateNodePosition}
            onDeleteNode={handleDeleteNode}
            onAddEdge={handleAddEdge}
            onDeleteEdge={handleDeleteEdge}
            onCanvasClick={() => setSelectedNodeId(null)}
          />
        </main>

        {/* Right Configuration Drawer */}
        {selectedNode && (
          <NodeConfigPanel
            node={selectedNode}
            onUpdate={handleUpdateNodeConfig}
            onClose={() => setSelectedNodeId(null)}
            onDelete={handleDeleteNode}
          />
        )}
      </div>
    </div>
  )
}

export default WorkflowBuilder
