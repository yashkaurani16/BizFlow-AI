import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Alert from './Alert.jsx'
import Button from './Button.jsx'
import ConfirmDialog from './ConfirmDialog.jsx'
import SectionCard from './SectionCard.jsx'

function SecurityInfoSection({ securityInfo }) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [confirmLogout, setConfirmLogout] = useState(false)

  async function handleLogout() {
    setConfirmLogout(false)
    await logout()
    navigate('/login')
  }

  return (
    <SectionCard
      title="Security & Session"
      actions={
        <Button
          variant="danger"
          className="btn-compact"
          onClick={() => setConfirmLogout(true)}
        >
          Logout
        </Button>
      }
    >
      <dl className="detail-list security-detail-list">
        <div>
          <dt>Password Status</dt>
          <dd>
            <span className="badge badge-success">{securityInfo.password}</span>
          </dd>
        </div>
        <div>
          <dt>Session State</dt>
          <dd>
            <span className="badge badge-info">{securityInfo.session}</span>
          </dd>
        </div>
        <div>
          <dt>Two-Factor Auth</dt>
          <dd>
            <span className="badge badge-neutral">{securityInfo.mfaStatus}</span>
          </dd>
        </div>
      </dl>

      <div style={{ marginTop: '1rem' }}>
        <Alert tone="info">
          <p>{securityInfo.notice}</p>
        </Alert>
      </div>

      <ConfirmDialog
        open={confirmLogout}
        title="Log out of BizFlow AI?"
        message="Your current session will end and you will be returned to the login screen."
        confirmLabel="Logout"
        onConfirm={handleLogout}
        onCancel={() => setConfirmLogout(false)}
      />
    </SectionCard>
  )
}

export default SecurityInfoSection
