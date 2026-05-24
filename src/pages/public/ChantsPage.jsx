import { useEffect, useState, useRef } from 'react'
import BottomNav from '../../components/public/BottomNav'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const IconPlay = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
const IconPause = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
const IconSkipBack = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
const IconSkipFwd = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
const IconSearch = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
const IconChevron = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
const IconArrowLeft = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>

// Détecte les lignes de refrain (commence par "R:" ou "Refrain" ou est en MAJUSCULES)
function isRefrain(ligne) {
  const t = ligne.trim()
  return t.startsWith('R:') || t.startsWith('Refrain') || t.startsWith('REFRAIN') || t.startsWith('Chorus')
}

function renderParoles(texte) {
  if (!texte) return null
  const blocs = texte.split(/\n\n+/)
  return blocs.map((bloc, bi) => {
    const lignes = bloc.split('\n')
    const premiereNonVide = lignes.find(l => l.trim())
    const estRefrain = premiereNonVide && isRefrain(premiereNonVide)
    return (
      <div key={bi} style={{ marginBottom: 28 }}>
        {lignes.map((ligne, li) => {
          if (!ligne.trim()) return <div key={li} style={{ height: 8 }} />
          const marqueur = isRefrain(ligne)
          const texteNettoye = ligne.replace(/^(R:|Refrain\s*:?|REFRAIN\s*:?|Chorus\s*:?)\s*/i, '')
          return (
            <p key={li} style={{
              fontSize: 18,
              lineHeight: 1.85,
              textAlign: 'center',
              margin: '0 0 2px',
              color: estRefrain ? '#054035' : '#1a1a1a',
              fontWeight: estRefrain ? 600 : 400,
              fontStyle: marqueur ? 'normal' : estRefrain ? 'italic' : 'normal',
            }}>
              {marqueur
                ? <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#054035', fontStyle: 'normal', display: 'block', marginBottom: 4 }}>— REFRAIN —</span>
                : texteNettoye || ligne
              }
            </p>
          )
        })}
      </div>
    )
  })
}

