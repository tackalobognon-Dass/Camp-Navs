import { useEffect, useState, useRef } from 'react'
import BottomNav from '../../components/public/BottomNav'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const VERT = '#054035'

// ── Icônes ──────────────────────────────────────────────────────────
const IconPlay     = () => <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
const IconPause    = () => <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
const IconBack15   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 .49-3.18"/></svg>
const IconFwd15    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-.49-3.18"/></svg>
const IconArrow    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
const IconNote     = () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/></svg>
const IconText     = () => <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7"/></svg>

const COULEURS = [
  { bg: '#E1F5EE', color: '#054035', grad: 'linear-gradient(135deg,#054035,#0A6B50)' },
  { bg: '#EFF6FF', color: '#1D4ED8', grad: 'linear-gradient(135deg,#1D4ED8,#3B82F6)' },
  { bg: '#F5F3FF', color: '#6D28D9', grad: 'linear-gradient(135deg,#6D28D9,#8B5CF6)' },
  { bg: '#FFF7ED', color: '#C2410C', grad: 'linear-gradient(135deg,#C2410C,#EA580C)' },
  { bg: '#F0FDF4', color: '#166534', grad: 'linear-gradient(135deg,#166534,#16A34A)' },
  { bg: '#FEF2F2', color: '#991B1B', grad: 'linear-gradient(135deg,#991B1B,#DC2626)' },
  { bg: '#ECFDF5', color: '#065F46', grad: 'linear-gradient(135deg,#065F46,#059669)' },
  { bg: '#FFFBEB', color: '#92400E', grad: 'linear-gradient(135deg,#92400E,#D97706)' },
]

// ── Rendu des paroles ─────────────────────────────────────────────
function isRefrain(l) {
  const t = l.trim()
  return /^(R:|Refrain|REFRAIN|Chorus|CHORUS)/i.test(t)
}
function isBridge(l) {
  return /^(Bridge|BRIDGE|Pont|PONT)/i.test(l.trim())
}

