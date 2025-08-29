import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AppProvider } from './contexts/AppContext.jsx'

import './i18n'

createRoot(document.getElementById('root')).render(
  <AppProvider>
    <App />
  </AppProvider>
)
