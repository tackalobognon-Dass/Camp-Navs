import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

function AudioPlayer({ url, onTimeUpdate }) {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [loading, setLoading] = useState(false)

  function togglePlay() {
    const audio = audioRef.current
    if (!audio) return
    if (playing) { audio.pause(); setPlaying(false) }
    else { audio.play(); setPlaying(true) }
  }

  function handleSeek(e) {
    const audio = audioRef.current
    if (!audio) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const ratio = x / rect.width
    audio.currentTime = ratio * duration
  }

  function formatTime(s) {
    if (!s || isNaN(s)) return '0:00'
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div style={{ background: '#085041', borderRadius: 16, padding: '16px', marginBottom: 16 }}>
      <audio ref={audioRef} src={url}
        onTimeUpdate={e => { setCurrentTime(e.target.currentTime); onTimeUpdate && onTimeUpdate(e.target.currentTime) }}
        onLoadedMetadata={e => setDuration(e.target.duration)}
        onWaiting={() => setLoading(true)}
        onCanPlay={() => setLoading(false)}
        onEnded={() => setPlaying(false)} />

      {/* Barre de progression */}
      <div onClick={handleSeek} style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 10, height: 4, cursor: 'pointer', marginBottom: 10, position: 'relative' }}>
        <div style={{ background: '#9FE1CB', borderRadius: 10, height: 4, width: `${progress}%`, transition: 'width .1s linear' }} />
        <div style={{ position: 'absolute', top: -4, left: `${progress}%`, transform: 'translateX(-50%)', width: 12, height: 12, background: '#fff', borderRadius: '50%', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
      </div>

      {/* Temps */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>{formatTime(currentTime)}</span>
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>{formatTime(duration)}</span>
      </div>

      {/* Bouton play */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <button onClick={togglePlay} style={{
          width: 52, height: 52, borderRadius: '50%', background: '#fff', border: 'none',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
        }}>
          {loading ? (
            <svg style={{ width: 22, height: 22, color: '#085041', animation: 'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ) : playing ? (
            <svg style={{ width: 22, height: 22, color: '#085041' }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6zm8 0h4v16h-4z" />
            </svg>
          ) : (
            <svg style={{ width: 22, height: 22, color: '#085041', marginLeft: 2 }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

function ChantDetail({ chant, onBack }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f8f8f6', maxWidth: 480, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(160deg,#054035,#085041)', padding: '44px 16px 20px' }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#9FE1CB', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 14 }}>
          ← Retour
        </button>
        <div style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 3 }}>{chant.titre}</div>
        {chant.artiste && <div style={{ fontSize: 11, color: '#9FE1CB' }}>{chant.artiste}</div>}
      </div>

      <div style={{ padding: '16px 16px 80px' }}>
        {/* Lecteur */}
        {chant.lien_audio ? (
          <AudioPlayer url={chant.lien_audio} />
        ) : (
          <div style={{ background: '#fff', borderRadius: 16, border: '0.5px solid #e5e5e0', padding: 20, textAlign: 'center', marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: '#888' }}>Aucun audio disponible pour ce chant.</p>
          </div>
        )}

        {/* Paroles */}
        {chant.paroles ? (
          <div style={{ background: '#fff', borderRadius: 16, border: '0.5px solid #e5e5e0', padding: '16px' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#085041', letterSpacing: '0.06em', marginBottom: 12 }}>PAROLES</div>
            <div style={{ fontSize: 13, color: '#1a1a1a', lineHeight: 2, whiteSpace: 'pre-wrap' }}>
              {chant.paroles}
            </div>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 16, border: '0.5px solid #e5e5e0', padding: 20, textAlign: 'center' }}>
            <p style={{ fontSize: 12, color: '#888' }}>Les paroles ne sont pas encore disponibles.</p>
          </div>
        )}
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
    async function fetchChants() {
      const { data } = await supabase.from('chants').select('*').order('ordre', { ascending: true })
      setChants(data || [])
      setLoading(false)
    }
    fetchChants()
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

      {/* Header */}
      <div style={{ background: 'linear-gradient(160deg,#054035,#085041)', padding: '44px 16px 16px' }}>
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#9FE1CB', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 10 }}>
          ← Retour
        </button>
        <div style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 2 }}>Chants du camp</div>
        <div style={{ fontSize: 10, color: '#9FE1CB', marginBottom: 14 }}>{chants.length} chant(s) dans le répertoire</div>

        {/* Barre de recherche */}
        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.6)', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" value={recherche} onChange={e => setRecherche(e.target.value)}
            placeholder="Rechercher un chant..."
            style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: '#fff', width: '100%' }} />
        </div>
      </div>

      {/* Liste */}
      <div style={{ padding: '12px 14px 80px' }}>
        {loading && <p style={{ textAlign: 'center', fontSize: 13, color: '#888', padding: '30px 0' }}>Chargement...</p>}

        {!loading && chants.length === 0 && (
          <div style={{ background: '#fff', borderRadius: 16, border: '0.5px solid #e5e5e0', padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🎵</div>
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
              {/* Numéro */}
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#085041' }}>{c.ordre || i + 1}</span>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.titre}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                  {c.artiste && <span style={{ fontSize: 10, color: '#888' }}>{c.artiste}</span>}
                  {c.lien_audio && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 9, color: '#085041', background: '#E1F5EE', borderRadius: 20, padding: '1px 6px' }}>
                      <svg style={{ width: 9, height: 9 }} fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                      Audio
                    </span>
                  )}
                  {c.paroles && (
                    <span style={{ fontSize: 9, color: '#534AB7', background: '#EEEDFE', borderRadius: 20, padding: '1px 6px' }}>
                      Paroles
                    </span>
                  )}
                </div>
              </div>

              <svg style={{ width: 16, height: 16, color: '#ccc', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom nav */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: 480, margin: '0 auto', background: '#fff', borderTop: '0.5px solid #e5e5e0', display: 'flex', zIndex: 30 }}>
        {[
          { label: 'Accueil', path: '/', icon: <svg style={{ width: 20, height: 20 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" /></svg> },
          { label: 'Planning', path: '/programme', icon: <svg style={{ width: 20, height: 20 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
          { label: 'Chants', path: '/chants', active: true, icon: <svg style={{ width: 20, height: 20 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg> },
          { label: "S'inscrire", path: '/inscription', icon: <svg style={{ width: 20, height: 20 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
        ].map(item => (
          <button key={item.label} onClick={() => navigate(item.path)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0 10px', color: item.active ? '#085041' : '#888780', background: 'none', border: 'none', cursor: 'pointer' }}>
            {item.icon}
            <span style={{ fontSize: 10, marginTop: 2, fontWeight: item.active ? 500 : 400 }}>{item.label}</span>
          </button>
        ))}
        <button onClick={() => navigate('/')}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0 10px', color: '#888780', background: 'none', border: 'none', cursor: 'pointer' }}>
          <svg style={{ width: 20, height: 20 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
          <span style={{ fontSize: 10, marginTop: 2 }}>Plus</span>
        </button>
      </nav>
    </div>
  )
}
