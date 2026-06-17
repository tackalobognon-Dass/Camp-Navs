import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'

// ── Service Worker : mise à jour automatique et immédiate ──────────
// Dès qu'une nouvelle version est détectée, on l'active puis on
// recharge la page pour que TOUS les utilisateurs voient la dernière
// version, sans jamais rester bloqués sur un ancien cache.
const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // Une nouvelle version est prête : on l'applique tout de suite
    updateSW(true)
  },
  onOfflineReady() {
    console.log('App prête à fonctionner hors-ligne.')
  },
})

// Recharge automatiquement la page une fois que le nouveau
// service worker a pris le contrôle (sinon certains navigateurs
// restent sur l'ancienne version jusqu'à la prochaine ouverture).
let refreshing = false
navigator.serviceWorker?.addEventListener('controllerchange', () => {
  if (refreshing) return
  refreshing = true
  window.location.reload()
})

// Vérifie régulièrement s'il existe une nouvelle version
// (utile pour les utilisateurs qui laissent l'app ouverte longtemps)
setInterval(() => {
  navigator.serviceWorker?.getRegistration().then(reg => reg?.update())
}, 60 * 60 * 1000) // toutes les heures

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
