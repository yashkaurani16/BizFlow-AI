import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Alert from '../components/Alert.jsx'
import Button from '../components/Button.jsx'
import Card from '../components/Card.jsx'
import Input from '../components/Input.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'

function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const { showToast } = useToast()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    company: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (error) setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const { name, email, password, confirmPassword, company } = formData

    if (!name.trim()) {
      setError('Full name is required.')
      return
    }

    if (!email.trim()) {
      setError('Email address is required.')
      return
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    try {
      setLoading(true)
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        company: company.trim(),
      })
      showToast('Account created successfully!', 'success')
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Unable to register account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="auth-card">
      <h1>Create your account</h1>
      <p>Set up your single-workspace BizFlow AI platform to automate leads and workflows.</p>

      {error ? <Alert tone="error">{error}</Alert> : null}

      <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
        <Input
          id="reg-name"
          name="name"
          label="Full Name"
          value={formData.name}
          onChange={handleChange}
          required
          autoFocus
          placeholder="Alex Johnson"
        />

        <Input
          id="reg-email"
          name="email"
          label="Email Address"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
          placeholder="alex@company.com"
        />

        <Input
          id="reg-company"
          name="company"
          label="Company / Business Name (Optional)"
          value={formData.company}
          onChange={handleChange}
          placeholder="Johnson Digital"
        />

        <Input
          id="reg-password"
          name="password"
          label="Password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          required
          hint="Must be at least 6 characters"
          placeholder="••••••••"
        />

        <Input
          id="reg-confirm-password"
          name="confirmPassword"
          label="Confirm Password"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
          placeholder="••••••••"
        />

        <Button type="submit" disabled={loading} style={{ width: '100%', marginTop: 'var(--space-2)' }}>
          {loading ? 'Creating account...' : 'Create account'}
        </Button>
      </form>

      <div className="auth-links" style={{ marginTop: 'var(--space-4)', textAlign: 'center' }}>
        <span>Already have an account? </span>
        <Link to="/login">Log in</Link>
      </div>
    </Card>
  )
}

export default RegisterPage
