import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

function Countdown() {
  const [time, setTime] = useState({ j: '00', h: '00', m: '00', s: '00' })
  useEffect(() => {
    function tick() {
      const t = new Date('2026-08-23T00:00:00') - new Date()
      if (t <= 0) return
      setTime({
        j: String(Math.floor(t / 86400000)).padStart(2, '0'),
        h: String(Math.floor((t % 86400000) / 3600000)).padStart(2, '0'),
        m: String(Math.floor((t % 3600000) / 60000)).padStart(2, '0'),
        s: String(Math.floor((t % 60000) / 1000)).padStart(2, '0'),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const labels = ['JOURS', 'HEURES', 'MIN', 'SEC']
  const vals = [time.j, time.h, time.m, time.s]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginTop: 14 }}>
      <style>{`@keyframes secpulse{0%,100%{opacity:1}50%{opacity:.5}}`}</style>
      {vals.map((v, i) => (
        <div key={labels[i]} style={{
          background: 'rgba(0,0,0,0.25)',
          borderRadius: 10, padding: '8px 4px', textAlign: 'center',
        }}>
          <div style={{
            fontSize: 20, fontWeight: 600, color: '#fff', lineHeight: 1,
            animation: i === 3 ? 'secpulse 1s ease-in-out infinite' : 'none',
          }}>{v}</div>
          <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.55)', marginTop: 3, letterSpacing: '0.08em' }}>{labels[i]}</div>
        </div>
      ))}
    </div>
  )
}

function NewsCard({ annonce }) {
  const [expanded, setExpanded] = useState(false)
  const tagConfig = {
    Nouveau:   { bg: '#FFF0E6', color: '#C2410C' },
    Important: { bg: '#FFF0E6', color: '#C2410C' },
    Document:  { bg: '#EFF6FF', color: '#1E40AF' },
    Info:      { bg: '#F1F5F9', color: '#475569' },
  }
  const tc = tagConfig[annonce.tag] || tagConfig['Info']
  const date = new Date(annonce.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })

  return (
    <div style={{
      flexShrink: 0,
      width: 'calc(100vw - 44px)',
      maxWidth: 436,
      height: '100%',
      background: '#fff', borderRadius: 16,
      border: '0.5px solid #F1F5F9',
      boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
      padding: '13px 13px 12px',
      display: 'flex', flexDirection: 'column', gap: 5,
      overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: tc.bg, color: tc.color }}>{annonce.tag}</span>
        <span style={{ fontSize: 10, color: '#94A3B8' }}>{date}</span>
      </div>
      <p style={{ fontSize: 12, fontWeight: 600, color: '#0F172A', lineHeight: 1.4, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {annonce.titre}
      </p>
      {annonce.contenu && (
        <p style={{ fontSize: 11, color: '#64748B', lineHeight: 1.55, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {annonce.contenu}
        </p>
      )}
      <button onClick={() => onExpand(annonce)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0 0', fontSize: 11, fontWeight: 600, color: '#054035', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0, marginTop: 'auto' }}>
        Lire la suite →
      </button>
    </div>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const [annonces, setAnnonces] = useState([])
  const [places, setPlaces] = useState({ jeunes: 0, enfants: 0 })
  const [plusOpen, setPlusOpen] = useState(false)
  const [annonceOuverte, setAnnonceOuverte] = useState(null)

  useEffect(() => {
    async function fetchData() {
      const [{ data: ann }, { data: insc }] = await Promise.all([
        supabase.from('annonces').select('*').eq('publie', true).order('created_at', { ascending: false }),
        supabase.from('inscriptions').select('tranche_age'),
      ])
      setAnnonces(ann || [])
      const jeunes = (insc || []).filter(i => i.tranche_age === 'Jeunes & Adultes').length
      const enfants = (insc || []).filter(i => i.tranche_age === 'Enfants & Adolescents').length
      setPlaces({ jeunes, enfants })
    }
    fetchData()
  }, [])

  const plusItems = [
    { label: 'Documents', path: '/documents', bg: '#FAECE7', color: '#993C1D', icon: <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg> },
    { label: 'Témoignages', path: '/temoignages', bg: '#E1F5EE', color: '#085041', icon: <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/></svg> },
    { label: 'Contact', path: '/contact', bg: '#EEEDFE', color: '#534AB7', icon: <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg> },
    { label: 'Lieu', path: '/lieu', bg: '#E6F1FB', color: '#185FA5', icon: <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg> },
  ]

  return (
    <div style={{ height: '100dvh', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#F4F6F9' }}>

      {/* ── 1. HEADER VERT ── */}
      <div style={{ background: '#054035', padding: '44px 16px 16px', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
        {/* Cercle décoratif coin supérieur droit */}
        <div style={{ position: 'absolute', width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', top: -50, right: -40 }} />
        <div style={{ position: 'absolute', width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', top: 20, right: 60 }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: 9, fontWeight: 400, color: 'rgba(255,255,255,0.7)', margin: '0 0 6px', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Mission Évangélique des Navigateurs CI
          </p>
          <p style={{ fontSize: 22, fontWeight: 600, color: '#fff', margin: '0 0 6px', lineHeight: 1.1 }}>Camp-Navs 2026</p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 1.55, margin: 0, fontWeight: 300, maxWidth: '90%' }}>
            Les familles et réseaux relationnels pour une expansion naturelle de l'Évangile et du Royaume de Dieu
          </p>
          <Countdown />
        </div>
      </div>

      {/* ── 2. CARTES INSCRITS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, padding: '12px 14px 0', flexShrink: 0 }}>
        {[
          { label: 'Jeunes & Adultes', val: places.jeunes, max: 100, prix: '30 000 FCFA' },
          { label: 'Enfants & Ados', val: places.enfants, max: 50, prix: '25 000 FCFA' },
        ].map(({ label, val, max, prix }) => {
          const pct = Math.min((val / max) * 100, 100)
          return (
            <div key={label} style={{ background: '#fff', borderRadius: 14, padding: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
              <p style={{ fontSize: 10, color: '#94A3B8', margin: '0 0 4px', fontWeight: 500 }}>{label}</p>
              <p style={{ fontSize: 17, fontWeight: 700, color: '#0F172A', margin: '0 0 6px', lineHeight: 1 }}>
                {val}<span style={{ fontSize: 11, fontWeight: 400, color: '#94A3B8' }}> / {max}</span>
              </p>
              <div style={{ background: '#E8F5E8', borderRadius: 4, height: 4, marginBottom: 8 }}>
                <div style={{ background: '#054035', height: 4, borderRadius: 4, width: `${pct}%`, transition: 'width .5s' }} />
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, color: '#054035', background: '#E8F5E8', padding: '3px 8px', borderRadius: 20 }}>{prix}</span>
            </div>
          )
        })}
      </div>

      {/* ── 3. ACTIONS RAPIDES ── */}
      <div style={{ padding: '12px 14px 0', flexShrink: 0 }}>
        <p style={{ fontSize: 9, fontWeight: 600, color: '#94A3B8', letterSpacing: '0.12em', margin: '0 0 8px', textTransform: 'uppercase' }}>Actions rapides</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            {
              path: '/inscription',
              iconBg: '#E8F5E8', iconColor: '#054035',
              icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>,
              title: "S'inscrire", sub: 'Réservez votre place',
            },
            {
              path: '/suivi',
              iconBg: '#FFF4E6', iconColor: '#C2410C',
              icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>,
              title: 'voir mon inscription', sub: 'Voir mon statut',
            },
          ].map(item => (
            <div key={item.path} onClick={() => navigate(item.path)}
              style={{ background: '#fff', borderRadius: 18, padding: '14px 12px', cursor: 'pointer', position: 'relative', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', minHeight: 100, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: item.iconBg, color: item.iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {item.icon}
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', margin: '0 0 2px' }}>{item.title}</p>
                <p style={{ fontSize: 10, color: '#94A3B8', margin: 0 }}>{item.sub}</p>
              </div>
              <span style={{ position: 'absolute', bottom: 12, right: 12, fontSize: 14, color: '#CBD5E1' }}>→</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4. ACTUALITÉS ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '12px 14px 8px', minHeight: 0, paddingBottom: 64 }}>
        <p style={{ fontSize: 9, fontWeight: 600, color: '#94A3B8', letterSpacing: '0.12em', margin: '0 0 8px', textTransform: 'uppercase', flexShrink: 0 }}>Actualités</p>
        {annonces.length === 0 ? (
          <div style={{ flex: 1, background: '#fff', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>Aucune actualité pour le moment.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', scrollbarWidth: 'none', flex: 1, alignItems: 'stretch', paddingBottom: 2 }}>
            {annonces.map(a => <NewsCard key={a.id} annonce={a} onExpand={setAnnonceOuverte} />)}
          </div>
        )}
      </div>


      {/* ── MODAL ANNONCE ── */}
      {annonceOuverte && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={() => setAnnonceOuverte(null)}>
          <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 480, padding: '20px 18px 32px', maxHeight: '70vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 32, height: 3, background: '#E2E8F0', borderRadius: 2, margin: '0 auto 16px' }} />
            <p style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: '0 0 10px', lineHeight: 1.4 }}>{annonceOuverte.titre}</p>
            <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.7, margin: 0 }}>{annonceOuverte.contenu}</p>
          </div>
        </div>
      )}
      {/* ── MENU PLUS ── */}
      {plusOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setPlusOpen(false)} />
          <div style={{ position: 'fixed', bottom: 56, left: 0, right: 0, maxWidth: 480, margin: '0 auto', background: '#fff', borderRadius: '20px 20px 0 0', borderTop: '0.5px solid #E2E8F0', padding: '12px 16px 16px', boxShadow: '0 -4px 24px rgba(0,0,0,0.08)', zIndex: 50 }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 32, height: 3, background: '#E2E8F0', borderRadius: 2, margin: '0 auto 12px' }} />
            <p style={{ fontSize: 9, fontWeight: 600, color: '#94A3B8', letterSpacing: '0.1em', marginBottom: 12, textTransform: 'uppercase' }}>Plus de sections</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
              {plusItems.map(item => (
                <div key={item.label} onClick={() => { navigate(item.path); setPlusOpen(false) }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 16, background: item.bg, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.icon}</div>
                  <span style={{ fontSize: 10, color: '#64748B', textAlign: 'center' }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── BOTTOM NAV ── */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: 480, margin: '0 auto', background: '#fff', borderTop: '0.5px solid #E2E8F0', display: 'flex', zIndex: 30 }}>
        {[
          { label: 'Accueil', path: '/', active: true, icon: <svg style={{ width: 20, height: 20 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6"/></svg> },
          { label: 'Planning', path: '/programme', icon: <svg style={{ width: 20, height: 20 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg> },
          { label: 'Chants', path: '/chants', icon: <svg style={{ width: 20, height: 20 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/></svg> },
          { label: "S'inscrire", path: '/inscription', icon: <svg style={{ width: 20, height: 20 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg> },
        ].map(item => (
          <button key={item.label} onClick={() => navigate(item.path)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0 10px', color: item.active ? '#054035' : '#94A3B8', background: 'none', border: 'none', cursor: 'pointer' }}>
            {item.icon}
            <span style={{ fontSize: 10, marginTop: 2, fontWeight: item.active ? 700 : 400 }}>{item.label}</span>
          </button>
        ))}
        <button onClick={(e) => { e.stopPropagation(); setPlusOpen(!plusOpen) }}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0 10px', color: plusOpen ? '#054035' : '#94A3B8', background: 'none', border: 'none', cursor: 'pointer' }}>
          <svg style={{ width: 20, height: 20 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"/></svg>
          <span style={{ fontSize: 10, marginTop: 2 }}>Plus</span>
        </button>
      </nav>
    </div>
  )
}
