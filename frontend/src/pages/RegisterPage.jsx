import { Link } from 'react-router-dom'
import Card from '../components/Card.jsx'

function RegisterPage() {
  return (
    <Card className="auth-card">
      <h1>Create account</h1>
      <p>Placeholder registration screen. Authentication is not implemented yet.</p>
      <Link to="/login">Already have an account? Log in</Link>
    </Card>
  )
}

export default RegisterPage
