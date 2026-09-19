import { AgentsProvider } from './context/AgentsContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { LeadsProvider } from './context/LeadsContext.jsx'
import { SettingsProvider } from './context/SettingsContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { WorkflowsProvider } from './context/WorkflowsContext.jsx'
import AppRoutes from './routes/AppRoutes.jsx'

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <LeadsProvider>
          <AgentsProvider>
            <WorkflowsProvider>
              <SettingsProvider>
                <AppRoutes />
              </SettingsProvider>
            </WorkflowsProvider>
          </AgentsProvider>
        </LeadsProvider>
      </AuthProvider>
    </ToastProvider>
  )
}

export default App
