import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { VenuesProvider } from './context/VenuesContext'
import { ReportsProvider } from './context/ReportsContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <VenuesProvider>
      <ReportsProvider>
        <App />
      </ReportsProvider>
    </VenuesProvider>
  </StrictMode>,
)