function renderParoles(texte, taille) {
  if (!texte) return null
  const blocs = texte.split(/\n\n+/)
  let verseNum = 0
  const fs = 15 + taille * 2

  return blocs.map((bloc, bi) => {
    const lignes = bloc.split('\n').filter(l => l.trim())
    if (!lignes.length) return null
    const premiere = lignes[0]
    const refrain = isRefrain(premiere)
    const bridge = isBridge(premiere)
    if (!refrain && !bridge) verseNum++

    const label = refrain ? 'Refrain' : bridge ? 'Pont' : `Couplet ${verseNum}`
    const labelColor = refrain ? '#C9A84C' : bridge ? '#6D28D9' : '#94A3B8'
    const labelBg = refrain ? 'rgba(201,168,76,0.1)' : bridge ? 'rgba(109,40,217,0.06)' : 'transparent'
    const borderColor = refrain ? '#C9A84C' : bridge ? '#8B5CF6' : 'transparent'

    const lignesAfficher = lignes.filter((_, i) => !(i === 0 && (refrain || bridge)))

    return (
      <div key={bi} style={{ marginBottom: 28, borderLeft: `3px solid ${borderColor}`, paddingLeft: refrain || bridge ? 14 : 0, background: labelBg, borderRadius: refrain || bridge ? '0 12px 12px 0' : 0, padding: refrain || bridge ? '14px 14px 14px 16px' : '0' }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: labelColor, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 10px' }}>{label}</p>
        {lignesAfficher.map((ligne, li) => {
          const nettoye = ligne.replace(/^(R:|Refrain\s*:?|REFRAIN\s*:?|Chorus\s*:?|Bridge\s*:?|Pont\s*:?)\s*/i, '')
          return (
            <p key={li} style={{ fontSize: fs, lineHeight: 1.9, textAlign: 'center', margin: '0 0 2px', color: refrain ? '#054035' : '#1E293B', fontWeight: refrain ? 600 : 400, fontStyle: refrain ? 'italic' : 'normal' }}>
              {nettoye || ligne}
            </p>
          )
        })}
      </div>
    )
  })
}

// ── Lecteur audio complet ─────────────────────────────────────────
function ChantDetail({ chant, onBack, couleur }) {
  const audioRef = useRef(null)
  const [playing, setPlaying]   = useState(false)
  const [currentTime, setCT]    = useState(0)
  const [duration, setDur]      = useState(0)
  const [taille, setTaille]     = useState(0) // -1, 0, 1, 2
  const headerRef = useRef(null)
  const [headerH, setHeaderH]   = useState(0)

  useEffect(() => {
    if (headerRef.current) setHeaderH(headerRef.current.offsetHeight)
  })

  useEffect(() => {
    window.history.pushState(null, '', window.location.href)
    const handlePop = () => onBack()
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [onBack])

  function togglePlay() {
    const a = audioRef.current; if (!a) return
    if (playing) { a.pause(); setPlaying(false) }
    else { a.play(); setPlaying(true) }
  }

  function skip(s) {
    const a = audioRef.current; if (!a) return
    a.currentTime = Math.max(0, Math.min(a.currentTime + s, duration))
  }

  function handleSeek(e) {
    const a = audioRef.current; if (!a || !duration) return
    const r = e.currentTarget.getBoundingClientRect()
    a.currentTime = ((e.clientX - r.left) / r.width) * duration
  }

  function fmt(s) {
    if (!s || isNaN(s)) return '0:00'
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
  }

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0
  const hasAudio = !!chant.lien_audio

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', maxWidth: 480, margin: '0 auto' }}>
      <style>{`
        @keyframes wave { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(.25)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* ── Header fixe ── */}
      <div ref={headerRef} style={{ position: 'fixed', top: 0, left: 0, right: 0, maxWidth: 480, margin: '0 auto', background: couleur.grad, zIndex: 20, paddingBottom: 16 }}>

        {/* Retour + Titre */}
        <div style={{ padding: '44px 16px 0' }}>
          <button type="button" onClick={onBack}
            style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.65)', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 16 }}>
            <IconArrow /> Retour à la liste
          </button>

          {/* Disque vinyle décoratif + titre */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: '3px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: couleur.color || VERT }} />
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 17, fontWeight: 700, color: '#fff', margin: '0 0 4px', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chant.titre}</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', margin: 0 }}>{chant.artiste || 'Chant de camp · Navs 2026'}</p>
            </div>
          </div>
        </div>

        {/* Player audio */}
        {hasAudio ? (
          <div style={{ padding: '0 16px' }}>
            <audio ref={audioRef} src={chant.lien_audio}
              onTimeUpdate={e => setCT(e.target.currentTime)}
              onLoadedMetadata={e => setDur(e.target.duration)}
              onEnded={() => setPlaying(false)} />

            {/* Ondes */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, height: 28, marginBottom: 12 }}>
              {[5,10,18,8,22,14,26,10,20,16,24,8,18,12,6,20,14,8,22,10].map((h, i) => (
                <div key={i} style={{ width: 3, borderRadius: 3, background: playing ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.2)', height: h, animation: playing ? `wave 1.1s ease-in-out ${(i * 0.06).toFixed(2)}s infinite` : 'none', transition: 'background .3s' }} />
              ))}
            </div>

            {/* Barre de progression */}
            <div onClick={handleSeek} style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 10, height: 4, cursor: 'pointer', marginBottom: 6, position: 'relative' }}>
              <div style={{ background: '#fff', borderRadius: 10, height: 4, width: `${pct}%`, transition: 'width .1s linear' }} />
              <div style={{ position: 'absolute', top: -5, left: `${pct}%`, transform: 'translateX(-50%)', width: 14, height: 14, background: '#fff', borderRadius: '50%', boxShadow: '0 1px 6px rgba(0,0,0,0.3)', transition: 'left .1s linear' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 14 }}>
              <span>{fmt(currentTime)}</span><span>{fmt(duration)}</span>
            </div>

            {/* Contrôles */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
              <button type="button" onClick={() => skip(-15)} title="-15s"
                style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 0 }}>
                <IconBack15 />
                <span style={{ fontSize: 7, opacity: 0.7, marginTop: 1 }}>15s</span>
              </button>
              <button type="button" onClick={togglePlay}
                style={{ width: 58, height: 58, borderRadius: '50%', background: '#fff', border: 'none', color: couleur.color || VERT, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.25)' }}>
                {playing ? <IconPause /> : <IconPlay />}
              </button>
              <button type="button" onClick={() => skip(15)} title="+15s"
                style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 0 }}>
                <IconFwd15 />
                <span style={{ fontSize: 7, opacity: 0.7, marginTop: 1 }}>15s</span>
              </button>
            </div>
          </div>
        ) : (
          <div style={{ margin: '0 16px', background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '10px', textAlign: 'center' }}>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: 0 }}>Pas d'audio disponible pour ce chant</p>
          </div>
        )}
      </div>

      {/* ── Paroles ── */}
      <div style={{ paddingTop: headerH || 280, paddingBottom: 40 }}>

        {chant.paroles ? (
          <div style={{ padding: '0 20px', animation: 'fadeUp .4s ease' }}>
            {/* Contrôle taille texte */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingTop: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ height: 1, width: 40, background: '#E2E8F0' }} />
                <span style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em' }}>PAROLES</span>
                <div style={{ height: 1, width: 40, background: '#E2E8F0' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F1F5F9', borderRadius: 20, padding: '4px 10px' }}>
                <IconText />
                <button type="button" onClick={() => setTaille(t => Math.max(-1, t - 1))}
                  style={{ width: 22, height: 22, borderRadius: '50%', background: taille > -1 ? '#fff' : '#E2E8F0', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: taille > -1 ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}>−</button>
                <button type="button" onClick={() => setTaille(t => Math.min(2, t + 1))}
                  style={{ width: 22, height: 22, borderRadius: '50%', background: taille < 2 ? '#fff' : '#E2E8F0', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: taille < 2 ? '0 1px 3px rgba(0,0,0,0.08)' : 'none' }}>+</button>
              </div>
            </div>

            {renderParoles(chant.paroles, taille)}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <IconNote />
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', margin: '0 0 6px' }}>Paroles non disponibles</p>
            <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>Les paroles de ce chant seront ajoutées prochainement.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Liste des chants ──────────────────────────────────────────────
export default function ChantsPage() {
  const navigate = useNavigate()
  const [chants, setChants] = useState([])
  const [loading, setLoading] = useState(true)
  const [recherche, setRecherche] = useState('')
  const [filtre, setFiltre] = useState('tous')
  const [chantSelectionne, setChantSelectionne] = useState(null)

  useEffect(() => {
    supabase.from('chants').select('*').order('ordre', { ascending: true })
      .then(({ data }) => { setChants(data || []); setLoading(false) })
  }, [])

  const filtres = chants
    .filter(c => {
      if (filtre === 'audio') return !!c.lien_audio
      if (filtre === 'paroles') return !!c.paroles
      return true
    })
    .filter(c =>
      c.titre.toLowerCase().includes(recherche.toLowerCase()) ||
      (c.artiste && c.artiste.toLowerCase().includes(recherche.toLowerCase()))
    )

  const nbAudio   = chants.filter(c => c.lien_audio).length
  const nbParoles = chants.filter(c => c.paroles).length

  if (chantSelectionne) {
    const idx = chants.findIndex(c => c.id === chantSelectionne.id)
    const couleur = COULEURS[idx % COULEURS.length]
    return <ChantDetail chant={chantSelectionne} couleur={couleur} onBack={() => setChantSelectionne(null)} />
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', maxWidth: 480, margin: '0 auto' }}>
      <style>{`@keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }`}</style>

      {/* Header */}
      <div style={{ background: `linear-gradient(160deg, ${VERT}, #0A6B50)`, padding: '44px 16px 16px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: 160, height: 160, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)', top: -50, right: -40 }} />
        <button type="button" onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.6)', fontSize: 11, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 14 }}>
          <IconArrow /> Retour
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/></svg>
          </div>
          <div>
            <p style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 0 3px' }}>Chants du camp</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', margin: 0 }}>{chants.length} chant(s) · {nbAudio} audio · {nbParoles} paroles</p>
          </div>
        </div>

        {/* Recherche */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '9px 13px', display: 'flex', alignItems: 'center', gap: 9, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: 12 }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input type="text" value={recherche} onChange={e => setRecherche(e.target.value)}
            placeholder="Titre, artiste..."
            style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: '#1E293B', width: '100%' }} />
          {recherche && <button type="button" onClick={() => setRecherche('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 16, lineHeight: 1, padding: 0 }}>✕</button>}
        </div>

        {/* Filtres pills */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { key: 'tous',    label: `Tous (${chants.length})` },
            { key: 'audio',   label: `🎵 Audio (${nbAudio})` },
            { key: 'paroles', label: `📄 Paroles (${nbParoles})` },
          ].map(f => (
            <button key={f.key} type="button" onClick={() => setFiltre(f.key)}
              style={{ padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: filtre === f.key ? 700 : 500, cursor: 'pointer', border: `1px solid ${filtre === f.key ? '#fff' : 'rgba(255,255,255,0.3)'}`, background: filtre === f.key ? '#fff' : 'transparent', color: filtre === f.key ? VERT : 'rgba(255,255,255,0.8)', transition: 'all .2s' }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Liste */}
      <div style={{ padding: '12px 14px 90px' }}>
        {loading && <p style={{ textAlign: 'center', fontSize: 13, color: '#94A3B8', padding: '40px 0' }}>Chargement...</p>}

        {!loading && chants.length === 0 && (
          <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #F1F5F9', padding: '40px 20px', textAlign: 'center', marginTop: 8 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎵</div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', margin: '0 0 6px' }}>Aucun chant disponible</p>
            <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>Le répertoire sera publié prochainement.</p>
          </div>
        )}

        {!loading && recherche && filtres.length === 0 && (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #F1F5F9', padding: 20, textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>Aucun résultat pour "{recherche}"</p>
          </div>
        )}

        {recherche && filtres.length > 0 && (
          <p style={{ fontSize: 11, color: '#94A3B8', marginBottom: 10 }}>{filtres.length} résultat(s)</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtres.map((c, i) => {
            const idx = chants.findIndex(ch => ch.id === c.id)
            const couleur = COULEURS[idx % COULEURS.length]
            return (
              <div key={c.id} onClick={() => setChantSelectionne(c)}
                style={{ background: '#fff', borderRadius: 14, border: '1px solid #F1F5F9', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', animation: `fadeUp .3s ease ${Math.min(i * 0.04, 0.3)}s both` }}
                onTouchStart={e => e.currentTarget.style.transform = 'scale(0.98)'}
                onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}>

                {/* Icône colorée */}
                <div style={{ width: 44, height: 44, borderRadius: 12, background: couleur.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 3px 10px ${couleur.color}40` }}>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/></svg>
                </div>

                {/* Infos */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.titre}</p>
                  <p style={{ fontSize: 11, color: '#94A3B8', margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.artiste || 'Chant de camp'}</p>
                  <div style={{ display: 'flex', gap: 5 }}>
                    {c.lien_audio && (
                      <span style={{ fontSize: 9, fontWeight: 700, color: '#1D4ED8', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 20, padding: '2px 8px' }}>🎵 Audio</span>
                    )}
                    {c.paroles && (
                      <span style={{ fontSize: 9, fontWeight: 700, color: '#6D28D9', background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 20, padding: '2px 8px' }}>📄 Paroles</span>
                    )}
                  </div>
                </div>

                {/* Numéro + flèche */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#CBD5E1' }}>#{idx + 1}</span>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#CBD5E1" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6"/></svg>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
