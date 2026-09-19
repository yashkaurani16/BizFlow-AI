import AccountInfoSection from '../components/AccountInfoSection.jsx'
import AISafetySettingsSection from '../components/AISafetySettingsSection.jsx'
import PreferenceToggle from '../components/PreferenceToggle.jsx'
import ProfileForm from '../components/ProfileForm.jsx'
import SectionCard from '../components/SectionCard.jsx'
import SecurityInfoSection from '../components/SecurityInfoSection.jsx'
import WorkspaceSettingsSection from '../components/WorkspaceSettingsSection.jsx'
import { useSettings } from '../context/SettingsContext.jsx'
import { useToast } from '../context/ToastContext.jsx'

function SettingsPage() {
  const {
    profile,
    updateProfile,
    preferences,
    togglePreference,
    accountInfo,
    workspaceInfo,
    aiSafetySettings,
    securityInfo,
  } = useSettings()

  const { showToast } = useToast()

  function handleSaveProfile(values) {
    updateProfile(values)
    showToast('Profile information updated successfully.', 'success')
  }

  function handleTogglePreference(key, label) {
    const nextState = !preferences[key]
    togglePreference(key)
    showToast(`${label} ${nextState ? 'enabled' : 'disabled'}.`, 'info')
  }

  return (
    <div className="settings-page">
      <div className="page-heading">
        <div>
          <h1>Profile & Settings</h1>
          <p>Manage your profile information and workspace preferences.</p>
        </div>
      </div>

      <div className="settings-grid">
        <div className="settings-column">
          <ProfileForm profile={profile} onSave={handleSaveProfile} />

          <SectionCard
            title="Notification & Workspace Preferences"
            subtitle="Configure automated alerts for team activity and agent events."
          >
            <div className="preferences-list">
              <PreferenceToggle
                id="pref-email-notifications"
                label="Email Notifications"
                description="Receive email alerts when high-priority leads arrive or need immediate attention."
                checked={preferences.emailNotifications}
                onChange={() =>
                  handleTogglePreference('emailNotifications', 'Email notifications')
                }
              />
              <PreferenceToggle
                id="pref-workflow-notifications"
                label="Workflow Notifications"
                description="Receive notifications whenever an automated trigger executes, succeeds, or halts."
                checked={preferences.workflowNotifications}
                onChange={() =>
                  handleTogglePreference('workflowNotifications', 'Workflow notifications')
                }
              />
              <PreferenceToggle
                id="pref-ai-activity-notifications"
                label="AI Activity Notifications"
                description="Get notified when AI agents finish draft generation or request human review."
                checked={preferences.aiActivityNotifications}
                onChange={() =>
                  handleTogglePreference('aiActivityNotifications', 'AI activity notifications')
                }
              />
            </div>
          </SectionCard>

          <WorkspaceSettingsSection workspaceInfo={workspaceInfo} />
        </div>

        <div className="settings-column">
          <AccountInfoSection accountInfo={accountInfo} />

          <AISafetySettingsSection aiSafetySettings={aiSafetySettings} />

          <SecurityInfoSection securityInfo={securityInfo} />
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
