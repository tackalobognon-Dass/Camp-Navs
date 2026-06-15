import { useEffect, useState } from 'react'

export default function OfflineBanner() {
  const [estHorsLigne, setEstHorsLigne] = useState(!navigator.onLine)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function goOffline() { setEstHorsLigne(true);  setVisible(true) }
    function goOnline()  { setEstHorsLigne(false); setTimeout(() => setVisible(false), 3000) }

    window.addEventListener('offline', goOffline)
    window.addEventListener('online',  goOnline)

    // Afficher immédiatement si hors ligne au chargement
    if (!navigator.onLine) setVisible(true)

    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online',  goOnline)
    }
  }, [])

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9998,
      background: estHorsLigne ? '#1E293B' : '#059669',
      color: '#fff', padding: '8px 16px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      fontSize: 12, fontWeight: 500,
      transition: 'background .4s ease',
      maxWidth: 480, margin: '0 auto',
    }}>
      {estHorsLigne ? (
        <>
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728M15.536 8.464a5 5 0 010 7.072M12 12h.01M3 3l18 18"/>
          </svg>
          Hors ligne — contenu mis en cache affiché
        </>
      ) : (
        <>
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"/>
          </svg>
          Connexion rétablie
        </>
      )}
    </div>
  )
}
