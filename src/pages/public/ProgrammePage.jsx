import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import BottomNav from '../../components/public/BottomNav'

const VERT = '#054035'

const JOURS = [
  { label: 'Dim', num: '23', full: 'Dimanche 23 août', key: 'Dimanche' },
  { label: 'Lun', num: '24', full: 'Lundi 24 août', key: 'Lundi' },
  { label: 'Mar', num: '25', full: 'Mardi 25 août', key: 'Mardi' },
  { label: 'Mer', num: '26', full: 'Mercredi 26 août', key: 'Mercredi' },
  { label: 'Jeu', num: '27', full: 'Jeudi 27 août', key: 'Jeudi' },
  { label: 'Ven', num: '28', full: 'Vendredi 28 août', key: 'Vendredi' },
  { label: 'Sam', num: '29', full: 'Samedi 29 août', key: 'Samedi' },
]

// Catégories : taille, dégradé, icône SVG, niveau
const TYPE_CONFIG = {
  'Louange et adoration': {
    size: 'large',
    gradient: 'linear-gradient(135deg,#4C1D95,#2563EB)',
    icon: <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/></svg>,
    dot: '#4C1D95',
  },
  'Message': {
    size: 'large',
    gradient: 'linear-gradient(135deg,#054035,#059669)',
    icon: <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>,
    dot: '#054035',
  },
  'Études bibliques': {
    size: 'large',
    gradient: 'linear-gradient(135deg,#065F46,#0EA5E9)',
    icon: <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>,
    dot: '#065F46',
  },
  'Soirée récréative': {
    size: 'large',
    gradient: 'linear-gradient(135deg,#B45309,#EF4444)',
    icon: <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>,
    dot: '#B45309',
  },
  'Méditation en groupe': {
    size: 'medium',
    gradient: 'linear-gradient(135deg,#1D4ED8,#7C3AED)',
    icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
    dot: '#1D4ED8',
  },
  'Méditation individuelle': {
    size: 'medium',
    gradient: 'linear-gradient(135deg,#0E7490,#6D28D9)',
    icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>,
    dot: '#0E7490',
  },
  "Prière d'ensemble": {
    size: 'medium',
    gradient: 'linear-gradient(135deg,#7C3AED,#DB2777)',
    icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>,
    dot: '#7C3AED',
  },
  'Ateliers': {
    size: 'medium',
    gradient: 'linear-gradient(135deg,#D97706,#EA580C)',
    icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>,
    dot: '#D97706',
  },
  'Repas et repos': {
    size: 'small',
    dot: '#6B7280',
    icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>,
  },
  'Sports et loisirs': {
    size: 'medium',
    gradient: 'linear-gradient(135deg,#166534,#15803D)',
    icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
    dot: '#166534',
  },
  'Toilette et petit déjeuner': { size: 'small', dot: '#9CA3AF', icon: null },
  'Dîner': { size: 'small', dot: '#9CA3AF', icon: null },
  'Jeûne': { size: 'small', dot: '#6B7280', icon: null },
  'Pause': { size: 'small', dot: '#D1D5DB', icon: null },
  'Aller au lit': { size: 'small', dot: '#6B7280', icon: null },
  'Temps libre': { size: 'small', dot: '#9CA3AF', icon: null },
  'Temps en équipe': {
    size: 'medium',
    gradient: 'linear-gradient(135deg,#0369A1,#0891B2)',
    icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
    dot: '#0369A1',
  },
  'Autre': { size: 'small', dot: '#9CA3AF', icon: null },
}

function getConfig(type) {
  return TYPE_CONFIG[type] || TYPE_CONFIG['Autre']
}

