import { useEffect, useState } from 'react'

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Ne pas afficher si déjà installé
    if (window.matchMedia('(display-mode: standalone)').matches) return
    // Ne pas afficher si déjà fermé
    if (localStorage.getItem('installBannerDismissed')) return

    // Détecter iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    setIsIOS(ios)

    if (ios) {
      // Sur iOS, afficher après 3 secondes
      setTimeout(() => setShowBanner(true), 3000)
    } else {
      // Sur Android/Chrome, attendre l'événement beforeinstallprompt
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault()
        setDeferredPrompt(e)
        setTimeout(() => setShowBanner(true), 3000)
      })
    }
  }, [])

  function handleInstall() {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      deferredPrompt.userChoice.then(() => {
        setDeferredPrompt(null)
        setShowBanner(false)
      })
    }
  }

  function handleDismiss() {
    setShowBanner(false)
    setDismissed(true)
    localStorage.setItem('installBannerDismissed', 'true')
  }

  if (!showBanner || dismissed) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 70,
      left: 0,
      right: 0,
      maxWidth: 480,
      margin: '0 auto',
      zIndex: 100,
      padding: '0 12px',
    }}>
      <div style={{
        background: '#054035',
        borderRadius: 16,
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
      }}>
        {/* Icône */}
        <div style={{ width: 40, height: 40, background: '#fff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <img src="/icons/icon-192.png" alt="Navs" style={{ width: 32, height: 32, borderRadius: 7 }} />
        </div>

        {/* Texte */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 12, fontWeight: 500, color: '#fff', margin: 0 }}>
            Installer l'app
          </p>
          {isIOS ? (
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', margin: 0, marginTop: 2 }}>
              Appuyez sur <strong style={{ color: '#C9A84C' }}>Partager</strong> puis <strong style={{ color: '#C9A84C' }}>Sur l'écran d'accueil</strong>
            </p>
          ) : (
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', margin: 0, marginTop: 2 }}>
              Accédez rapidement depuis votre téléphone
            </p>
          )}
        </div>

        {/* Boutons */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {!isIOS && (
            <button onClick={handleInstall}
              style={{ background: '#C9A84C', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 500, cursor: 'pointer' }}>
              Installer
            </button>
          )}
          <button onClick={handleDismiss}
            style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 10px', fontSize: 11, cursor: 'pointer' }}>
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}
