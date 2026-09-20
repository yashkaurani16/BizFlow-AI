import React, { useEffect, useRef, useState } from 'react'
import WorkflowNodeCard from './WorkflowNodeCard.jsx'

const NODE_WIDTH = 220
const NODE_HEIGHT = 130

function WorkflowCanvas({
  nodes = [],
  edges = [],
  selectedNodeId,
  onSelectNode,
  onUpdateNodePosition,
  onDeleteNode,
  onAddEdge,
  onDeleteEdge,
  onCanvasClick,
}) {
  const canvasRef = useRef(null)
  const [connectingSourceId, setConnectingSourceId] = useState(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [draggingNodeId, setDraggingNodeId] = useState(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  // Node position map for edge rendering
  const nodeMap = new Map()
  for (const node of nodes) {
    nodeMap.set(node.id, node)
  }

  // Handle connection start from output port
  function handleStartConnect(nodeId) {
    setConnectingSourceId(nodeId)
  }

  // Handle connection end on input port
  function handleEndConnect(targetNodeId) {
    if (!connectingSourceId) return
    if (connectingSourceId === targetNodeId) {
      setConnectingSourceId(null)
      return
    }

    // Check if target is a trigger (triggers cannot have incoming edges)
    const targetNode = nodeMap.get(targetNodeId)
    if (targetNode && targetNode.category === 'trigger') {
      alert('Trigger nodes cannot have incoming connections.')
      setConnectingSourceId(null)
      return
    }

    // Check if connection already exists
    const exists = edges.some(
      (e) => e.source === connectingSourceId && e.target === targetNodeId
    )
    if (!exists) {
      onAddEdge({
        id: `edge_${connectingSourceId}_${targetNodeId}_${Date.now()}`,
        source: connectingSourceId,
        target: targetNodeId,
        label: '',
      })
    }

    setConnectingSourceId(null)
  }

  // Mouse move on canvas (for dragging and connecting lines)
  function handleMouseMove(e) {
    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left + canvasRef.current.scrollLeft
    const y = e.clientY - rect.top + canvasRef.current.scrollTop

    setMousePos({ x, y })

    if (draggingNodeId) {
      const newX = Math.max(20, Math.round((x - dragOffset.x) / 10) * 10)
      const newY = Math.max(20, Math.round((y - dragOffset.y) / 10) * 10)
      onUpdateNodePosition(draggingNodeId, { x: newX, y: newY })
    }
  }

  function handleMouseUp() {
    if (draggingNodeId) {
      setDraggingNodeId(null)
    }
  }

  function handleNodeMouseDown(e, node) {
    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    const canvasX = e.clientX - rect.left + canvasRef.current.scrollLeft
    const canvasY = e.clientY - rect.top + canvasRef.current.scrollTop

    setDraggingNodeId(node.id)
    setDragOffset({
      x: canvasX - node.position.x,
      y: canvasY - node.position.y,
    })
  }

  // Cancel connecting when clicking canvas or pressing Escape
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setConnectingSourceId(null)
        setDraggingNodeId(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Calculate SVG connector coordinates
  function calculateEdgePath(sourceNode, targetNode) {
    const x1 = sourceNode.position.x + NODE_WIDTH
    const y1 = sourceNode.position.y + NODE_HEIGHT / 2
    const x2 = targetNode.position.x
    const y2 = targetNode.position.y + NODE_HEIGHT / 2

    const dx = Math.max(50, Math.abs(x2 - x1) * 0.45)
    return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`
  }

  // Calculate mid point for edge action badge
  function calculateEdgeMidpoint(sourceNode, targetNode) {
    const x1 = sourceNode.position.x + NODE_WIDTH
    const y1 = sourceNode.position.y + NODE_HEIGHT / 2
    const x2 = targetNode.position.x
    const y2 = targetNode.position.y + NODE_HEIGHT / 2
    return {
      x: (x1 + x2) / 2,
      y: (y1 + y2) / 2,
    }
  }

  // Temporary connecting line from source to cursor
  let tempPath = null
  if (connectingSourceId && nodeMap.has(connectingSourceId)) {
    const sourceNode = nodeMap.get(connectingSourceId)
    const x1 = sourceNode.position.x + NODE_WIDTH
    const y1 = sourceNode.position.y + NODE_HEIGHT / 2
    const x2 = mousePos.x
    const y2 = mousePos.y
    const dx = Math.max(40, Math.abs(x2 - x1) * 0.4)
    tempPath = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`
  }

  return (
    <div
      ref={canvasRef}
      className={`wf-canvas ${connectingSourceId ? 'wf-canvas--connecting' : ''}`}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={(e) => {
        if (connectingSourceId) {
          setConnectingSourceId(null)
        }
        if (onCanvasClick) onCanvasClick(e)
      }}
    >
      {/* Visual Canvas Background Grid */}
      <div className="wf-canvas-grid-pattern" aria-hidden="true" />

      {/* Helper floating notice when connecting */}
      {connectingSourceId && (
        <div className="wf-connecting-pill" role="status">
          <span>Click an input port (left circle) on another step to link. Press Esc to cancel.</span>
          <button
            type="button"
            className="wf-connecting-cancel-btn"
            onClick={() => setConnectingSourceId(null)}
          >
            Cancel
          </button>
        </div>
      )}

      {/* SVG Connections Overlay */}
      <svg className="wf-connections-layer" aria-label="Workflow Connections Graph">
        <defs>
          <marker
            id="wf-arrowhead"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#64748b" />
          </marker>
          <marker
            id="wf-arrowhead-active"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#1f4e8c" />
          </marker>
        </defs>

        {/* Existing Edges */}
        {edges.map((edge) => {
          const sourceNode = nodeMap.get(edge.source)
          const targetNode = nodeMap.get(edge.target)
          if (!sourceNode || !targetNode) return null

          const pathD = calculateEdgePath(sourceNode, targetNode)
          const mid = calculateEdgeMidpoint(sourceNode, targetNode)

          return (
            <g key={edge.id} className="wf-edge-group">
              {/* Thick transparent path for easier hover/click */}
              <path
                d={pathD}
                className="wf-edge-hitbox"
                onClick={(e) => {
                  e.stopPropagation()
                  if (window.confirm('Remove this connection?')) {
                    onDeleteEdge(edge.id)
                  }
                }}
              />
              {/* Visible edge line */}
              <path
                d={pathD}
                className="wf-edge-line"
                markerEnd="url(#wf-arrowhead)"
              />
              {/* Edge midpoint delete button */}
              <g
                className="wf-edge-badge"
                transform={`translate(${mid.x}, ${mid.y})`}
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteEdge(edge.id)
                }}
              >
                <circle r="10" className="wf-edge-badge-bg" />
                <text textAnchor="middle" dy="3.5" className="wf-edge-badge-text">
                  ×
                </text>
              </g>
            </g>
          )
        })}

        {/* Dynamic In-Progress Connection Line */}
        {tempPath && (
          <path
            d={tempPath}
            className="wf-edge-line--in-progress"
            markerEnd="url(#wf-arrowhead-active)"
          />
        )}
      </svg>

      {/* Nodes Container */}
      <div className="wf-nodes-layer">
        {nodes.map((node) => (
          <WorkflowNodeCard
            key={node.id}
            node={node}
            isSelected={node.id === selectedNodeId}
            isConnectSource={node.id === connectingSourceId}
            onSelect={onSelectNode}
            onDelete={onDeleteNode}
            onStartConnect={handleStartConnect}
            onEndConnect={handleEndConnect}
            onMouseDown={handleNodeMouseDown}
          />
        ))}
      </div>
    </div>
  )
}

export default WorkflowCanvas
