import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { createAgentRecord, initialAgents } from '../data/agentsData.js'

const AgentsContext = createContext(null)

export function AgentsProvider({ children }) {
  const [agents, setAgents] = useState(initialAgents)

  const getAgent = useCallback(
    (id) => agents.find((agent) => agent.id === id) || null,
    [agents],
  )

  const addAgent = useCallback((fields) => {
    const agent = createAgentRecord(fields)
    setAgents((current) => [agent, ...current])
    return agent
  }, [])

  const updateAgent = useCallback((id, fields) => {
    let updated = null
    const now = new Date()
    const timeString = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })

    setAgents((current) =>
      current.map((agent) => {
        if (agent.id !== id) {
          return agent
        }

        const next = {
          ...agent,
          name: fields.name.trim(),
          type: fields.type,
          description: fields.description.trim(),
          instructions: fields.instructions.trim(),
          status: fields.status || agent.status,
          updatedAt: now.toISOString(),
          lastActivity: `Today, ${timeString}`,
        }
        updated = next
        return next
      }),
    )
    return updated
  }, [])

  const toggleAgentStatus = useCallback((id) => {
    let updated = null
    const now = new Date()
    const timeString = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })

    setAgents((current) =>
      current.map((agent) => {
        if (agent.id !== id) {
          return agent
        }
        const nextStatus = agent.status === 'Active' ? 'Inactive' : 'Active'
        const next = {
          ...agent,
          status: nextStatus,
          updatedAt: now.toISOString(),
          lastActivity: `Today, ${timeString}`,
        }
        updated = next
        return next
      }),
    )
    return updated
  }, [])

  const value = useMemo(
    () => ({ agents, getAgent, addAgent, updateAgent, toggleAgentStatus }),
    [agents, getAgent, addAgent, updateAgent, toggleAgentStatus],
  )

  return <AgentsContext.Provider value={value}>{children}</AgentsContext.Provider>
}

export function useAgents() {
  const context = useContext(AgentsContext)

  if (!context) {
    throw new Error('useAgents must be used within AgentsProvider')
  }

  return context
}
