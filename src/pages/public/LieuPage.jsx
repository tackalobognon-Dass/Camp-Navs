import { useNavigate } from 'react-router-dom'
import BottomNav from '../../components/public/BottomNav'

const VERT = '#1B3B2B'
const VERT_CLAIR = '#E8F5E8'

export default function LieuPage() {
  const navigate = useNavigate()

  return (
    <div style={{ height: '100dvh', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#F8FAFC' }}>

      {/* ── HEADER ── */}
      <div style={{ background: VERT, padding: '44px 16px 18px', flexShrink: 0 }}>
        <button onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,0.7)', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 14 }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          Retour
        </button>
        <p style={{ fontSize: 24, fontWeight: 800, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.3px' }}>Lieu du camp</p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', margin: 0 }}>Camp-Navs 2026 · 23 – 29 août</p>
      </div>

      {/* ── CONTENU ── */}
      <div style={{ flex: 1, padding: '14px 14px 0', display: 'flex', flexDirection: 'column', gap: 12, overflow: 'hidden' }}>

        {/* Carte principale La Sablière */}
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', overflow: 'hidden', flexShrink: 0 }}>

          {/* Bloc visuel vert */}
          <div style={{ background: `linear-gradient(145deg, ${VERT}, #2E6F40)`, padding: '22px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Macaron blanc */}
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke={VERT} strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: '0 0 3px' }}>La Sablière</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', margin: 0 }}>Bingerville, Côte d'Ivoire</p>
          </div>

          {/* Tableau des détails */}
          {[
            { label: 'Nom du lieu', valeur: 'La Sablière' },
            { label: 'Ville', valeur: 'Bingerville' },
            { label: 'Pays', valeur: "Côte d'Ivoire" },
            { label: 'Dates', valeur: '23 – 29 août 2026' },
          ].map((row, i, arr) => (
            <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: i < arr.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
              <span style={{ fontSize: 13, color: '#64748B' }}>{row.label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>{row.valeur}</span>
            </div>
          ))}
        </div>

        {/* Bouton Google Maps */}
        <button onClick={() => window.open('https://maps.google.com/?q=La+Sablière+Bingerville', '_blank')}
          style={{ width: '100%', background: VERT, color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexShrink: 0 }}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
          </svg>
          Voir sur Google Maps
        </button>

        {/* Bloc Comment y aller */}
        <div style={{ background: VERT_CLAIR, borderRadius: 16, padding: '16px', flexShrink: 0, marginBottom: 70 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: VERT, margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 7 }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={VERT} strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Comment y aller ?
          </p>
          <p style={{ fontSize: 14, color: '#2D3748', lineHeight: 1.45, margin: 0 }}>
            Depuis Abidjan, prendre la direction de Bingerville. La Sablière est facilement accessible en taxi ou en bus. Des transports groupés seront organisés depuis le centre d'Abidjan le matin du 23 août.
          </p>
        </div>

      </div>

      <BottomNav />
    </div>
  )
}
