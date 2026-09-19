import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout.jsx'
import AuthLayout from '../layouts/AuthLayout.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import LoginPage from '../pages/LoginPage.jsx'
import RegisterPage from '../pages/RegisterPage.jsx'
import DashboardPage from '../pages/DashboardPage.jsx'
import LeadsPage from '../pages/LeadsPage.jsx'
import AddLeadPage from '../pages/AddLeadPage.jsx'
import LeadDetailsPage from '../pages/LeadDetailsPage.jsx'
import EditLeadPage from '../pages/EditLeadPage.jsx'
import AgentsPage from '../pages/AgentsPage.jsx'
import CreateAgentPage from '../pages/CreateAgentPage.jsx'
import EditAgentPage from '../pages/EditAgentPage.jsx'
import AgentDetailsPage from '../pages/AgentDetailsPage.jsx'
import WorkflowsPage from '../pages/WorkflowsPage.jsx'
import CreateWorkflowPage from '../pages/CreateWorkflowPage.jsx'
import EditWorkflowPage from '../pages/EditWorkflowPage.jsx'
import WorkflowDetailsPage from '../pages/WorkflowDetailsPage.jsx'
import AnalyticsPage from '../pages/AnalyticsPage.jsx'
import SettingsPage from '../pages/SettingsPage.jsx'

function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        Loading session...
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <AppLayout />
}

function PublicAuthRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        Loading session...
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <AuthLayout />
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicAuthRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/leads" element={<LeadsPage />} />
        <Route path="/leads/new" element={<AddLeadPage />} />
        <Route path="/leads/:id/edit" element={<EditLeadPage />} />
        <Route path="/leads/:id" element={<LeadDetailsPage />} />
        <Route path="/agents" element={<AgentsPage />} />
        <Route path="/agents/new" element={<CreateAgentPage />} />
        <Route path="/agents/:id/edit" element={<EditAgentPage />} />
        <Route path="/agents/:id" element={<AgentDetailsPage />} />
        <Route path="/workflows" element={<WorkflowsPage />} />
        <Route path="/workflows/new" element={<CreateWorkflowPage />} />
        <Route path="/workflows/:id/edit" element={<EditWorkflowPage />} />
        <Route path="/workflows/:id" element={<WorkflowDetailsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default AppRoutes
