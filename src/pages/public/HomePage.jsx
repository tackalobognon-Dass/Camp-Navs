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
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginTop: 20 }}>
      {[
        { v: time.j, l: 'JOURS' },
        { v: time.h, l: 'HEURES' },
        { v: time.m, l: 'MIN' },
        { v: time.s, l: 'SEC' },
      ].map(({ v, l }) => (
        <div key={l} style={{
          background: 'rgba(0,0,0,0.2)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 14,
          padding: '10px 4px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', lineHeight: 1, letterSpacing: '-0.5px' }}>{v}</div>
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.5)', marginTop: 4, letterSpacing: '0.1em' }}>{l}</div>
        </div>
      ))}
    </div>
  )
}

function NewsCard({ annonce }) {
  const [expanded, setExpanded] = useState(false)
  const isLong = annonce.contenu && annonce.contenu.length > 120

  const tagConfig = {
    Nouveau:   { bg: '#E8F5E8', color: '#054035' },
    Important: { bg: '#FEF3C7', color: '#92400E' },
    Document:  { bg: '#EFF6FF', color: '#1D4ED8' },
    Info:      { bg: '#F3F4F6', color: '#374151' },
  }
  const tc = tagConfig[annonce.tag] || tagConfig['Info']

  return (
    <div style={{
      background: '#fff',
      borderRadius: 20,
      padding: '18px 16px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      marginBottom: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: tc.bg, color: tc.color }}>
          {annonce.tag}
        </span>
        <span style={{ fontSize: 11, color: '#9CA3AF' }}>
          {new Date(annonce.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
        </span>
      </div>
      <p style={{ fontSize: 14, fontWeight: 500, color: '#111827', lineHeight: 1.5, margin: '0 0 6px' }}>{annonce.titre}</p>
      {annonce.contenu && (
        <>
          <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.7, margin: 0 }}>
            {isLong && !expanded ? annonce.contenu.slice(0, 120) + '...' : annonce.contenu}
          </p>
          {isLong && (
            <button onClick={() => setExpanded(!expanded)}
              style={{ fontSize: 12, color: '#054035', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0 0', display: 'block' }}>
              {expanded ? 'Voir moins ↑' : 'Lire la suite →'}
            </button>
          )}
        </>
      )}
    </div>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const [annonces, setAnnonces] = useState([])
  const [places, setPlaces] = useState({ jeunes: 0, enfants: 0 })
  const [plusOpen, setPlusOpen] = useState(false)
  const [recherche, setRecherche] = useState('')

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
      icon: <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
    },
    {
      label: 'Témoignages', path: '/temoignages', bg: '#E1F5EE', color: '#085041',
      icon: <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
    },
    {
      label: 'Contact', path: '/contact', bg: '#EEEDFE', color: '#534AB7',
      icon: <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
    },
    {
      label: 'Lieu', path: '/lieu', bg: '#E6F1FB', color: '#185FA5',
      icon: <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
    },
  ]

  const annoncesFiltrees = annonces.filter(a =>
    a.titre.toLowerCase().includes(recherche.toLowerCase()) ||
    (a.contenu && a.contenu.toLowerCase().includes(recherche.toLowerCase()))
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column' }}>

      {/* ─── HERO DÉGRADÉ ─── */}
      <div style={{
        background: 'linear-gradient(145deg, #1B3B2B 0%, #2E6F40 100%)',
        padding: '52px 20px 80px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Formes géométriques abstraites */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 480 320" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,160 Q120,100 240,140 Q360,180 480,120 L480,0 L0,0 Z" fill="rgba(255,255,255,0.04)"/>
          <path d="M0,220 Q100,180 200,200 Q340,230 480,180 L480,320 L0,320 Z" fill="rgba(255,255,255,0.05)"/>
          <circle cx="380" cy="60" r="80" fill="rgba(255,255,255,0.03)"/>
          <circle cx="30" cy="280" r="60" fill="rgba(255,255,255,0.03)"/>
        </svg>

        {/* Contenu hero */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.15em', fontWeight: 500, margin: '0 0 10px' }}>
            MISSION ÉVANGÉLIQUE DES NAVIGATEURS CI
          </p>
          <h1 style={{
            fontSize: 30, fontWeight: 800, color: '#fff',
            letterSpacing: '0.04em', lineHeight: 1.1,
            margin: '0 0 12px', textTransform: 'uppercase',
          }}>
            CAMP-NAVS<br />2026
          </h1>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.65, margin: 0, maxWidth: 300 }}>
            Les familles et réseaux relationnels pour une expansion naturelle de l'Évangile et du Royaume de Dieu
          </p>
          <Countdown />
        </div>
      </div>

      {/* ─── CARTES FLOTTANTES (overlap) ─── */}
      <div style={{ padding: '0 14px', marginTop: -52, position: 'relative', zIndex: 10, marginBottom: 10 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: 'Jeunes & Adultes', val: places.jeunes, max: 100, prix: '30 000 FCFA' },
            { label: 'Enfants & Ados', val: places.enfants, max: 50, prix: '25 000 FCFA' },
          ].map(({ label, val, max, prix }) => {
            const pct = Math.min((val / max) * 100, 100)
            return (
              <div key={label} style={{
                background: '#fff',
                borderRadius: 24,
                padding: '16px 14px',
                boxShadow: '0 8px 40px rgba(0,0,0,0.10)',
              }}>
                <p style={{ fontSize: 10, color: '#9CA3AF', margin: '0 0 6px', fontWeight: 500 }}>{label}</p>
                <p style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: '0 0 2px', lineHeight: 1 }}>
                  {val}<span style={{ fontSize: 12, fontWeight: 400, color: '#9CA3AF' }}> / {max}</span>
                </p>
                <div style={{ background: '#F3F4F6', borderRadius: 4, height: 3, margin: '8px 0 8px' }}>
                  <div style={{ background: '#054035', height: 3, borderRadius: 4, width: `${pct}%`, transition: 'width .5s ease' }} />
                </div>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#054035', margin: 0 }}>{prix}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* ─── ZONE BOUSSOLE ─── */}
      <div style={{ padding: '8px 20px 20px' }}>
        <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, margin: '0 0 14px', fontWeight: 400 }}>
          Bienvenue sur l'app officielle !<br />
          <span style={{ color: '#9CA3AF' }}>Prêt pour l'aventure ? 🌲</span>
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button onClick={() => navigate('/inscription')}
            style={{
              background: '#fff',
              border: '1.5px solid #F39C12',
              borderRadius: 16, padding: '13px 10px',
              fontSize: 13, fontWeight: 600,
              color: '#F39C12', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              boxShadow: '0 2px 12px rgba(243,156,18,0.15)',
            }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
            </svg>
            Mon inscription
          </button>
          <button onClick={() => navigate('/suivi')}
            style={{
              background: '#054035',
              border: 'none',
              borderRadius: 16, padding: '13px 10px',
              fontSize: 13, fontWeight: 600,
              color: '#fff', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            Mon statut
          </button>
        </div>
      </div>

      {/* ─── ACTIONS RAPIDES ─── */}
      <div style={{ padding: '0 20px 20px' }}>
        <p style={{ fontSize: 9, fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.12em', margin: '0 0 12px' }}>ACCÈS RAPIDE</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: 'Programme', sub: 'Planning 7 jours', path: '/programme', bg: '#EFF6FF', color: '#1D4ED8', icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg> },
            { label: 'Chants', sub: 'Répertoire & audio', path: '/chants', bg: '#F5F3FF', color: '#6D28D9', icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/></svg> },
            { label: 'Documents', sub: 'Ressources officielles', path: '/documents', bg: '#FFF7ED', color: '#C2410C', icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg> },
            { label: 'Contact', sub: 'Joindre l\'équipe', path: '/contact', bg: '#F0FDF4', color: '#166534', icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg> },
          ].map(item => (
            <div key={item.label} onClick={() => navigate(item.path)}
              style={{
                background: '#fff', borderRadius: 20,
                padding: '14px 12px', cursor: 'pointer',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: item.bg, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                {item.icon}
              </div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: '0 0 2px' }}>{item.label}</p>
              <p style={{ fontSize: 10, color: '#9CA3AF', margin: 0, lineHeight: 1.4 }}>{item.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── ACTUALITÉS ─── */}
      <div style={{ padding: '0 20px 90px' }}>
        <p style={{ fontSize: 9, fontWeight: 600, color: '#6B7280', letterSpacing: '0.12em', margin: '0 0 12px' }}>ACTUALITÉS DU CAMP</p>

        {/* Barre de recherche pilule */}
        <div style={{
          background: '#F3F4F6', borderRadius: 50,
          padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10,
          marginBottom: 14,
        }}>
          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#9CA3AF" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input type="text" value={recherche} onChange={e => setRecherche(e.target.value)}
            placeholder="Rechercher une actualité..."
            style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: '#374151', width: '100%' }} />
        </div>

        {annonces.length === 0 && (
          <div style={{ background: '#fff', borderRadius: 20, padding: '24px', textAlign: 'center', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <p style={{ fontSize: 13, color: '#9CA3AF' }}>Aucune actualité pour le moment.</p>
          </div>
        )}

        {annoncesFiltrees.map(a => <NewsCard key={a.id} annonce={a} />)}
      </div>

      {/* ─── MENU PLUS ─── */}
      {plusOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setPlusOpen(false)} />
          <div style={{ position: 'fixed', bottom: 56, left: 0, right: 0, maxWidth: 480, margin: '0 auto', background: '#fff', borderRadius: '20px 20px 0 0', borderTop: '0.5px solid #E5E7EB', padding: '12px 16px 16px', boxShadow: '0 -4px 24px rgba(0,0,0,0.08)', zIndex: 50 }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 32, height: 3, background: '#E5E7EB', borderRadius: 2, margin: '0 auto 12px' }} />
            <p style={{ fontSize: 9, fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.1em', marginBottom: 12 }}>PLUS DE SECTIONS</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
              {plusItems.map(item => (
                <div key={item.label} onClick={() => { navigate(item.path); setPlusOpen(false) }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 16, background: item.bg, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.icon}
                  </div>
                  <span style={{ fontSize: 10, color: '#6B7280', textAlign: 'center' }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ─── BOTTOM NAV ─── */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: 480, margin: '0 auto', background: '#fff', borderTop: '0.5px solid #E5E7EB', display: 'flex', zIndex: 30 }}>
        {[
          { label: 'Accueil', path: '/', active: true, icon: <svg style={{ width: 20, height: 20 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" /></svg> },
          { label: 'Planning', path: '/programme', icon: <svg style={{ width: 20, height: 20 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
          { label: 'Chants', path: '/chants', icon: <svg style={{ width: 20, height: 20 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg> },
          { label: "S'inscrire", path: '/inscription', icon: <svg style={{ width: 20, height: 20 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
        ].map(item => (
          <button key={item.label} onClick={() => navigate(item.path)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0 10px', color: item.active ? '#054035' : '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer' }}>
            {item.icon}
            <span style={{ fontSize: 10, marginTop: 2, fontWeight: item.active ? 600 : 400 }}>{item.label}</span>
          </button>
        ))}
        <button onClick={(e) => { e.stopPropagation(); setPlusOpen(!plusOpen) }}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0 10px', color: plusOpen ? '#054035' : '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer' }}>
          <svg style={{ width: 20, height: 20 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
          <span style={{ fontSize: 10, marginTop: 2 }}>Plus</span>
        </button>
      </nav>
    </div>
  )
}
