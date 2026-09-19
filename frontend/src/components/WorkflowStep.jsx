function WorkflowStep({ label, index, state, showConnector }) {
  return (
    <li className={`workflow-step is-${state}`}>
      <div className="workflow-step-marker">
        <span className="workflow-step-index" aria-hidden="true">
          {index + 1}
        </span>
        {showConnector ? <span className="workflow-step-connector" aria-hidden="true" /> : null}
      </div>
      <p>
        <span className="sr-only">{`Step ${index + 1}, ${state}. `}</span>
        {label}
      </p>
    </li>
  )
}

export default WorkflowStep
