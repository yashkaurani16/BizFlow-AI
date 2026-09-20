import React from 'react'

function WorkflowValidationBanner({ errors = [], isValid = true, isChecking = false }) {
  if (isChecking) {
    return (
      <div className="wf-validation-banner wf-validation-banner--checking" role="status">
        <span className="wf-validation-spinner" aria-hidden="true" />
        <span>Validating workflow structure...</span>
      </div>
    )
  }

  if (errors.length > 0) {
    return (
      <div
        className="wf-validation-banner wf-validation-banner--error"
        role="alert"
        aria-live="polite"
      >
        <div className="wf-validation-icon-col">
          <span className="wf-validation-icon" aria-hidden="true">
            ⚠️
          </span>
        </div>
        <div className="wf-validation-content">
          <h4 className="wf-validation-title">
            Workflow Structure Issues ({errors.length})
          </h4>
          <ul className="wf-validation-list">
            {errors.map((err, idx) => (
              <li key={idx} className="wf-validation-item">
                {err}
              </li>
            ))}
          </ul>
          <span className="wf-validation-hint">
            Resolve these connections before saving or activating the workflow.
          </span>
        </div>
      </div>
    )
  }

  if (isValid) {
    return (
      <div className="wf-validation-banner wf-validation-banner--success" role="status">
        <div className="wf-validation-icon-col">
          <span className="wf-validation-icon" aria-hidden="true">
            ✅
          </span>
        </div>
        <div className="wf-validation-content">
          <h4 className="wf-validation-title">Graph Validated</h4>
          <p className="wf-validation-success-text">
            All steps are properly connected from the starting Trigger node. External communication steps
            strictly require human review.
          </p>
        </div>
      </div>
    )
  }

  return null
}

export default WorkflowValidationBanner
