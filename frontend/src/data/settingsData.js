export const initialProfile = {
  name: 'Yash',
  email: 'yash@bizflow.ai',
  phone: '+91 98765 43210',
  company: 'BizFlow Automation',
}

export const initialPreferences = {
  emailNotifications: true,
  workflowNotifications: true,
  aiActivityNotifications: false,
}

export const accountInfoData = {
  status: 'Active',
  type: 'Business Workspace',
  auth: 'Frontend Demo / Mock',
  createdDate: '18 Sep 2026',
  notice:
    'Real authentication with hashed credentials, JWT session tokens, and server security boundaries will be connected during the backend/authentication stage.',
}

export const aiSafetySettingsData = {
  aiProvider: 'Not connected',
  aiMode: 'Mock / Configuration Only',
  humanReview: 'Required',
  externalActions: 'Not enabled',
  explanation:
    'AI-generated analysis and recommendations are currently for human review. No autonomous external messaging, calls, or actions are enabled in the current MVP.',
}

export const workspaceSettingsData = {
  workspaceName: 'BizFlow AI',
  workspaceType: 'Business Automation',
  workspaceStatus: 'Active',
  planTier: 'MVP v1.0 Starter',
  notice:
    'Single-account usage for v1.0. Multi-user team management, member invitations, and billing portals are out of scope for this version.',
}

export const securitySettingsData = {
  password: 'Protected (Hashed at rest on backend)',
  session: 'Frontend Demo',
  mfaStatus: 'Disabled (MVP v1.0)',
  notice:
    'Passwords and secrets are never stored or handled insecurely in the client. Real password management and auth middleware will be implemented on the Node.js/Express backend.',
}
