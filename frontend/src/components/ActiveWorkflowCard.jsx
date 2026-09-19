import StatusBadge from './StatusBadge.jsx'
import WorkflowStep from './WorkflowStep.jsx'

function stepState(index, currentStepIndex, executionStatus) {
  if (executionStatus === 'Succeeded') {
    return 'complete'
  }

  if (executionStatus === 'Failed' && index === currentStepIndex) {
    return 'failed'
  }

  if (index < currentStepIndex) {
    return 'complete'
  }

  if (index === currentStepIndex) {
    return 'current'
  }

  return 'pending'
}

function ActiveWorkflowCard({ workflow }) {
  return (
    <div className="active-workflow">
      <div className="active-workflow-meta">
        <p>
          <span className="meta-label">Status</span>
          <StatusBadge status={workflow.status} />
        </p>
        <p>
          <span className="meta-label">Selected agent</span>
          <span>{workflow.agent}</span>
        </p>
        <p>
          <span className="meta-label">Last execution</span>
          <span>{workflow.lastExecution}</span>
        </p>
        <p>
          <span className="meta-label">Execution status</span>
          <StatusBadge status={workflow.executionStatus} />
        </p>
      </div>
      <ol className="workflow-steps">
        {workflow.steps.map((label, index) => (
          <WorkflowStep
            key={label}
            label={label}
            index={index}
            state={stepState(index, workflow.currentStepIndex, workflow.executionStatus)}
            showConnector={index < workflow.steps.length - 1}
          />
        ))}
      </ol>
    </div>
  )
}

export default ActiveWorkflowCard