function ChantDetail({ chant, onBack }) {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    window.history.pushState(null, '', window.location.href)
    const handlePop = () => onBack()
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [onBack])

  function togglePlay() {
    const a = audioRef.current
    if (!a) return
    if (playing) { a.pause(); setPlaying(false) }
    else { a.play(); setPlaying(true) }
  }

  function skip(sec) {
    const a = audioRef.current
    if (!a) return
    a.currentTime = Math.max(0, Math.min(a.currentTime + sec, duration))
  }

  function handleSeek(e) {
    const a = audioRef.current
    if (!a || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    a.currentTime = ((e.clientX - rect.left) / rect.width) * duration
  }

  function fmt(s) {
    if (!s || isNaN(s)) return '0:00'
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
  }

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0
  const hasAudio = !!chant.lien_audio

  const headerRef = useRef(null)
  const [headerHeight, setHeaderHeight] = useState(0)

  useEffect(() => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.offsetHeight)
    }
  }, [chant, playing])

  return (
    <div style={{ minHeight: '100vh', background: '#fff', maxWidth: 480, margin: '0 auto' }}>
      <style>{`@keyframes wave{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.3)}}`}</style>

      {/* Header fixe avec lecteur intégré */}
      <div ref={headerRef} style={{ position: 'fixed', top: 0, left: 0, right: 0, maxWidth: 480, margin: '0 auto', background: 'linear-gradient(160deg,#054035,#085041)', padding: '44px 16px 16px', zIndex: 20 }}>

        {/* Bouton retour */}
        <button onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.6)', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 14 }}>
          <IconArrowLeft />
          Retour à la liste
        </button>

        {/* Titre et artiste */}
        <p style={{ fontSize: 18, fontWeight: 600, color: '#fff', margin: '0 0 3px', lineHeight: 1.3 }}>{chant.titre}</p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: '0 0 14px' }}>
          {chant.artiste || 'Paroles & Musique · Session Louange'}
        </p>

        {/* Lecteur audio */}
        {hasAudio && (
          <>
            <audio ref={audioRef} src={chant.lien_audio}
              onTimeUpdate={e => setCurrentTime(e.target.currentTime)}
              onLoadedMetadata={e => setDuration(e.target.duration)}
              onEnded={() => setPlaying(false)} />

            {/* Ondes animées compactes */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2.5, height: 24, marginBottom: 10 }}>
              {[6,14,20,10,24,14,18,8,22,12,16,8,14,18,6].map((h, i) => (
                <div key={i} style={{
                  width: 2.5, borderRadius: 2,
                  background: playing ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.25)',
                  height: h,
                  animation: playing ? `wave 1s ease-in-out ${(i * 0.07).toFixed(2)}s infinite` : 'none',
                  transition: 'background .3s',
                }} />
              ))}
            </div>

            {/* Barre de progression fine */}
            <div onClick={handleSeek} style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 10, height: 3, cursor: 'pointer', marginBottom: 5, position: 'relative' }}>
              <div style={{ background: '#fff', borderRadius: 10, height: 3, width: `${pct}%`, transition: 'width .1s linear' }} />
              <div style={{ position: 'absolute', top: -5, left: `${pct}%`, transform: 'translateX(-50%)', width: 13, height: 13, background: '#fff', borderRadius: '50%', boxShadow: '0 1px 4px rgba(0,0,0,0.25)' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>
              <span>{fmt(currentTime)}</span><span>{fmt(duration)}</span>
            </div>

            {/* Boutons de contrôle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 4 }}>
              <button onClick={() => skip(-10)}
                style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 .49-3.18"/><text x="12" y="14" fontSize="6" fill="currentColor" stroke="none" textAnchor="middle">10</text></svg>
              </button>
              <button onClick={() => skip(-30)}
                style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}>
                <IconSkipBack />
              </button>
              <button onClick={togglePlay}
                style={{ background: '#fff', border: 'none', borderRadius: '50%', width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#054035', cursor: 'pointer', boxShadow: '0 3px 12px rgba(0,0,0,0.2)' }}>
                {playing ? <IconPause /> : <IconPlay />}
              </button>
              <button onClick={() => skip(30)}
                style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}>
                <IconSkipFwd />
              </button>
              <button onClick={() => skip(10)}
                style={{ background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer' }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-.49-3.18"/><text x="12" y="14" fontSize="6" fill="currentColor" stroke="none" textAnchor="middle">10</text></svg>
              </button>
            </div>
          </>
        )}

        {!hasAudio && (
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 14px', marginBottom: 4 }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textAlign: 'center', margin: 0 }}>Pas d'audio disponible</p>
          </div>
        )}
      </div>

      {/* Zone paroles — scrollable sous le header fixe */}
      <div style={{ paddingTop: headerHeight || 260, padding: `${headerHeight || 260}px 20px 80px`, background: '#fff', minHeight: '100vh' }}>
        {chant.paroles ? (
          <>
            {/* Label PAROLES */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 24 }}>
              <div style={{ height: 0.5, flex: 1, background: '#e5e5e0' }} />
              <span style={{ fontSize: 9, fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.1em' }}>PAROLES</span>
              <div style={{ height: 0.5, flex: 1, background: '#e5e5e0' }} />
            </div>

            {renderParoles(chant.paroles)}
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200 }}>
            <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center' }}>Les paroles ne sont pas encore disponibles.</p>
          </div>
        )}
      </div>
    </div>
  )
}

const NoteIcon = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
  </svg>
)

const COULEURS_ICONE = [
  { bg: '#E1F5EE', color: '#054035' },
  { bg: '#EFF6FF', color: '#1D4ED8' },
  { bg: '#F5F3FF', color: '#6D28D9' },
  { bg: '#FFF7ED', color: '#C2410C' },
  { bg: '#F0FDF4', color: '#166534' },
  { bg: '#FEF2F2', color: '#991B1B' },
]

