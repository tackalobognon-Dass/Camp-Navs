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

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginTop: 16 }}>
      {[
        { v: time.j, l: 'JOURS' },
        { v: time.h, l: 'HEURES' },
        { v: time.m, l: 'MIN' },
        { v: time.s, l: 'SEC', pulse: true },
      ].map(({ v, l, pulse }) => (
        <div key={l} style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 10, padding: '9px 4px', textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 500, color: '#fff', lineHeight: 1, letterSpacing: '-0.5px', animation: pulse ? 'cdpulse 1s infinite' : 'none' }}>{v}</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', marginTop: 4, letterSpacing: '0.05em' }}>{l}</div>
        </div>
      ))}
      <style>{`@keyframes cdpulse{0%,100%{opacity:1}50%{opacity:.45}}`}</style>
    </div>
  )
}

function NewsCard({ annonce }) {
  const [expanded, setExpanded] = useState(false)
  const isLong = annonce.contenu && annonce.contenu.length > 100

  const tagConfig = {
    Nouveau:  { bg: '#E1F5EE', color: '#054035' },
    Important:{ bg: '#FCEBEB', color: '#A32D2D' },
    Document: { bg: '#EEEDFE', color: '#534AB7' },
    Info:     { bg: '#FAEEDA', color: '#854F0B' },
  }
  const tc = tagConfig[annonce.tag] || tagConfig['Info']

  return (
    <div style={{ flexShrink: 0, width: '88vw', maxWidth: 320, background: '#fff', borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, fontWeight: 500, padding: '3px 8px', borderRadius: 20, background: tc.bg, color: tc.color }}>
          {annonce.tag}
        </span>
        <span style={{ fontSize: 11, color: '#999' }}>
          {new Date(annonce.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
        </span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a', lineHeight: 1.4 }}>{annonce.titre}</div>
      {annonce.contenu && (
        <div style={{ fontSize: 12, color: '#666', lineHeight: 1.6, overflow: expanded ? 'visible' : 'hidden', display: expanded ? 'block' : '-webkit-box', WebkitLineClamp: expanded ? 'unset' : 3, WebkitBoxOrient: 'vertical' }}>
          {annonce.contenu}
        </div>
      )}
      {isLong && (
        <button onClick={() => setExpanded(!expanded)}
          style={{ fontSize: 11, color: '#999', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}>
          {expanded ? 'Réduire' : 'Lire la suite →'}
        </button>
      )}
    </div>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const [annonces, setAnnonces] = useState([])
  const [places, setPlaces] = useState({ jeunes: 0, enfants: 0 })
  const [plusOpen, setPlusOpen] = useState(false)

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
    {
      label: 'Documents', path: '/documents', bg: '#FAECE7', color: '#993C1D',
      icon: <svg style={{ width: 22, height: 22 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
    },
    {
      label: 'Témoignages', path: '/temoignages', bg: '#E1F5EE', color: '#085041',
      icon: <svg style={{ width: 22, height: 22 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
    },
    {
      label: 'Contact', path: '/contact', bg: '#EEEDFE', color: '#534AB7',
      icon: <svg style={{ width: 22, height: 22 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
    },
    {
      label: 'Lieu', path: '/lieu', bg: '#E6F1FB', color: '#185FA5',
      icon: <svg style={{ width: 22, height: 22 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
    },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#F4F3EF', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column' }}>

      {/* HERO */}
      <div style={{ background: '#054035', padding: '36px 16px 16px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', top: -60, right: -50 }} />

        <div style={{ fontSize: 23, fontWeight: 500, color: '#fff', marginBottom: 5, letterSpacing: '-0.3px' }}>Camp-Navs 2026</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, fontWeight: 400, marginBottom: 4, paddingLeft: 10, borderLeft: '2px solid rgba(201,168,76,0.5)' }}>
          Les familles et réseaux relationnels pour une expansion naturelle de l'Évangile et du Royaume de Dieu
        </div>

        <Countdown />
      </div>

      {/* PLACES */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '10px 14px 0' }}>
        {[
          { label: 'Jeunes & Adultes', val: places.jeunes, max: 100, prix: '30 000 FCFA' },
          { label: 'Enfants & Ados', val: places.enfants, max: 50, prix: '25 000 FCFA' },
        ].map(({ label, val, max, prix }) => (
          <div key={label} style={{ background: '#fff', borderRadius: 14, padding: '12px 14px' }}>
            <div style={{ fontSize: 10, color: '#888', marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 18, fontWeight: 500, color: '#1a1a1a', marginBottom: 6 }}>
              {val}<span style={{ fontSize: 12, color: '#aaa', fontWeight: 400 }}> / {max}</span>
            </div>
            <div style={{ background: '#E8E7E2', borderRadius: 2, height: 2, marginBottom: 8 }}>
              <div style={{ background: '#054035', height: 2, borderRadius: 2, width: `${Math.min((val / max) * 100, 100)}%` }} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 500, background: '#E1F5EE', color: '#054035', padding: '3px 8px', borderRadius: 20 }}>{prix}</span>
          </div>
        ))}
      </div>

      {/* ACTIONS */}
      <div style={{ padding: '10px 14px 0' }}>
        <div style={{ fontSize: 10, fontWeight: 500, color: '#888', letterSpacing: '0.06em', marginBottom: 10 }}>ACTIONS RAPIDES</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            {
              path: '/inscription',
              iconBg: '#E1F5EE', iconColor: '#054035',
              icon: <svg style={{ width: 20, height: 20 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
              title: "S'inscrire", sub: 'Réservez votre place',
            },
            {
              path: '/suivi',
              iconBg: '#FAEEDA', iconColor: '#854F0B',
              icon: <svg style={{ width: 20, height: 20 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
              title: 'Mon inscription', sub: 'Voir mon statut',
            },
          ].map(item => (
            <div key={item.path} onClick={() => navigate(item.path)}
              style={{ background: '#fff', borderRadius: 16, padding: 14, cursor: 'pointer', position: 'relative', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 110 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: item.iconBg, color: item.iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {item.icon}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#1a1a1a' }}>{item.title}</div>
                <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>{item.sub}</div>
              </div>
              <span style={{ position: 'absolute', bottom: 14, right: 14, fontSize: 14, color: '#bbb' }}>→</span>
            </div>
          ))}
        </div>
      </div>

      {/* ACTUALITES */}
      <div style={{ padding: '10px 14px 90px' }}>
        <div style={{ fontSize: 10, fontWeight: 500, color: '#888', letterSpacing: '0.06em', marginBottom: 10 }}>ACTUALITÉS</div>
        {annonces.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 16, padding: 20, textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: '#999' }}>Aucune actualité pour le moment.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none', paddingRight: 40 }}>
            {annonces.map(a => <NewsCard key={a.id} annonce={a} />)}
          </div>
        )}
      </div>

      {/* MENU PLUS */}
      {plusOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setPlusOpen(false)} />
          <div style={{ position: 'fixed', bottom: 56, left: 0, right: 0, maxWidth: 480, margin: '0 auto', background: '#fff', borderRadius: '20px 20px 0 0', borderTop: '0.5px solid #e5e5e0', padding: '12px 16px 16px', boxShadow: '0 -4px 24px rgba(0,0,0,0.08)', zIndex: 50 }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 32, height: 3, background: '#e0e0e0', borderRadius: 2, margin: '0 auto 12px' }} />
            <div style={{ fontSize: 9, fontWeight: 500, color: '#888', letterSpacing: '0.06em', marginBottom: 12 }}>PLUS DE SECTIONS</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
              {plusItems.map(item => (
                <div key={item.label} onClick={() => { navigate(item.path); setPlusOpen(false) }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 16, background: item.bg, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.icon}
                  </div>
                  <span style={{ fontSize: 10, color: '#666' }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* BOTTOM NAV — inchangé */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: 480, margin: '0 auto', background: '#fff', borderTop: '0.5px solid #e5e5e0', display: 'flex', zIndex: 30 }}>
        {[
          { label: 'Accueil', path: '/', active: true, icon: <svg style={{ width: 20, height: 20 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" /></svg> },
          { label: 'Planning', path: '/programme', icon: <svg style={{ width: 20, height: 20 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
          { label: 'Chants', path: '/chants', icon: <svg style={{ width: 20, height: 20 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg> },
          { label: "S'inscrire", path: '/inscription', icon: <svg style={{ width: 20, height: 20 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
        ].map(item => (
          <button key={item.label} onClick={() => navigate(item.path)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0 10px', color: item.active ? '#054035' : '#888780', background: 'none', border: 'none', cursor: 'pointer' }}>
            {item.icon}
            <span style={{ fontSize: 10, marginTop: 2, fontWeight: item.active ? 500 : 400 }}>{item.label}</span>
          </button>
        ))}
        <button onClick={(e) => { e.stopPropagation(); setPlusOpen(!plusOpen) }}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0 10px', color: plusOpen ? '#054035' : '#888780', background: 'none', border: 'none', cursor: 'pointer' }}>
          <svg style={{ width: 20, height: 20 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
          <span style={{ fontSize: 10, marginTop: 2 }}>Plus</span>
        </button>
      </nav>
    </div>
  )
}
