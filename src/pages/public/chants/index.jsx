import { useEffect, useState, useMemo, useCallback, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import BottomNav from '../../../components/public/BottomNav'
import ChantDetail from './ChantDetail'

const PALETTES = [
  { grad: 'linear-gradient(135deg,#054035,#0A6B50)', glow: 'rgba(5,64,53,0.5)'   },
  { grad: 'linear-gradient(135deg,#1D4ED8,#3B82F6)', glow: 'rgba(29,78,216,0.5)' },
  { grad: 'linear-gradient(135deg,#6D28D9,#8B5CF6)', glow: 'rgba(109,40,217,0.5)'},
  { grad: 'linear-gradient(135deg,#B45309,#F59E0B)', glow: 'rgba(180,83,9,0.5)'  },
  { grad: 'linear-gradient(135deg,#065F46,#10B981)', glow: 'rgba(6,95,70,0.5)'   },
  { grad: 'linear-gradient(135deg,#9F1239,#F43F5E)', glow: 'rgba(159,18,57,0.5)' },
  { grad: 'linear-gradient(135deg,#0E7490,#06B6D4)', glow: 'rgba(14,116,144,0.5)'},
  { grad: 'linear-gradient(135deg,#7C3AED,#C084FC)', glow: 'rgba(124,58,237,0.5)'},
]

const NoteIcon = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
  </svg>
)

