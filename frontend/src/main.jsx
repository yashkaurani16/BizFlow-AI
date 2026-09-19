import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './styles/index.css'
import './styles/dashboard.css'
import './styles/leads.css'
import './styles/agents.css'
import './styles/workflows.css'
import './styles/analytics.css'
import './styles/settings.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