export default function ChantsPage() {
  const navigate = useNavigate()
  const [chants, setChants] = useState([])
  const [loading, setLoading] = useState(true)
  const [recherche, setRecherche] = useState('')
  const [chantSelectionne, setChantSelectionne] = useState(null)

  useEffect(() => {
    supabase.from('chants').select('*').order('ordre', { ascending: true })
      .then(({ data }) => { setChants(data || []); setLoading(false) })
  }, [])

  const filtres = chants.filter(c =>
    c.titre.toLowerCase().includes(recherche.toLowerCase()) ||
    (c.artiste && c.artiste.toLowerCase().includes(recherche.toLowerCase()))
  )

  if (chantSelectionne) {
    return <ChantDetail chant={chantSelectionne} onBack={() => setChantSelectionne(null)} />
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', maxWidth: 480, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(160deg,#054035,#085041)', padding: '44px 16px 20px' }}>
        <button onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.6)', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 12 }}>
          <IconArrowLeft /> Retour
        </button>
        <p style={{ fontSize: 20, fontWeight: 500, color: '#fff', margin: '0 0 3px' }}>Chants du camp</p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: 0 }}>{chants.length} chant(s) dans le répertoire</p>
      </div>

      {/* Barre de recherche flottante */}
      <div style={{ padding: '0 14px', marginTop: -20, marginBottom: 4, position: 'relative', zIndex: 10 }}>
        <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.1)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input type="text" value={recherche} onChange={e => setRecherche(e.target.value)}
            placeholder="Rechercher un chant ou un artiste..."
            style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: '#1a1a1a', width: '100%' }} />
          {recherche && (
            <button onClick={() => setRecherche('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 16, lineHeight: 1, padding: 0, flexShrink: 0 }}>✕</button>
          )}
        </div>
      </div>

      <div style={{ padding: '10px 14px 80px' }}>
        {loading && <p style={{ textAlign: 'center', fontSize: 13, color: '#9CA3AF', padding: '30px 0' }}>Chargement...</p>}

        {!loading && chants.length === 0 && (
          <div style={{ background: '#fff', borderRadius: 16, border: '0.5px solid #F3F4F6', padding: 28, textAlign: 'center', marginTop: 8 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🎵</div>
            <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>Aucun chant disponible pour le moment.</p>
          </div>
        )}

        {!loading && recherche && filtres.length === 0 && (
          <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #F3F4F6', padding: 20, textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>Aucun résultat pour "{recherche}"</p>
          </div>
        )}

        {/* Compteur résultats si recherche active */}
        {recherche && filtres.length > 0 && (
          <p style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 10 }}>{filtres.length} résultat(s)</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtres.map((c, i) => {
            const couleur = COULEURS_ICONE[i % COULEURS_ICONE.length]
            return (
              <div key={c.id} onClick={() => setChantSelectionne(c)}
                style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #F3F4F6', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'transform .1s' }}
                onTouchStart={e => e.currentTarget.style.transform = 'scale(0.98)'}
                onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}>

                {/* Icône note de musique */}
                <div style={{ width: 44, height: 44, borderRadius: 12, background: couleur.bg, color: couleur.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <NoteIcon />
                </div>

                {/* Infos */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: '#111827', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.titre}
                  </p>
                  <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.artiste || 'Chant de camp'}
                  </p>
                  <div style={{ display: 'flex', gap: 5 }}>
                    {c.lien_audio && (
                      <span style={{ fontSize: 9, fontWeight: 600, color: '#1D4ED8', background: '#EFF6FF', border: '0.5px solid #BFDBFE', borderRadius: 20, padding: '2px 7px', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <svg width="8" height="8" fill="currentColor" viewBox="0 0 24 24"><path d="M3 18v-6a9 9 0 0118 0v6"/><path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z"/></svg>
                        Audio
                      </span>
                    )}
                    {c.paroles && (
                      <span style={{ fontSize: 9, fontWeight: 600, color: '#6D28D9', background: '#F5F3FF', border: '0.5px solid #DDD6FE', borderRadius: 20, padding: '2px 7px', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <svg width="8" height="8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                        Paroles
                      </span>
                    )}
                  </div>
                </div>

                {/* Flèche */}
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#D1D5DB" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6"/>
                </svg>
              </div>
            )
          })}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
