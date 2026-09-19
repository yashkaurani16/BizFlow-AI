const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,15}$/

export function validateProfile(values) {
  const errors = {}

  if (!values.name || !values.name.trim()) {
    errors.name = 'Full name is required.'
  }

  if (!values.email || !values.email.trim()) {
    errors.email = 'Email address is required.'
  } else if (!EMAIL_REGEX.test(values.email.trim())) {
    errors.email = 'Please enter a valid email address.'
  }

  if (values.phone && values.phone.trim()) {
    const cleaned = values.phone.trim()
    if (cleaned.length < 7 || !PHONE_REGEX.test(cleaned)) {
      errors.phone = 'Please enter a valid phone number.'
    }
  }

  return errors
}

export function hasProfileErrors(errors) {
  return Object.keys(errors).length > 0
}
