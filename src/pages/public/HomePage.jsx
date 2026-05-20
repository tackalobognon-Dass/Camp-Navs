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
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '6px', marginTop: '12px' }}>
      {[{ v: time.j, l: 'JOURS' }, { v: time.h, l: 'HEURES' }, { v: time.m, l: 'MIN' }, { v: time.s, l: 'SEC', pulse: true }].map(({ v, l, pulse }) => (
        <div key={l} style={{
          background: 'rgba(255,255,255,0.12)',
          border: '0.5px solid rgba(255,255,255,0.2)',
          borderRadius: '10px',
          padding: '7px 4px',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: '22px',
            fontWeight: '700',
            color: '#fff',
            lineHeight: '1',
            animation: pulse ? 'pulse 1s infinite' : 'none',
          }}>{v}</div>
          <div style={{ width: '1px', height: '8px', background: 'rgba(255,255,255,0.2)', margin: '4px auto' }} />
          <div style={{ fontSize: '6px', color: '#9FE1CB', letterSpacing: '0.05em' }}>{l}</div>
        </div>
      ))}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
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

  const tagGradients = {
    Nouveau: 'linear-gradient(140deg,#054035,#1D9E75)',
    Important: 'linear-gradient(140deg,#8B2500,#D94F1E)',
    Document: 'linear-gradient(140deg,#2C1F6B,#6B4FBB)',
    Info: 'linear-gradient(140deg,#6B4A00,#C48A00)',
  }

  const plusItems = [
    {
      label: 'Documents', path: '/documents',
      icon: <svg style={{ width: 22, height: 22 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
      bg: '#FAECE7', color: '#993C1D'
    },
    {
      label: 'Discussion', path: '/discussion',
      icon: <svg style={{ width: 22, height: 22 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
      bg: '#E1F5EE', color: '#085041'
    },
    {
      label: 'Contact', path: '/contact',
      icon: <svg style={{ width: 22, height: 22 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>,
      bg: '#EEEDFE', color: '#534AB7'
    },
    {
      label: 'Lieu', path: '/lieu',
      icon: <svg style={{ width: 22, height: 22 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
      bg: '#E6F1FB', color: '#185FA5'
    },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f8f8f6', maxWidth: '480px', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>

      {/* HERO */}
      <div style={{ background: 'linear-gradient(160deg,#054035 0%,#085041 50%,#0F6E56 100%)', padding: '40px 16px 16px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: 140, height: 140, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.07)', top: -45, right: -35 }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ width: 40, height: 40, background: '#fff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
            <img src="/logo-navs.jpg" alt="Navigateurs" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#C9A84C', letterSpacing: '0.04em' }}>LES</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', letterSpacing: '0.03em', lineHeight: 1 }}>NAVIGATEURS</div>
            <div style={{ fontSize: 9, color: '#9FE1CB', fontStyle: 'italic' }}>Côte d'Ivoire</div>
          </div>
        </div>

        <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Camp-Navs 2026</div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.72)', fontStyle: 'italic', borderLeft: '2px solid #C9A84C', paddingLeft: 8, marginBottom: 4, lineHeight: 1.5 }}>
          Les familles et réseaux relationnels pour une expansion naturelle de l'Évangile
        </div>

        <Countdown />
      </div>

      {/* PLACES - réduit */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '8px 14px' }}>
        {[
          { label: 'Jeunes & Adultes', val: places.jeunes, max: 100, prix: '30 000 FCFA' },
          { label: 'Enfants & Ados', val: places.enfants, max: 50, prix: '25 000 FCFA' },
        ].map(({ label, val, max, prix }) => (
          <div key={label} style={{ background: '#fff', borderRadius: 10, border: '0.5px solid #e5e5e0', padding: '8px 10px' }}>
            <div style={{ fontSize: 9, color: '#888780', marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: '#085041' }}>{val}<span style={{ fontSize: 9, color: '#888780', fontWeight: 400 }}> / {max}</span></div>
            <div style={{ background: '#E1F5EE', borderRadius: 3, height: 3, marginTop: 4 }}>
              <div style={{ background: '#085041', borderRadius: 3, height: 3, width: `${Math.min((val / max) * 100, 100)}%` }} />
            </div>
            <div style={{ fontSize: 8, color: '#888780', marginTop: 3 }}>{prix}</div>
          </div>
        ))}
      </div>

      {/* ACTIONS - réduites */}
      <div style={{ padding: '0 14px 10px' }}>
        <div style={{ fontSize: 9, fontWeight: 500, color: '#888780', letterSpacing: '0.06em', marginBottom: 7 }}>ACTIONS RAPIDES</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div onClick={() => navigate('/inscription')} style={{ background: '#085041', borderRadius: 12, padding: '10px 12px', cursor: 'pointer' }}>
            <svg style={{ width: 18, height: 18, color: '#fff', marginBottom: 4 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            <div style={{ fontSize: 11, fontWeight: 500, color: '#fff' }}>S'inscrire</div>
            <div style={{ fontSize: 9, color: '#9FE1CB', marginTop: 2 }}>Réservez votre place</div>
            <div style={{ marginTop: 6, fontSize: 9, fontWeight: 500, color: '#fff', background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '2px 8px', display: 'inline-block' }}>Go</div>
          </div>
          <div onClick={() => navigate('/suivi')} style={{ background: '#FAEEDA', borderRadius: 12, padding: '10px 12px', cursor: 'pointer' }}>
            <svg style={{ width: 18, height: 18, color: '#854F0B', marginBottom: 4 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <div style={{ fontSize: 11, fontWeight: 500, color: '#412402' }}>Mon inscription</div>
            <div style={{ fontSize: 9, color: '#854F0B', marginTop: 2 }}>Voir mon statut</div>
            <div style={{ marginTop: 6, fontSize: 9, fontWeight: 500, color: '#412402', background: 'rgba(0,0,0,0.08)', borderRadius: 20, padding: '2px 8px', display: 'inline-block' }}>Go</div>
          </div>
        </div>
      </div>

      {/* ACTUALITES - une carte visible + flèche */}
      <div style={{ padding: '0 14px 90px' }}>
        <div style={{ fontSize: 9, fontWeight: 500, color: '#888780', letterSpacing: '0.06em', marginBottom: 7 }}>ACTUALITES</div>
        {annonces.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 16, border: '0.5px solid #e5e5e0', padding: '20px', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: '#888780' }}>Aucune actualité pour le moment.</p>
          </div>
        ) : (
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none', paddingRight: 40 }}>
              {annonces.map((a) => (
                <div key={a.id} style={{
                  flexShrink: 0,
                  width: '85vw',
                  maxWidth: 340,
                  borderRadius: 16,
                  padding: '14px',
                  position: 'relative',
                  overflow: 'hidden',
                  background: tagGradients[a.tag] || tagGradients['Info'],
                }}>
                  <div style={{ position: 'absolute', width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', top: -20, right: -20 }} />
                  <span style={{ fontSize: 8, fontWeight: 600, background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: 20, padding: '2px 8px', display: 'inline-block', marginBottom: 8 }}>{a.tag}</span>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#fff', lineHeight: 1.3, marginBottom: 5 }}>{a.titre}</div>
                  {a.contenu && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.78)', lineHeight: 1.5 }}>{a.contenu}</div>}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>{new Date(a.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg style={{ width: 12, height: 12, color: '#fff' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Flèche indicateur de scroll */}
            {annonces.length > 1 && (
              <div style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', background: 'rgba(8,80,65,0.15)', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg style={{ width: 14, height: 14, color: '#085041' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MENU PLUS - corrigé sans overlay noir */}
      {plusOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setPlusOpen(false)} />
          <div style={{
            position: 'fixed',
            bottom: 56,
            left: 0,
            right: 0,
            maxWidth: 480,
            margin: '0 auto',
            background: '#fff',
            borderRadius: '20px 20px 0 0',
            borderTop: '0.5px solid #e5e5e0',
            padding: '12px 16px 16px',
            boxShadow: '0 -4px 24px rgba(0,0,0,0.1)',
            zIndex: 50,
          }}>
            <div style={{ width: 32, height: 3, background: '#e0e0e0', borderRadius: 2, margin: '0 auto 12px' }} />
            <div style={{ fontSize: 9, fontWeight: 500, color: '#888780', letterSpacing: '0.06em', marginBottom: 12 }}>PLUS DE SECTIONS</div>
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

      {/* BOTTOM NAV */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: 480, margin: '0 auto', background: '#fff', borderTop: '0.5px solid #e5e5e0', display: 'flex', zIndex: 30 }}>
        {[
          { label: 'Accueil', path: '/', icon: <svg style={{ width: 20, height: 20 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" /></svg>, active: true },
          { label: 'Planning', path: '/programme', icon: <svg style={{ width: 20, height: 20 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
          { label: 'Chants', path: '/chants', icon: <svg style={{ width: 20, height: 20 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg> },
          { label: "S'inscrire", path: '/inscription', icon: <svg style={{ width: 20, height: 20 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
        ].map(item => (
          <button key={item.label} onClick={() => navigate(item.path)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0 10px', color: item.active ? '#085041' : '#888780', background: 'none', border: 'none', cursor: 'pointer' }}>
            {item.icon}
            <span style={{ fontSize: 10, marginTop: 2 }}>{item.label}</span>
          </button>
        ))}
        <button onClick={() => setPlusOpen(!plusOpen)}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0 10px', color: plusOpen ? '#085041' : '#888780', background: 'none', border: 'none', cursor: 'pointer' }}>
          <svg style={{ width: 20, height: 20 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
          <span style={{ fontSize: 10, marginTop: 2 }}>Plus</span>
        </button>
      </nav>
    </div>
  )
}