function ActivityCard({ item, isLast }) {
  const cfg = getConfig(item.type_activite)
  const heure = item.heure_debut || '--:--'
  const heureFin = item.heure_fin

  if (cfg.size === 'large') {
    return (
      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        {/* Timeline */}
        <div style={{ width: 52, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', textAlign: 'right', width: '100%', marginBottom: 6 }}>{heure}</p>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: cfg.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
            {cfg.icon}
          </div>
          {!isLast && <div style={{ width: 2, flex: 1, background: 'linear-gradient(#E5E7EB,transparent)', marginTop: 4, minHeight: 20 }} />}
        </div>

        {/* Grande carte */}
        <div style={{ flex: 1, background: cfg.gradient, borderRadius: 24, padding: '18px 16px', marginBottom: 4, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', top: -20, right: -20 }} />
          <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: '0 0 5px', lineHeight: 1.3 }}>{item.activite || item.titre}</p>
          {item.type_activite && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', margin: '0 0 6px' }}>{item.type_activite}</p>}
          <div style={{ display: 'flex', gap: 10 }}>
            {heureFin && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', margin: 0 }}>{heure} – {heureFin}</p>}
            {item.lieu && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', margin: 0 }}>· {item.lieu}</p>}
          </div>
          {item.responsable && <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', margin: '5px 0 0' }}>{item.responsable}</p>}
        </div>
      </div>
    )
  }

  if (cfg.size === 'medium') {
    return (
      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        <div style={{ width: 52, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#374151', textAlign: 'right', width: '100%', marginBottom: 6 }}>{heure}</p>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: cfg.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }}>
            {cfg.icon}
          </div>
          {!isLast && <div style={{ width: 1.5, flex: 1, background: '#E5E7EB', marginTop: 4, minHeight: 16 }} />}
        </div>
        <div style={{ flex: 1, background: '#fff', borderRadius: 16, border: '0.5px solid #F3F4F6', padding: '12px 14px', marginBottom: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: '0 0 3px' }}>{item.activite || item.titre}</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {heureFin && <p style={{ fontSize: 10, color: '#9CA3AF', margin: 0 }}>{heure} – {heureFin}</p>}
            {item.lieu && <p style={{ fontSize: 10, color: '#9CA3AF', margin: 0 }}>· {item.lieu}</p>}
          </div>
          {item.responsable && <p style={{ fontSize: 10, color: '#9CA3AF', margin: '3px 0 0' }}>{item.responsable}</p>}
        </div>
      </div>
    )
  }

  // Small — ligne discrète
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 6, alignItems: 'center' }}>
      <div style={{ width: 52, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <p style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'right', width: '100%', margin: 0 }}>{heure}</p>
        {!isLast && <div style={{ width: 1, flex: 1, background: '#F3F4F6', marginTop: 2, minHeight: 14 }} />}
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
        <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>{item.activite || item.titre}</p>
        {heureFin && <p style={{ fontSize: 10, color: '#D1D5DB', margin: 0 }}>– {heureFin}</p>}
      </div>
    </div>
  )
}

export default function ProgrammePage() {
  const navigate = useNavigate()
  const [programme, setProgramme] = useState([])
  const [loading, setLoading] = useState(true)
  const [jourActif, setJourActif] = useState('Dimanche')
  const [animKey, setAnimKey] = useState(0)
  const joursRef = useRef(null)

  useEffect(() => {
    supabase.from('programme_camp').select('*').order('heure_debut', { ascending: true })
      .then(({ data }) => { setProgramme(data || []); setLoading(false) })
  }, [])

  function changerJour(key) {
    setJourActif(key)
    setAnimKey(k => k + 1)
  }

  const activitesDuJour = programme
    .filter(p => p.jour === jourActif)
    .sort((a, b) => (a.heure_debut || '').localeCompare(b.heure_debut || ''))

  const jourInfo = JOURS.find(j => j.key === jourActif)

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', maxWidth: 480, margin: '0 auto' }}>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in-up { animation: fadeInUp 0.35s ease forwards; }
      `}</style>

      {/* Header */}
      <div style={{ background: VERT, padding: '44px 0 0' }}>
        <div style={{ padding: '0 16px 16px' }}>
          <button onClick={() => navigate(-1)}
            style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.6)', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 12 }}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
            Retour
          </button>
          <p style={{ fontSize: 20, fontWeight: 500, color: '#fff', margin: '0 0 2px' }}>Programme du camp</p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: 0 }}>23–29 août 2026 · La Sablière, Bingerville</p>
        </div>

        {/* Sélecteur de jours premium */}
        <div ref={joursRef} style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '10px 16px 16px', scrollbarWidth: 'none' }}>
          {JOURS.map(j => {
            const active = jourActif === j.key
            return (
              <button key={j.key} onClick={() => changerJour(j.key)}
                style={{
                  flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '10px 14px', borderRadius: 16, border: 'none', cursor: 'pointer',
                  background: active ? '#C9A84C' : 'rgba(255,255,255,0.1)',
                  boxShadow: active ? '0 4px 12px rgba(201,168,76,0.4)' : 'none',
                  transition: 'all .25s',
                  minWidth: 52,
                }}>
                <span style={{ fontSize: 9, fontWeight: 500, color: active ? '#412402' : 'rgba(255,255,255,0.5)', letterSpacing: '0.05em', marginBottom: 3 }}>{j.label}</span>
                <span style={{ fontSize: 20, fontWeight: 700, color: active ? '#412402' : '#fff', lineHeight: 1 }}>{j.num}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Titre du jour */}
      <div style={{ padding: '16px 16px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: 0 }}>{jourInfo?.full}</p>
          <p style={{ fontSize: 11, color: '#9CA3AF', margin: '3px 0 0' }}>{activitesDuJour.length} activité(s)</p>
        </div>
      </div>

      {/* Timeline */}
      <div key={animKey} className="fade-in-up" style={{ padding: '12px 14px 80px' }}>
        {loading && <p style={{ textAlign: 'center', fontSize: 13, color: '#9CA3AF', padding: '40px 0' }}>Chargement...</p>}

        {!loading && activitesDuJour.length === 0 && (
          <div style={{ background: '#fff', borderRadius: 16, border: '0.5px solid #F3F4F6', padding: '32px 20px', textAlign: 'center', marginTop: 8 }}>
            <p style={{ fontSize: 24, margin: '0 0 10px' }}>📅</p>
            <p style={{ fontSize: 14, fontWeight: 500, color: '#374151', margin: '0 0 4px' }}>Programme non disponible</p>
            <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>Le programme de ce jour sera publié prochainement.</p>
          </div>
        )}

        {activitesDuJour.map((item, index) => (
          <ActivityCard
            key={item.id}
            item={item}
            isLast={index === activitesDuJour.length - 1}
          />
        ))}
      </div>

      <BottomNav />
    </div>
  )
}
