import { leadStatuses } from '../data/enums.js'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phonePattern = /^\+?[\d\s().-]{7,20}$/

export function validateLead(values) {
  const errors = {}
  const name = values.name?.trim() || ''
  const email = values.email?.trim() || ''
  const phone = values.phone?.trim() || ''
  const status = values.status || ''

  if (!name) {
    errors.name = 'Name is required.'
  }

  if (!status) {
    errors.status = 'Status is required.'
  } else if (!leadStatuses.includes(status)) {
    errors.status = 'Choose a valid lead status.'
  }

  if (!email && !phone) {
    errors.contact = 'Provide an email or a phone number so you can follow up.'
  }

  if (email && !emailPattern.test(email)) {
    errors.email = 'Enter a valid email address.'
  }

  if (phone && !phonePattern.test(phone)) {
    errors.phone = 'Enter a valid phone number.'
  }

  return errors
}

export function hasLeadErrors(errors) {
  return Object.keys(errors).length > 0
}
