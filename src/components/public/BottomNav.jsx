import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  {
    label: 'Accueil', path: '/',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" /></svg>
  },
  {
    label: 'Planning', path: '/programme',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
  },
  {
    label: 'Chants', path: '/chants',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
  },
  {
    label: "S'inscrire", path: '/inscription',
    icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
  },
]

const PLUS_ITEMS = [
  {
    label: 'Documents', path: '/documents', bg: '#FAECE7', color: '#993C1D',
    icon: <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
  },
  {
    label: 'Témoignages', path: '/temoignages', bg: '#E1F5EE', color: '#085041',
    icon: <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
  },
  {
    label: 'Contact', path: '/contact', bg: '#EEEDFE', color: '#534AB7',
    icon: <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
  },
  {
    label: 'Lieu', path: '/lieu', bg: '#E6F1FB', color: '#185FA5',
    icon: <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
  },
  {
    label: 'Mon inscription', path: '/suivi', bg: '#FAEEDA', color: '#854F0B',
    icon: <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
  },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const [plusOpen, setPlusOpen] = useState(false)

  function goTo(path) {
    setPlusOpen(false)
    navigate(path, { replace: true })
  }

  return (
    <>
      {/* Overlay menu Plus */}
      {plusOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setPlusOpen(false)} />
          <div
            style={{ position: 'fixed', bottom: 56, left: 0, right: 0, maxWidth: 480, margin: '0 auto', background: '#fff', borderRadius: '20px 20px 0 0', borderTop: '0.5px solid #e5e5e0', padding: '12px 16px 16px', boxShadow: '0 -4px 24px rgba(0,0,0,0.08)', zIndex: 50 }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 32, height: 3, background: '#e0e0e0', borderRadius: 2, margin: '0 auto 12px' }} />
            <div style={{ fontSize: 9, fontWeight: 500, color: '#888', letterSpacing: '0.06em', marginBottom: 12 }}>PLUS DE SECTIONS</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
              {PLUS_ITEMS.map(item => (
                <div key={item.label} onClick={() => goTo(item.path)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 16, background: item.bg, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.icon}
                  </div>
                  <span style={{ fontSize: 10, color: '#666', textAlign: 'center' }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Barre de navigation */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: 480, margin: '0 auto', background: '#fff', borderTop: '0.5px solid #e5e5e0', display: 'flex', zIndex: 30 }}>
        {NAV_ITEMS.map(item => {
          const active = location.pathname === item.path
          return (
            <button key={item.label} type="button"
              onClick={() => goTo(item.path)}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0 10px', color: active ? '#054035' : '#888780', background: 'none', border: 'none', cursor: 'pointer' }}>
              {item.icon}
              <span style={{ fontSize: 10, marginTop: 2, fontWeight: active ? 500 : 400 }}>{item.label}</span>
            </button>
          )
        })}
        <button type="button"
          onClick={e => { e.stopPropagation(); setPlusOpen(!plusOpen) }}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0 10px', color: plusOpen ? '#054035' : '#888780', background: 'none', border: 'none', cursor: 'pointer' }}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
          </svg>
          <span style={{ fontSize: 10, marginTop: 2 }}>Plus</span>
        </button>
      </nav>
    </>
  )
}
