import { useState } from 'react'
import { hasProfileErrors, validateProfile } from '../utils/profileValidation.js'
import Alert from './Alert.jsx'
import Button from './Button.jsx'
import Input from './Input.jsx'
import SectionCard from './SectionCard.jsx'

function ProfileForm({ profile, onSave }) {
  const [isEditing, setIsEditing] = useState(false)
  const [values, setValues] = useState({
    name: profile.name || '',
    email: profile.email || '',
    phone: profile.phone || '',
    company: profile.company || '',
  })
  const [errors, setErrors] = useState({})
  const [saveError, setSaveError] = useState('')

  function handleStartEdit() {
    setValues({
      name: profile.name || '',
      email: profile.email || '',
      phone: profile.phone || '',
      company: profile.company || '',
    })
    setErrors({})
    setSaveError('')
    setIsEditing(true)
  }

  function handleCancel() {
    setValues({
      name: profile.name || '',
      email: profile.email || '',
      phone: profile.phone || '',
      company: profile.company || '',
    })
    setErrors({})
    setSaveError('')
    setIsEditing(false)
  }

  function updateField(event) {
    const { name, value } = event.target
    setValues((curr) => ({ ...curr, [name]: value }))
    if (errors[name]) {
      setErrors((curr) => ({ ...curr, [name]: undefined }))
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validateProfile(values)
    setErrors(nextErrors)

    if (hasProfileErrors(nextErrors)) {
      const firstId = nextErrors.name
        ? 'profile-name'
        : nextErrors.email
          ? 'profile-email'
          : nextErrors.phone
            ? 'profile-phone'
            : null
      if (firstId) {
        document.getElementById(firstId)?.focus()
      }
      return
    }

    try {
      onSave(values)
      setIsEditing(false)
    } catch (err) {
      setSaveError(err.message || 'Unable to update profile.')
    }
  }

  return (
    <SectionCard
      title="Profile Information"
      actions={
        !isEditing ? (
          <Button variant="secondary" className="btn-compact" onClick={handleStartEdit}>
            Edit Profile
          </Button>
        ) : null
      }
    >
      {!isEditing ? (
        <dl className="detail-list profile-detail-list">
          <div>
            <dt>Full Name</dt>
            <dd className="profile-value">{profile.name}</dd>
          </div>
          <div>
            <dt>Email Address</dt>
            <dd className="profile-value">{profile.email}</dd>
          </div>
          <div>
            <dt>Phone Number</dt>
            <dd className="profile-value">{profile.phone || '—'}</dd>
          </div>
          <div>
            <dt>Company / Business</dt>
            <dd className="profile-value">{profile.company || '—'}</dd>
          </div>
        </dl>
      ) : (
        <form className="profile-edit-form" onSubmit={handleSubmit} noValidate>
          {saveError ? <Alert tone="error">{saveError}</Alert> : null}

          <div className="form-grid">
            <Input
              id="profile-name"
              name="name"
              label="Full Name"
              value={values.name}
              onChange={updateField}
              error={errors.name}
              required
            />
            <Input
              id="profile-email"
              name="email"
              type="email"
              label="Email Address"
              value={values.email}
              onChange={updateField}
              error={errors.email}
              required
            />
            <Input
              id="profile-phone"
              name="phone"
              type="tel"
              label="Phone Number"
              value={values.phone}
              onChange={updateField}
              error={errors.phone}
              hint="Format: e.g. +91 98765 43210"
            />
            <Input
              id="profile-company"
              name="company"
              label="Company / Business Name"
              value={values.company}
              onChange={updateField}
            />
          </div>

          <div className="form-actions" style={{ marginTop: '1.25rem' }}>
            <Button type="submit">Save Changes</Button>
            <Button type="button" variant="secondary" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </SectionCard>
  )
}

export default ProfileForm
