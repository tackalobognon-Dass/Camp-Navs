import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

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
    if (!a) return
    const rect = e.currentTarget.getBoundingClientRect()
    a.currentTime = ((e.clientX - rect.left) / rect.width) * duration
  }

  function fmt(s) {
    if (!s || isNaN(s)) return '0:00'
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
  }

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div style={{ background: 'linear-gradient(135deg,#054035,#085041,#0F6E56)', borderRadius: 16, padding: 16, marginBottom: 14 }}>
      <audio ref={audioRef} src={url}
        onTimeUpdate={e => setCurrentTime(e.target.currentTime)}
        onLoadedMetadata={e => setDuration(e.target.duration)}
        onEnded={() => setPlaying(false)} />

      {/* Ondes animées */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, height: 32, marginBottom: 14 }}>
        {[8, 18, 24, 14, 28, 18, 22, 12, 26, 16, 20, 10].map((h, i) => (
          <div key={i} style={{
            width: 3, borderRadius: 2,
            background: playing ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)',
            height: h,
            animation: playing ? `wave 1s ease-in-out ${i * 0.08}s infinite` : 'none',
            transition: 'background .3s',
          }} />
        ))}
      </div>
      <style>{`@keyframes wave{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.35)}}`}</style>

      {/* Barre de progression */}
      <div onClick={handleSeek} style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 10, height: 4, position: 'relative', cursor: 'pointer', marginBottom: 6 }}>
        <div style={{ background: '#fff', borderRadius: 10, height: 4, width: `${pct}%`, transition: 'width .1s linear' }} />
        <div style={{ position: 'absolute', top: -5, left: `${pct}%`, transform: 'translateX(-50%)', width: 14, height: 14, background: '#fff', borderRadius: '50%', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'rgba(255,255,255,0.6)', marginBottom: 16 }}>
        <span>{fmt(currentTime)}</span><span>{fmt(duration)}</span>
      </div>

      {/* Contrôles */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
        {[
          { icon: 'ti-player-skip-back', onClick: () => skip(-10), label: '-10s' },
          { icon: 'ti-player-track-prev', onClick: () => skip(-30), label: 'Précédent' },
        ].map(b => (
          <button key={b.icon} onClick={b.onClick} aria-label={b.label}
            style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <i className={`ti ${b.icon}`} style={{ fontSize: 16 }} aria-hidden="true" />
          </button>
        ))}

        {/* Bouton Play/Pause principal */}
        <button onClick={togglePlay} aria-label={playing ? 'Pause' : 'Lecture'}
          style={{ width: 54, height: 54, borderRadius: '50%', background: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(0,0,0,0.2)' }}>
          <i className={`ti ${playing ? 'ti-player-pause' : 'ti-player-play'}`} style={{ fontSize: 22, color: '#085041', marginLeft: playing ? 0 : 2 }} aria-hidden="true" />
        </button>

        {[
          { icon: 'ti-player-track-next', onClick: () => skip(30), label: 'Suivant' },
          { icon: 'ti-player-skip-forward', onClick: () => skip(10), label: '+10s' },
        ].map(b => (
          <button key={b.icon} onClick={b.onClick} aria-label={b.label}
            style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <i className={`ti ${b.icon}`} style={{ fontSize: 16 }} aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  )
}

function ChantDetail({ chant, onBack }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f8f8f6', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ background: 'linear-gradient(160deg,#054035,#085041)', padding: '44px 16px 20px' }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#9FE1CB', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 14 }}>
          <i className="ti ti-arrow-left" style={{ fontSize: 14 }} aria-hidden="true" /> Retour
        </button>
        <div style={{ fontSize: 18, fontWeight: 500, color: '#fff', marginBottom: 3 }}>{chant.titre}</div>
        {chant.artiste && <div style={{ fontSize: 11, color: '#9FE1CB' }}>{chant.artiste}</div>}
      </div>

      <div style={{ padding: '16px 16px 80px' }}>
        {chant.lien_audio ? (
          <AudioPlayer url={chant.lien_audio} />
        ) : (
          <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #e5e5e0', padding: 16, textAlign: 'center', marginBottom: 14 }}>
            <p style={{ fontSize: 12, color: '#888' }}>Aucun audio disponible.</p>
          </div>
        )}

        {chant.paroles ? (
          <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #e5e5e0', overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', borderBottom: '0.5px solid #e5e5e0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 9, fontWeight: 500, color: '#085041', letterSpacing: '0.06em' }}>PAROLES</span>
              <i className="ti ti-music" style={{ fontSize: 14, color: '#085041' }} aria-hidden="true" />
            </div>
            <div style={{ padding: '12px 14px' }}>
              <div style={{ fontSize: 13, color: '#1a1a1a', lineHeight: 2, whiteSpace: 'pre-wrap' }}>{chant.paroles}</div>
            </div>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #e5e5e0', padding: 20, textAlign: 'center' }}>
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
    supabase.from('chants').select('*').order('ordre', { ascending: true })
      .then(({ data }) => { setChants(data || []); setLoading(false) })
  }, [])

  const filtres = chants.filter(c =>
    c.titre.toLowerCase().includes(recherche.toLowerCase()) ||
    (c.artiste && c.artiste.toLowerCase().includes(recherche.toLowerCase()))
  )

  if (chantSelectionne) return <ChantDetail chant={chantSelectionne} onBack={() => setChantSelectionne(null)} />

  return (
    <div style={{ minHeight: '100vh', background: '#f8f8f6', maxWidth: 480, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(160deg,#054035,#085041)', padding: '44px 16px 16px' }}>
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#9FE1CB', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 10 }}>
          <i className="ti ti-arrow-left" style={{ fontSize: 14 }} aria-hidden="true" /> Retour
        </button>
        <div style={{ fontSize: 18, fontWeight: 500, color: '#fff', marginBottom: 2 }}>Chants du camp</div>
        <div style={{ fontSize: 10, color: '#9FE1CB', marginBottom: 14 }}>{chants.length} chant(s) dans le répertoire</div>

        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="ti ti-search" style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', flexShrink: 0 }} aria-hidden="true" />
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
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#085041' }}>{c.ordre || i + 1}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.titre}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3, flexWrap: 'wrap' }}>
                  {c.artiste && <span style={{ fontSize: 10, color: '#888' }}>{c.artiste}</span>}
                  {c.lien_audio && <span style={{ fontSize: 9, color: '#085041', background: '#E1F5EE', borderRadius: 20, padding: '1px 6px' }}>Audio</span>}
                  {c.paroles && <span style={{ fontSize: 9, color: '#534AB7', background: '#EEEDFE', borderRadius: 20, padding: '1px 6px' }}>Paroles</span>}
                </div>
              </div>
              <i className="ti ti-chevron-right" style={{ fontSize: 16, color: '#ccc', flexShrink: 0 }} aria-hidden="true" />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom nav */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: 480, margin: '0 auto', background: '#fff', borderTop: '0.5px solid #e5e5e0', display: 'flex', zIndex: 30 }}>
        {[
          { label: 'Accueil', path: '/', icon: 'ti-home' },
          { label: 'Planning', path: '/programme', icon: 'ti-calendar' },
          { label: 'Chants', path: '/chants', icon: 'ti-music', active: true },
          { label: "S'inscrire", path: '/inscription', icon: 'ti-user-plus' },
        ].map(item => (
          <button key={item.label} onClick={() => navigate(item.path)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0 10px', color: item.active ? '#085041' : '#888780', background: 'none', border: 'none', cursor: 'pointer' }}>
            <i className={`ti ${item.icon}`} style={{ fontSize: 20 }} aria-hidden="true" />
            <span style={{ fontSize: 10, marginTop: 2, fontWeight: item.active ? 500 : 400 }}>{item.label}</span>
          </button>
        ))}
        <button onClick={() => navigate('/')}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0 10px', color: '#888780', background: 'none', border: 'none', cursor: 'pointer' }}>
          <i className="ti ti-dots" style={{ fontSize: 20 }} aria-hidden="true" />
          <span style={{ fontSize: 10, marginTop: 2 }}>Plus</span>
        </button>
      </nav>
    </div>
  )
}
