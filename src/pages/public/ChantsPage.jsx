import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

// Icônes SVG inline
const IconPlay = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
const IconPause = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
const IconSkipBack = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>
const IconSkipFwd = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
const IconBack10 = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 .49-3.18"/>
    <text x="12" y="14" fontSize="6" fill="currentColor" stroke="none" textAnchor="middle">10</text>
  </svg>
)
const IconFwd10 = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-.49-3.18"/>
    <text x="12" y="14" fontSize="6" fill="currentColor" stroke="none" textAnchor="middle">10</text>
  </svg>
)
const IconSearch = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
const IconChevron = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
const IconArrowLeft = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>

function AudioPlayer({ url }) {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

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

  const btnStyle = {
    width: 38, height: 38, borderRadius: '50%',
    background: 'rgba(255,255,255,0.18)',
    border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff',
  }

  return (
    <div style={{ background: 'linear-gradient(135deg,#054035,#085041,#0F6E56)', borderRadius: 18, padding: '18px 16px', marginBottom: 14 }}>
      <audio ref={audioRef} src={url}
        onTimeUpdate={e => setCurrentTime(e.target.currentTime)}
        onLoadedMetadata={e => setDuration(e.target.duration)}
        onEnded={() => setPlaying(false)} />

      {/* Ondes */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, height: 36, marginBottom: 14 }}>
        {[8,18,24,14,28,18,22,12,26,16,20,10,16,22,8].map((h, i) => (
          <div key={i} style={{
            width: 3, borderRadius: 2,
            background: playing ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.3)',
            height: h,
            animation: playing ? `wave 1s ease-in-out ${(i * 0.07).toFixed(2)}s infinite` : 'none',
          }} />
        ))}
      </div>
      <style>{`@keyframes wave{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.3)}}`}</style>

      {/* Barre progression */}
      <div onClick={handleSeek} style={{ background: 'rgba(255,255,255,0.22)', borderRadius: 10, height: 5, position: 'relative', cursor: 'pointer', marginBottom: 6 }}>
        <div style={{ background: '#fff', borderRadius: 10, height: 5, width: `${pct}%`, transition: 'width .1s linear' }} />
        <div style={{ position: 'absolute', top: -5, left: `${pct}%`, transform: 'translateX(-50%)', width: 15, height: 15, background: '#fff', borderRadius: '50%', boxShadow: '0 2px 6px rgba(0,0,0,0.25)' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.6)', marginBottom: 18 }}>
        <span>{fmt(currentTime)}</span><span>{fmt(duration)}</span>
      </div>

      {/* Boutons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <button style={btnStyle} onClick={() => skip(-10)} aria-label="Reculer 10s"><IconBack10 /></button>
        <button style={btnStyle} onClick={() => skip(-30)} aria-label="Précédent"><IconSkipBack /></button>
        <button onClick={togglePlay} aria-label={playing ? 'Pause' : 'Lecture'}
          style={{ width: 56, height: 56, borderRadius: '50%', background: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.22)', color: '#085041' }}>
          {playing ? <IconPause /> : <IconPlay />}
        </button>
        <button style={btnStyle} onClick={() => skip(30)} aria-label="Suivant"><IconSkipFwd /></button>
        <button style={btnStyle} onClick={() => skip(10)} aria-label="Avancer 10s"><IconFwd10 /></button>
      </div>
    </div>
  )
}

function ChantDetail({ chant, onBack }) {
  // Intercepter le bouton retour du téléphone
  useEffect(() => {
    window.history.pushState(null, '', window.location.href)
    const handlePop = () => onBack()
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [onBack])

  return (
    <div style={{ minHeight: '100vh', background: '#f8f8f6', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ background: 'linear-gradient(160deg,#054035,#085041)', padding: '44px 16px 20px' }}>
        <button onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#9FE1CB', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 14 }}>
          <IconArrowLeft /> Retour à la liste
        </button>
        <div style={{ fontSize: 19, fontWeight: 500, color: '#fff', marginBottom: 4 }}>{chant.titre}</div>
        {chant.artiste && <div style={{ fontSize: 11, color: '#9FE1CB' }}>{chant.artiste}</div>}
      </div>

      <div style={{ padding: '16px 16px 80px' }}>
        {chant.lien_audio
          ? <AudioPlayer url={chant.lien_audio} />
          : <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #e5e5e0', padding: 16, textAlign: 'center', marginBottom: 14 }}>
              <p style={{ fontSize: 12, color: '#888' }}>Aucun audio disponible.</p>
            </div>
        }

        {chant.paroles
          ? <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #e5e5e0', overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', borderBottom: '0.5px solid #e5e5e0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 9, fontWeight: 500, color: '#085041', letterSpacing: '0.06em' }}>PAROLES</span>
              </div>
              <div style={{ padding: '14px 16px' }}>
                <div style={{ fontSize: 14, color: '#1a1a1a', lineHeight: 2.2, whiteSpace: 'pre-wrap' }}>{chant.paroles}</div>
              </div>
            </div>
          : <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #e5e5e0', padding: 20, textAlign: 'center' }}>
              <p style={{ fontSize: 12, color: '#888' }}>Les paroles ne sont pas encore disponibles.</p>
            </div>
        }
      </div>
    </div>
  )
}

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
    <div style={{ minHeight: '100vh', background: '#f8f8f6', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ background: 'linear-gradient(160deg,#054035,#085041)', padding: '44px 16px 16px' }}>
        <button onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#9FE1CB', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 10 }}>
          <IconArrowLeft /> Retour
        </button>
        <div style={{ fontSize: 18, fontWeight: 500, color: '#fff', marginBottom: 2 }}>Chants du camp</div>
        <div style={{ fontSize: 10, color: '#9FE1CB', marginBottom: 14 }}>{chants.length} chant(s) dans le répertoire</div>
        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ color: 'rgba(255,255,255,0.6)', flexShrink: 0 }}><IconSearch /></div>
          <input type="text" value={recherche} onChange={e => setRecherche(e.target.value)}
            placeholder="Rechercher un chant..."
            style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: '#fff', width: '100%' }} />
        </div>
      </div>

      <div style={{ padding: '12px 14px 80px' }}>
        {loading && <p style={{ textAlign: 'center', fontSize: 13, color: '#888', padding: '30px 0' }}>Chargement...</p>}
        {!loading && chants.length === 0 && (
          <div style={{ background: '#fff', borderRadius: 16, border: '0.5px solid #e5e5e0', padding: 24, textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: '#888' }}>Aucun chant disponible pour le moment.</p>
          </div>
        )}
        {!loading && recherche && filtres.length === 0 && (
          <div style={{ background: '#fff', borderRadius: 16, border: '0.5px solid #e5e5e0', padding: 20, textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: '#888' }}>Aucun résultat pour "{recherche}"</p>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtres.map((c, i) => (
            <div key={c.id} onClick={() => setChantSelectionne(c)}
              style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #e5e5e0', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#085041' }}>{c.ordre || i + 1}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.titre}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                  {c.artiste && <span style={{ fontSize: 10, color: '#888' }}>{c.artiste}</span>}
                  {c.lien_audio && <span style={{ fontSize: 9, color: '#085041', background: '#E1F5EE', borderRadius: 20, padding: '1px 6px' }}>Audio</span>}
                  {c.paroles && <span style={{ fontSize: 9, color: '#534AB7', background: '#EEEDFE', borderRadius: 20, padding: '1px 6px' }}>Paroles</span>}
                </div>
              </div>
              <div style={{ color: '#ccc', flexShrink: 0 }}><IconChevron /></div>
            </div>
          ))}
        </div>
      </div>

      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: 480, margin: '0 auto', background: '#fff', borderTop: '0.5px solid #e5e5e0', display: 'flex', zIndex: 30 }}>
        {[
          { label: 'Accueil', path: '/', icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6"/></svg> },
          { label: 'Planning', path: '/programme', icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg> },
          { label: 'Chants', path: '/chants', active: true, icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/></svg> },
          { label: "S'inscrire", path: '/inscription', icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg> },
        ].map(item => (
          <button key={item.label} onClick={() => navigate(item.path)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0 10px', color: item.active ? '#085041' : '#888780', background: 'none', border: 'none', cursor: 'pointer' }}>
            {item.icon}
            <span style={{ fontSize: 10, marginTop: 2, fontWeight: item.active ? 500 : 400 }}>{item.label}</span>
          </button>
        ))}
        <button onClick={() => navigate('/')}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0 10px', color: '#888780', background: 'none', border: 'none', cursor: 'pointer' }}>
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"/></svg>
          <span style={{ fontSize: 10, marginTop: 2 }}>Plus</span>
        </button>
      </nav>
    </div>
  )
}
