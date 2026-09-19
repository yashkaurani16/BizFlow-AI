import { AgentsProvider } from './context/AgentsContext.jsx'
import { LeadsProvider } from './context/LeadsContext.jsx'
import { SettingsProvider } from './context/SettingsContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { WorkflowsProvider } from './context/WorkflowsContext.jsx'
import AppRoutes from './routes/AppRoutes.jsx'

function App() {
  return (
    <ToastProvider>
      <LeadsProvider>
        <AgentsProvider>
          <WorkflowsProvider>
            <SettingsProvider>
              <AppRoutes />
            </SettingsProvider>
          </WorkflowsProvider>
        </AgentsProvider>
      </LeadsProvider>
    </ToastProvider>
  )
}

export default App
