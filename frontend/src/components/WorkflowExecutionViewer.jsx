import { useState } from 'react'
import Alert from './Alert.jsx'
import Card from './Card.jsx'
import StatusBadge from './StatusBadge.jsx'

function WorkflowExecutionViewer({ executions = [] }) {
  const [selectedRunId, setSelectedRunId] = useState(executions[0]?.id || '')
  const currentRun = executions.find((run) => run.id === selectedRunId) || executions[0]

  if (!currentRun) {
    return (
      <Card className="workflow-executions-card">
        <h2>Execution Runs</h2>
        <p className="muted-copy">No executions recorded yet. Creating a lead triggers this workflow.</p>
      </Card>
    )
  }

  const isFailed = currentRun.status === 'Failed'

  return (
    <Card className="workflow-executions-card">
      <div className="execution-header">
        <div>
          <h2>Mock Execution History</h2>
          <p className="muted-copy">Review previous executions and test failure safety handling.</p>
        </div>
        <StatusBadge status={currentRun.status} />
      </div>

      <div className="execution-run-selector">
        <label htmlFor="run-select" className="sr-only">Select Execution Run</label>
        <div className="run-toggle-buttons">
          {executions.map((run) => (
            <button
              key={run.id}
              type="button"
              id={`run-btn-${run.id}`}
              className={`btn btn-compact ${run.id === currentRun.id ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSelectedRunId(run.id)}
            >
              {run.leadName} ({run.status})
            </button>
          ))}
        </div>
      </div>

      <div className="execution-summary-bar">
        <div className="summary-item">
          <span className="meta-label">Trigger Lead</span>
          <span className="meta-value">{currentRun.leadName} ({currentRun.leadCompany})</span>
        </div>
        <div className="summary-item">
          <span className="meta-label">Executed</span>
          <span className="meta-value">{currentRun.timestamp}</span>
        </div>
        <div className="summary-item">
          <span className="meta-label">Result</span>
          <span className="meta-value">
            <StatusBadge status={currentRun.status} />
          </span>
        </div>
      </div>

      {isFailed ? (
        <Alert tone="error">
          <p>
            <strong>Analysis Failure Handled:</strong> {currentRun.failureReason}
          </p>
          <p className="muted-copy" style={{ marginTop: '0.4rem' }}>
            Notice that the lead remains safely saved, no inaccurate follow-up task was generated, and the failure was logged for human attention.
          </p>
        </Alert>
      ) : (
        <Alert tone="info">
          <p>
            <strong>Success Path:</strong> All 5 workflow steps completed sequentially. Reviewable AI analysis and next actions were attached to the CRM lead.
          </p>
        </Alert>
      )}

      <div className="execution-steps-container">
        <h3>Execution Steps</h3>
        <ol className="execution-steps-list">
          {currentRun.stepResults.map((step, idx) => {
            const stepStatus = step.status
            const statusClass =
              stepStatus === 'Completed'
                ? 'step-completed'
                : stepStatus === 'Failed'
                  ? 'step-failed'
                  : 'step-skipped'

            return (
              <li key={step.name} className={`execution-step-item ${statusClass}`}>
                <div className="step-marker-col">
                  <span className="step-number">{idx + 1}</span>
                  {idx < currentRun.stepResults.length - 1 ? <span className="step-line" /> : null}
                </div>
                <div className="step-content-col">
                  <div className="step-title-row">
                    <span className="step-name">{step.name}</span>
                    <span className={`badge badge-${stepStatus === 'Completed' ? 'success' : stepStatus === 'Failed' ? 'error' : 'neutral'}`}>
                      {stepStatus}
                    </span>
                  </div>
                  <p className="step-detail-text">{step.detail}</p>
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </Card>
  )
}

export default WorkflowExecutionViewer
