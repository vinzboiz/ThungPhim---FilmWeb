import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/theme.css'
import App from './App.jsx'

const apiBase = (import.meta.env.VITE_API_BASE || 'http://localhost:5000').replace(/\/$/, '')
try {
  const apiOrigin = new URL(apiBase).origin
  if (apiOrigin !== window.location.origin) {
    const pre = document.createElement('link')
    pre.rel = 'preconnect'
    pre.href = apiOrigin
    document.head.appendChild(pre)
  }
} catch {
  /* ignore */
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
