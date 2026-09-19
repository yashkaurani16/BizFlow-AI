import Alert from './Alert.jsx'
import SectionCard from './SectionCard.jsx'
import StatusBadge from './StatusBadge.jsx'

function AccountInfoSection({ accountInfo }) {
  return (
    <SectionCard title="Account Information">
      <dl className="detail-list account-detail-list">
        <div>
          <dt>Account Status</dt>
          <dd>
            <StatusBadge status={accountInfo.status} />
          </dd>
        </div>
        <div>
          <dt>Account Type</dt>
          <dd>
            <span className="badge badge-neutral">{accountInfo.type}</span>
          </dd>
        </div>
        <div>
          <dt>Authentication Mode</dt>
          <dd>
            <span className="badge badge-info">{accountInfo.auth}</span>
          </dd>
        </div>
        <div>
          <dt>Member Since</dt>
          <dd>{accountInfo.createdDate}</dd>
        </div>
      </dl>

      <div style={{ marginTop: '1rem' }}>
        <Alert tone="info">
          <p>{accountInfo.notice}</p>
        </Alert>
      </div>
    </SectionCard>
  )
}

export default AccountInfoSection
