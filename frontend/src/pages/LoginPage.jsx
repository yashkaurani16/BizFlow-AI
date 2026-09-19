import { Link } from 'react-router-dom'
import Card from '../components/Card.jsx'

function LoginPage() {
  return (
    <Card className="auth-card">
      <h1>Log in</h1>
      <p>Placeholder login screen. Authentication is not implemented yet.</p>
      <div className="auth-links">
        <Link to="/register">Create an account</Link>
        <Link to="/dashboard">Continue to dashboard (placeholder)</Link>
      </div>
    </Card>
  )
}

export default LoginPage
