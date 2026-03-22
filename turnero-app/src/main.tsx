import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Storage persistence: evitar que el navegador borre IndexedDB
async function requestPersistence() {
  if (navigator.storage && navigator.storage.persist) {
    const granted = await navigator.storage.persist()
    if (!granted) {
      console.warn('Storage persistence no concedida — se recomienda hacer backup regular')
    }
  }
}

requestPersistence()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
