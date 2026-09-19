import Alert from './Alert.jsx'
import SectionCard from './SectionCard.jsx'
import StatusBadge from './StatusBadge.jsx'

function WorkspaceSettingsSection({ workspaceInfo }) {
  return (
    <SectionCard title="Workspace Settings">
      <dl className="detail-list workspace-detail-list">
        <div>
          <dt>Workspace Name</dt>
          <dd className="profile-value">{workspaceInfo.workspaceName}</dd>
        </div>
        <div>
          <dt>Workspace Type</dt>
          <dd>
            <span className="badge badge-neutral">{workspaceInfo.workspaceType}</span>
          </dd>
        </div>
        <div>
          <dt>Workspace Status</dt>
          <dd>
            <StatusBadge status={workspaceInfo.workspaceStatus} />
          </dd>
        </div>
        <div>
          <dt>Plan Tier</dt>
          <dd>
            <span className="badge badge-info">{workspaceInfo.planTier}</span>
          </dd>
        </div>
      </dl>

      <div style={{ marginTop: '1rem' }}>
        <Alert tone="info">
          <p>{workspaceInfo.notice}</p>
        </Alert>
      </div>
    </SectionCard>
  )
}

export default WorkspaceSettingsSection
