import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { createAgentRecord, initialAgents } from '../data/agentsData.js'
import { agentsApi } from '../services/api.js'

const AgentsContext = createContext(null)

function normalizeAgent(agent) {
  if (!agent) return null
  return {
    ...agent,
    id: agent.id || agent._id?.toString() || '',
  }
}

export function AgentsProvider({ children }) {
  const [agents, setAgents] = useState(initialAgents.map(normalizeAgent))
  const [isLoading, setIsLoading] = useState(false)

  // Fetch agents from backend API
  useEffect(() => {
    let active = true

    async function loadAgents() {
      try {
        setIsLoading(true)
        const res = await agentsApi.getAll()
        if (active && res && res.success && Array.isArray(res.agents) && res.agents.length > 0) {
          setAgents(res.agents.map(normalizeAgent))
        }
      } catch (err) {
        console.warn('[AgentsContext] Using initial state (API unavailable or unauthenticated):', err.message)
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    loadAgents()

    return () => {
      active = false
    }
  }, [])

  const getAgent = useCallback(
    (id) => agents.find((agent) => agent.id === id || agent._id === id) || null,
    [agents],
  )

  const addAgent = useCallback(async (fields) => {
    let newAgent = null
    try {
      const res = await agentsApi.create(fields)
      if (res && res.success && res.agent) {
        newAgent = normalizeAgent(res.agent)
      }
    } catch (err) {
      console.warn('[AgentsContext] API create agent failed, using local creation:', err.message)
    }

    if (!newAgent) {
      newAgent = normalizeAgent(createAgentRecord(fields))
    }

    setAgents((current) => [newAgent, ...current])
    return newAgent
  }, [])

  const updateAgent = useCallback(async (id, fields) => {
    let updated = null
    const now = new Date()
    const timeString = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })

    try {
      const res = await agentsApi.update(id, fields)
      if (res && res.success && res.agent) {
        updated = normalizeAgent(res.agent)
      }
    } catch (err) {
      console.warn('[AgentsContext] API update agent failed, using local update:', err.message)
    }

    setAgents((current) =>
      current.map((agent) => {
        if (agent.id !== id && agent._id !== id) {
          return agent
        }

        if (updated) {
          return updated
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

  const toggleAgentStatus = useCallback(async (id) => {
    const target = agents.find((a) => a.id === id || a._id === id)
    if (!target) return null

    const nextStatus = target.status === 'Active' ? 'Inactive' : 'Active'
    let updated = null
    const now = new Date()
    const timeString = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })

    try {
      const res = await agentsApi.update(id, { status: nextStatus })
      if (res && res.success && res.agent) {
        updated = normalizeAgent(res.agent)
      }
    } catch (err) {
      console.warn('[AgentsContext] API toggle status failed, toggling locally:', err.message)
    }

    setAgents((current) =>
      current.map((agent) => {
        if (agent.id !== id && agent._id !== id) {
          return agent
        }

        if (updated) {
          return updated
        }

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
  }, [agents])

  const value = useMemo(
    () => ({ agents, getAgent, addAgent, updateAgent, toggleAgentStatus, isLoading }),
    [agents, getAgent, addAgent, updateAgent, toggleAgentStatus, isLoading],
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

export default AgentsContext
