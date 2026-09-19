import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { createWorkflowRecord, initialWorkflows } from '../data/workflowsData.js'
import { workflowsApi } from '../services/api.js'

const WorkflowsContext = createContext(null)

function normalizeWorkflow(workflow) {
  if (!workflow) return null
  return {
    ...workflow,
    id: workflow.id || workflow._id?.toString() || '',
    steps: workflow.steps || [
      { id: '1', name: 'New Lead', type: 'trigger' },
      { id: '2', name: 'Analyze Lead', type: 'ai' },
      { id: '3', name: 'Save Analysis to CRM Lead', type: 'crm' },
      { id: '4', name: 'Create Follow-Up Task', type: 'task' },
      { id: '5', name: 'Record Activity', type: 'log' },
    ],
    agent:
      workflow.agent ||
      (workflow.assignedAgent && typeof workflow.assignedAgent === 'object'
        ? workflow.assignedAgent.name
        : 'Sales Agent'),
    executions: workflow.executions || [],
  }
}

export function WorkflowsProvider({ children }) {
  const [workflows, setWorkflows] = useState(initialWorkflows.map(normalizeWorkflow))
  const [isLoading, setIsLoading] = useState(false)

  // Fetch workflows from backend API
  useEffect(() => {
    let active = true

    async function loadWorkflows() {
      try {
        setIsLoading(true)
        const res = await workflowsApi.getAll()
        if (active && res && res.success && Array.isArray(res.workflows) && res.workflows.length > 0) {
          setWorkflows(res.workflows.map(normalizeWorkflow))
        }
      } catch (err) {
        console.warn('[WorkflowsContext] Using initial state (API unavailable or unauthenticated):', err.message)
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    loadWorkflows()

    return () => {
      active = false
    }
  }, [])

  const getWorkflow = useCallback(
    (id) => workflows.find((workflow) => workflow.id === id || workflow._id === id) || null,
    [workflows],
  )

  const addWorkflow = useCallback(async (fields) => {
    let newWorkflow = null
    try {
      const res = await workflowsApi.create(fields)
      if (res && res.success && res.workflow) {
        newWorkflow = normalizeWorkflow(res.workflow)
      }
    } catch (err) {
      console.warn('[WorkflowsContext] API create workflow failed, using local creation:', err.message)
    }

    if (!newWorkflow) {
      newWorkflow = normalizeWorkflow(createWorkflowRecord(fields))
    }

    setWorkflows((current) => [newWorkflow, ...current])
    return newWorkflow
  }, [])

  const updateWorkflow = useCallback(async (id, fields) => {
    let updated = null
    const now = new Date()

    try {
      const res = await workflowsApi.update(id, fields)
      if (res && res.success && res.workflow) {
        updated = normalizeWorkflow(res.workflow)
      }
    } catch (err) {
      console.warn('[WorkflowsContext] API update workflow failed, using local update:', err.message)
    }

    setWorkflows((current) =>
      current.map((workflow) => {
        if (workflow.id !== id && workflow._id !== id) {
          return workflow
        }

        if (updated) {
          return updated
        }

        const next = {
          ...workflow,
          name: fields.name.trim(),
          description: fields.description.trim(),
          trigger: fields.trigger,
          agent: fields.agent,
          status: fields.status || workflow.status,
          updatedAt: now.toISOString(),
        }
        updated = next
        return next
      }),
    )

    return updated
  }, [])

  const toggleWorkflowStatus = useCallback(async (id) => {
    const target = workflows.find((w) => w.id === id || w._id === id)
    if (!target) return null

    const nextStatus = target.status === 'Active' ? 'Inactive' : 'Active'
    let updated = null
    const now = new Date()

    try {
      const res = await workflowsApi.update(id, { status: nextStatus })
      if (res && res.success && res.workflow) {
        updated = normalizeWorkflow(res.workflow)
      }
    } catch (err) {
      console.warn('[WorkflowsContext] API toggle status failed, toggling locally:', err.message)
    }

    setWorkflows((current) =>
      current.map((workflow) => {
        if (workflow.id !== id && workflow._id !== id) {
          return workflow
        }

        if (updated) {
          return updated
        }

        const next = {
          ...workflow,
          status: nextStatus,
          updatedAt: now.toISOString(),
        }
        updated = next
        return next
      }),
    )

    return updated
  }, [workflows])

  const value = useMemo(
    () => ({ workflows, getWorkflow, addWorkflow, updateWorkflow, toggleWorkflowStatus, isLoading }),
    [workflows, getWorkflow, addWorkflow, updateWorkflow, toggleWorkflowStatus, isLoading],
  )

  return <WorkflowsContext.Provider value={value}>{children}</WorkflowsContext.Provider>
}

export function useWorkflows() {
  const context = useContext(WorkflowsContext)
  if (!context) {
    throw new Error('useWorkflows must be used within WorkflowsProvider')
  }
  return context
}

export default WorkflowsContext
