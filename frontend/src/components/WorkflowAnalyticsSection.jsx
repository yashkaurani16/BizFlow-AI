import { Link } from 'react-router-dom'
import SectionCard from './SectionCard.jsx'
import StatusBadge from './StatusBadge.jsx'

function WorkflowAnalyticsSection({ data, workflows = [] }) {
  const {
    totalWorkflows,
    activeWorkflows,
    inactiveWorkflows,
    successfulExecutions,
    failedExecutions,
  } = data

  return (
    <SectionCard
      title="Workflow Automation Performance"
      actions={
        <Link to="/workflows" className="btn btn-secondary btn-compact">
          View Workflows
        </Link>
      }
    >
      <div className="analytics-summary-chips">
        <div className="summary-chip">
          <span className="chip-label">Total Workflows</span>
          <span className="chip-value">{totalWorkflows}</span>
        </div>
        <div className="summary-chip">
          <span className="chip-label">Active</span>
          <span className="chip-value text-success">{activeWorkflows}</span>
        </div>
        <div className="summary-chip">
          <span className="chip-label">Inactive</span>
          <span className="chip-value text-muted">{inactiveWorkflows}</span>
        </div>
        <div className="summary-chip">
          <span className="chip-label">Successful Runs</span>
          <span className="chip-value text-success">{successfulExecutions}</span>
        </div>
        <div className="summary-chip">
          <span className="chip-label">Failed Runs</span>
          <span className="chip-value text-danger">{failedExecutions}</span>
        </div>
      </div>

      <div className="analytics-table-wrap" style={{ marginTop: '1rem' }}>
        <table className="analytics-table" aria-label="Workflow Automation Performance">
          <thead>
            <tr>
              <th scope="col">Workflow</th>
              <th scope="col">Trigger</th>
              <th scope="col">Assigned Agent</th>
              <th scope="col">Steps</th>
              <th scope="col">Status</th>
              <th scope="col">Last Execution</th>
              <th scope="col">Execution Result</th>
            </tr>
          </thead>
          <tbody>
            {workflows.map((wf) => (
              <tr key={wf.id}>
                <td>
                  <strong>{wf.name}</strong>
                </td>
                <td>
                  <span className="workflow-trigger-badge">{wf.trigger}</span>
                </td>
                <td>{wf.agent}</td>
                <td>{wf.steps?.length || 5} steps</td>
                <td>
                  <StatusBadge status={wf.status} />
                </td>
                <td>{wf.lastExecution}</td>
                <td>
                  <StatusBadge status={wf.executionStatus} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  )
}

export default WorkflowAnalyticsSection
