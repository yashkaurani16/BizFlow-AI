import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { createWorkflowRecord, initialWorkflows } from '../data/workflowsData.js'

const WorkflowsContext = createContext(null)

export function WorkflowsProvider({ children }) {
  const [workflows, setWorkflows] = useState(initialWorkflows)

  const getWorkflow = useCallback(
    (id) => workflows.find((workflow) => workflow.id === id) || null,
    [workflows],
  )

  const addWorkflow = useCallback((fields) => {
    const workflow = createWorkflowRecord(fields)
    setWorkflows((current) => [workflow, ...current])
    return workflow
  }, [])

  const updateWorkflow = useCallback((id, fields) => {
    let updated = null
    const now = new Date()

    setWorkflows((current) =>
      current.map((workflow) => {
        if (workflow.id !== id) {
          return workflow
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

  const toggleWorkflowStatus = useCallback((id) => {
    let updated = null
    const now = new Date()

    setWorkflows((current) =>
      current.map((workflow) => {
        if (workflow.id !== id) {
          return workflow
        }
        const nextStatus = workflow.status === 'Active' ? 'Inactive' : 'Active'
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
  }, [])

  const value = useMemo(
    () => ({ workflows, getWorkflow, addWorkflow, updateWorkflow, toggleWorkflowStatus }),
    [workflows, getWorkflow, addWorkflow, updateWorkflow, toggleWorkflowStatus],
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
