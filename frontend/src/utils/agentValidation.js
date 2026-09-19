import { agentTypes } from '../data/enums.js'

export function validateAgent(values) {
  const errors = {}

  if (!values.name || !values.name.trim()) {
    errors.name = 'Agent name is required.'
  }

  if (!values.type || !values.type.trim()) {
    errors.type = 'Agent type is required.'
  } else if (!agentTypes.includes(values.type) && !agentTypes.includes(values.type.replace(' Agent', ''))) {
    errors.type = 'Please select a valid agent type.'
  }

  if (!values.description || !values.description.trim()) {
    errors.description = 'Description is required.'
  }

  if (!values.instructions || !values.instructions.trim()) {
    errors.instructions = 'Instructions are required.'
  }

  return errors
}

export function hasAgentErrors(errors) {
  return Object.keys(errors).length > 0
}
