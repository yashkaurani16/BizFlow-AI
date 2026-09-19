import { workflowAgents, workflowStatuses, workflowTriggers } from '../data/enums.js'

export function validateWorkflow(values) {
  const errors = {}

  if (!values.name || !values.name.trim()) {
    errors.name = 'Workflow name is required.'
  }

  if (!values.description || !values.description.trim()) {
    errors.description = 'Description is required.'
  }

  if (!values.trigger || !values.trigger.trim()) {
    errors.trigger = 'Trigger is required.'
  } else if (!workflowTriggers.includes(values.trigger)) {
    errors.trigger = 'Please select a valid trigger.'
  }

  if (!values.agent || !values.agent.trim()) {
    errors.agent = 'Assigned agent is required.'
  } else if (!workflowAgents.includes(values.agent)) {
    errors.agent = 'Please select a valid assigned agent.'
  }

  if (!values.status || !values.status.trim()) {
    errors.status = 'Status is required.'
  } else if (!workflowStatuses.includes(values.status)) {
    errors.status = 'Please select a valid status.'
  }

  return errors
}

export function hasWorkflowErrors(errors) {
  return Object.keys(errors).length > 0
}
