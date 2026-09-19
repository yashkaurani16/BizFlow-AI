import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ConfirmDialog from '../components/ConfirmDialog.jsx'
import { EmptyState } from '../components/EmptyState.jsx'
import Select from '../components/Select.jsx'
import WorkflowCard from '../components/WorkflowCard.jsx'
import { useWorkflows } from '../context/WorkflowsContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { workflowStatuses } from '../data/enums.js'

function WorkflowsPage() {
  const { workflows, toggleWorkflowStatus } = useWorkflows()
  const { showToast } = useToast()
  const [statusFilter, setStatusFilter] = useState('All')
  const [pendingDeactivate, setPendingDeactivate] = useState(null)

  const filteredWorkflows = useMemo(() => {
    return workflows.filter((workflow) => {
      return statusFilter === 'All' || workflow.status === statusFilter
    })
  }, [workflows, statusFilter])

  function handleToggleStatus(workflow) {
    if (workflow.status === 'Active') {
      setPendingDeactivate(workflow)
    } else {
      toggleWorkflowStatus(workflow.id)
      showToast(`${workflow.name} is now active.`)
    }
  }

  function confirmDeactivation() {
    if (!pendingDeactivate) {
      return
    }
    toggleWorkflowStatus(pendingDeactivate.id)
    showToast(`${pendingDeactivate.name} is now inactive.`, 'info')
    setPendingDeactivate(null)
  }

  const hasNoWorkflowsAtAll = workflows.length === 0
  const hasNoFilteredMatches = !hasNoWorkflowsAtAll && filteredWorkflows.length === 0

  return (
    <div className="workflows-page">
      <div className="page-heading">
        <div>
          <h1>Workflow Automation</h1>
          <p>Create and manage automated business workflows.</p>
        </div>
        <Link to="/workflows/new" className="btn btn-primary">
          + Create Workflow
        </Link>
      </div>

      {hasNoWorkflowsAtAll ? (
        <EmptyState
          title="No workflows configured yet."
          message="Create an automated workflow to process incoming CRM leads."
          actionLabel="Create your first workflow"
          actionTo="/workflows/new"
        />
      ) : (
        <>
          <div className="workflows-toolbar">
            <Select
              id="workflow-status-filter"
              label="Filter by Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              {workflowStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </div>

          {hasNoFilteredMatches ? (
            <EmptyState
              title="No matching workflows"
              message="Try adjusting your status filter selection."
            />
          ) : (
            <div className="workflows-grid">
              {filteredWorkflows.map((workflow) => (
                <WorkflowCard
                  key={workflow.id}
                  workflow={workflow}
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
        message="The workflow configuration will remain available, but new executions will not start while it is inactive."
        confirmLabel="Deactivate"
        onCancel={() => setPendingDeactivate(null)}
        onConfirm={confirmDeactivation}
      />
    </div>
  )
}

export default WorkflowsPage