// Carte chant mémorisée pour éviter les re-renders inutiles
const ChantCard = memo(({ chant, index, palette, onClick }) => {
  const hasSync = !!chant.paroles_lrc

  return (
    <div onClick={() => onClick(chant)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '11px 14px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16,
        cursor: 'pointer',
        transition: 'all .18s ease',
        WebkitTapHighlightColor: 'transparent',
      }}
      onTouchStart={e => e.currentTarget.style.background = 'rgba(255,255,255,0.09)'}
      onTouchEnd={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
    >
      {/* Icône avec glow */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: palette.grad,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 4px 16px ${palette.glow}`,
        }}>
          <NoteIcon />
        </div>
        {/* Numéro de piste */}
        <div style={{
          position: 'absolute', top: -4, right: -4,
          width: 16, height: 16, borderRadius: '50%',
          background: '#0A0F1E', border: '1px solid rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>{index + 1}</span>
        </div>
      </div>

      {/* Infos */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 14, fontWeight: 600, color: '#fff',
          margin: '0 0 3px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{chant.titre}</p>
        <p style={{
          fontSize: 11, color: 'rgba(255,255,255,0.4)',
          margin: '0 0 6px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{chant.artiste || 'Chant de camp'}</p>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {chant.lien_audio && (
            <span style={{ fontSize: 9, fontWeight: 700, color: '#60A5FA', background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.25)', borderRadius: 20, padding: '2px 8px' }}>
              🎵 Audio
            </span>
          )}
          {hasSync && (
            <span style={{ fontSize: 9, fontWeight: 700, color: '#FCD34D', background: 'rgba(252,211,77,0.12)', border: '1px solid rgba(252,211,77,0.25)', borderRadius: 20, padding: '2px 8px' }}>
              ✨ Sync
            </span>
          )}
          {chant.paroles && !hasSync && (
            <span style={{ fontSize: 9, fontWeight: 700, color: '#A78BFA', background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)', borderRadius: 20, padding: '2px 8px' }}>
              📄 Paroles
            </span>
          )}
        </div>
      </div>

      {/* Flèche */}
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" style={{ flexShrink: 0 }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6"/>
      </svg>
    </div>
  )
})

export default function ChantsListPage() {
  const navigate = useNavigate()
  const [chants, setChants] = useState([])
  const [loading, setLoading] = useState(true)
  const [recherche, setRecherche] = useState('')
  const [filtre, setFiltre] = useState('tous')
  const [chantSel, setChantSel] = useState(null)

  useEffect(() => {
    supabase.from('chants').select('*').order('ordre', { ascending: true })
      .then(({ data }) => { setChants(data || []); setLoading(false) })
  }, [])

  // Mémoïsation des stats
  const stats = useMemo(() => ({
    total:    chants.length,
    audio:    chants.filter(c => c.lien_audio).length,
    paroles:  chants.filter(c => c.paroles || c.paroles_lrc).length,
    sync:     chants.filter(c => c.paroles_lrc).length,
  }), [chants])

  // Mémoïsation du filtrage
  const filtres = useMemo(() => {
    return chants
      .filter(c => {
        if (filtre === 'audio')   return !!c.lien_audio
        if (filtre === 'paroles') return !!(c.paroles || c.paroles_lrc)
        if (filtre === 'sync')    return !!c.paroles_lrc
        return true
      })
      .filter(c => {
        if (!recherche) return true
        const q = recherche.toLowerCase()
        return c.titre.toLowerCase().includes(q) || (c.artiste || '').toLowerCase().includes(q)
      })
  }, [chants, filtre, recherche])

  const handleSelect = useCallback((chant) => setChantSel(chant), [])
  const handleBack   = useCallback(() => setChantSel(null), [])

  if (chantSel) {
    const idx = chants.findIndex(c => c.id === chantSel.id)
    return <ChantDetail chant={chantSel} palette={PALETTES[idx % PALETTES.length]} onBack={handleBack} />
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0F1E', maxWidth: 480, margin: '0 auto' }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to { transform: rotate(360deg) } }
        ::-webkit-scrollbar { display: none }
      `}</style>

      {/* ── Header ── */}
      <div style={{ padding: '50px 16px 16px', background: 'linear-gradient(180deg, rgba(5,64,53,0.3) 0%, transparent 100%)' }}>
        <button type="button" onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.5)', fontSize: 11, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 16 }}>
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 19l-7-7 7-7"/></svg>
          Retour
        </button>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: '0 0 4px', letterSpacing: -0.5 }}>
              Chants
            </p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
              {stats.total} titres · {stats.audio} audio · {stats.sync} sync
            </p>
          </div>
          <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg,#054035,#0A6B50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/>
            </svg>
          </div>
        </div>

        {/* Recherche */}
        <div style={{ position: 'relative', marginBottom: 14 }}>
          <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input type="text" value={recherche} onChange={e => setRecherche(e.target.value)}
            placeholder="Rechercher un titre, un artiste..."
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 14, padding: '12px 14px 12px 40px',
              fontSize: 13, color: '#fff', outline: 'none',
            }} />
          {recherche && (
            <button type="button" onClick={() => setRecherche('')}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: 16, lineHeight: 1 }}>
              ✕
            </button>
          )}
        </div>

        {/* Filtres pills */}
        <div style={{ display: 'flex', gap: 7, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {[
            { key: 'tous',    label: 'Tous',             count: stats.total   },
            { key: 'audio',   label: '🎵 Audio',         count: stats.audio   },
            { key: 'paroles', label: '📄 Paroles',       count: stats.paroles },
            { key: 'sync',    label: '✨ Synchronisés',  count: stats.sync    },
          ].map(f => (
            <button key={f.key} type="button" onClick={() => setFiltre(f.key)}
              style={{
                flexShrink: 0, padding: '6px 14px', borderRadius: 20,
                fontSize: 11, fontWeight: filtre === f.key ? 700 : 500,
                cursor: 'pointer', transition: 'all .2s',
                background: filtre === f.key ? '#fff' : 'rgba(255,255,255,0.06)',
                color:      filtre === f.key ? '#0A0F1E' : 'rgba(255,255,255,0.6)',
                border: `1px solid ${filtre === f.key ? '#fff' : 'rgba(255,255,255,0.1)'}`,
              }}>
              {f.label} <span style={{ opacity: 0.6 }}>({f.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Liste ── */}
      <div style={{ padding: '8px 14px 90px' }}>
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#fff', animation: 'spin .8s linear infinite' }} />
          </div>
        )}

        {!loading && chants.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>🎵</div>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>Aucun chant disponible</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Le répertoire sera publié prochainement.</p>
          </div>
        )}

        {!loading && recherche && filtres.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Aucun résultat pour « {recherche} »</p>
          </div>
        )}

        {recherche && filtres.length > 0 && (
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: '0 0 10px' }}>{filtres.length} résultat(s)</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtres.map((c) => {
            const idx = chants.findIndex(ch => ch.id === c.id)
            return (
              <div key={c.id} style={{ animation: `fadeUp .3s ease both` }}>
                <ChantCard chant={c} index={idx} palette={PALETTES[idx % PALETTES.length]} onClick={handleSelect} />
              </div>
            )
          })}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
