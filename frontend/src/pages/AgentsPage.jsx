import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AgentCard from '../components/AgentCard.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { EmptyState } from '../components/EmptyState.jsx'
import Select from '../components/Select.jsx'
import { useAgents } from '../context/AgentsContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { agentStatuses, agentTypes } from '../data/enums.js'

function AgentsPage() {
  const { agents, toggleAgentStatus } = useAgents()
  const { showToast } = useToast()
  const [typeFilter, setTypeFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [pendingDeactivate, setPendingDeactivate] = useState(null)

  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      const matchesType = typeFilter === 'All' || agent.type === typeFilter
      const matchesStatus = statusFilter === 'All' || agent.status === statusFilter
      return matchesType && matchesStatus
    })
  }, [agents, typeFilter, statusFilter])

  function handleToggleStatus(agent) {
    if (agent.status === 'Active') {
      setPendingDeactivate(agent)
    } else {
      toggleAgentStatus(agent.id)
      showToast(`${agent.name} is now active.`)
    }
  }

  function confirmDeactivation() {
    if (!pendingDeactivate) {
      return
    }
    toggleAgentStatus(pendingDeactivate.id)
    showToast(`${pendingDeactivate.name} is now inactive.`, 'info')
    setPendingDeactivate(null)
  }

  const hasNoAgentsAtAll = agents.length === 0
  const hasNoFilteredMatches = !hasNoAgentsAtAll && filteredAgents.length === 0

  return (
    <div className="agents-page">
      <div className="page-heading">
        <div>
          <h1>AI Agents</h1>
          <p>Configure and manage the AI agents used by your business workflows.</p>
        </div>
        <Link to="/agents/new" className="btn btn-primary">
          + Create Agent
        </Link>
      </div>

      {hasNoAgentsAtAll ? (
        <EmptyState
          title="No AI agents configured yet."
          message="Create an agent to configure automation instructions for your business workflows."
          actionLabel="Create your first agent"
          actionTo="/agents/new"
        />
      ) : (
        <>
          <div className="agents-toolbar">
            <Select
              id="agent-type-filter"
              label="Filter by Type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="All">All Types</option>
              {agentTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Select>

            <Select
              id="agent-status-filter"
              label="Filter by Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              {agentStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </div>

          {hasNoFilteredMatches ? (
            <EmptyState
              title="No matching AI agents"
              message="Try adjusting your filter selection to find configured agents."
            />
          ) : (
            <div className="agents-grid">
              {filteredAgents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onToggleStatus={handleToggleStatus}
                />
              ))}
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={Boolean(pendingDeactivate)}
        title={pendingDeactivate ? `Deactivate ${pendingDeactivate.name}?` : ''}
        message="Existing configuration will remain available, but the agent will no longer be active."
        confirmLabel="Deactivate"
        onCancel={() => setPendingDeactivate(null)}
        onConfirm={confirmDeactivation}
      />
    </div>
  )
}

export default AgentsPage
