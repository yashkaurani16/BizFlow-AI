import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Alert from '../components/Alert.jsx'
import Button from '../components/Button.jsx'
import Card from '../components/Card.jsx'
import Input from '../components/Input.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'

function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { showToast } = useToast()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('Please enter both email and password.')
      return
    }

    try {
      setLoading(true)
      await login(email.trim(), password)
      showToast('Logged in successfully.', 'success')
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="auth-card">
      <h1>Log in to BizFlow AI</h1>
      <p>Enter your credentials to access your centralized business workspace.</p>

      {error ? <Alert tone="error">{error}</Alert> : null}

      <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
        <Input
          id="login-email"
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (error) setError('')
          }}
          required
          autoFocus
          placeholder="you@company.com"
        />

        <Input
          id="login-password"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value)
            if (error) setError('')
          }}
          required
          placeholder="••••••••"
        />

        <Button type="submit" disabled={loading} style={{ width: '100%', marginTop: 'var(--space-2)' }}>
          {loading ? 'Logging in...' : 'Log in'}
        </Button>
      </form>

      <div className="auth-links" style={{ marginTop: 'var(--space-4)', textAlign: 'center' }}>
        <span>Don't have an account? </span>
        <Link to="/register">Create an account</Link>
      </div>
    </Card>
  )
}

export default LoginPage
