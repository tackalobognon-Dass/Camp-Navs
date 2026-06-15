import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { parseLRC, getCurrentIdx, getOpacity, isSection, sectionLabel, sectionColor } from './lrcUtils'

const BG = '#0A0F1E'

function fmt(s) {
  if (!s || isNaN(s)) return '0:00'
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

// Paroles classiques sans LRC
function isRefrain(l) { return /^(R:|Refrain|REFRAIN|Chorus)/i.test(l.trim()) }
function isBridge(l)  { return /^(Bridge|Pont)/i.test(l.trim()) }

function renderParoles(texte, taille) {
  if (!texte) return null
  const fs = 16 + taille * 2
  let vNum = 0
  return texte.split(/\n\n+/).map((bloc, bi) => {
    const lignes = bloc.split('\n').filter(l => l.trim())
    if (!lignes.length) return null
    const ref = isRefrain(lignes[0]), bridge = isBridge(lignes[0])
    if (!ref && !bridge) vNum++
    const label  = ref ? 'Refrain' : bridge ? 'Pont' : `Couplet ${vNum}`
    const lColor = ref ? '#FCD34D' : bridge ? '#A78BFA' : 'rgba(255,255,255,0.3)'
    const show = lignes.filter((_, i) => !(i === 0 && (ref || bridge)))
    return (
      <div key={bi} style={{ marginBottom: 36 }}>
        <p style={{ fontSize: 9, fontWeight: 700, color: lColor, letterSpacing: '0.14em', textTransform: 'uppercase', textAlign: 'center', margin: '0 0 14px' }}>{label}</p>
        {show.map((ligne, li) => (
          <p key={li} style={{ fontSize: fs, lineHeight: 1.9, textAlign: 'center', margin: '0 0 2px', color: ref ? 'rgba(252,211,77,0.9)' : '#fff', fontWeight: ref ? 600 : 400, fontStyle: ref ? 'italic' : 'normal', opacity: 0.88 }}>
            {ligne.replace(/^(R:|Refrain\s*:?|REFRAIN\s*:?|Chorus\s*:?|Bridge\s*:?|Pont\s*:?)\s*/i, '') || ligne}
          </p>
        ))}
      </div>
    )
  })
}

export default function ChantDetail({ chant, palette, onBack }) {
  const audioRef   = useRef(null)
  const headerRef  = useRef(null)
  const lineRefs   = useRef([])

  const [playing, setPlaying]     = useState(false)
  const [currentTime, setCT]      = useState(0)
  const [duration, setDur]        = useState(0)
  const [headerH, setHeaderH]     = useState(0)
  const [autoScroll, setAutoScroll] = useState(true)
  const [taille, setTaille]       = useState(0)
  const [dragging, setDragging]   = useState(false)

  const lrcLines   = useMemo(() => parseLRC(chant.paroles_lrc), [chant.paroles_lrc])
  const hasLRC     = lrcLines.length > 0
  const hasAudio   = !!chant.lien_audio
  const currentIdx = useMemo(() => getCurrentIdx(lrcLines, currentTime), [lrcLines, currentTime])
  const pct        = duration > 0 ? (currentTime / duration) * 100 : 0

  // Mesurer header
  useEffect(() => {
    const measure = () => { if (headerRef.current) setHeaderH(headerRef.current.offsetHeight) }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [playing, hasAudio])

  // Historique retour
  useEffect(() => {
    window.history.pushState(null, '', window.location.href)
    const h = () => onBack()
    window.addEventListener('popstate', h)
    return () => window.removeEventListener('popstate', h)
  }, [onBack])

  // Auto-scroll vers la ligne courante
  useEffect(() => {
    if (!autoScroll || !playing || currentIdx < 0 || dragging) return
    const ref = lineRefs.current[currentIdx]
    if (ref) ref.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [currentIdx, autoScroll, playing, dragging])

  const togglePlay = useCallback(() => {
    const a = audioRef.current; if (!a) return
    if (playing) { a.pause(); setPlaying(false) }
    else         { a.play().catch(() => {}); setPlaying(true) }
  }, [playing])

  const skip = useCallback((s) => {
    const a = audioRef.current; if (!a) return
    a.currentTime = Math.max(0, Math.min(a.currentTime + s, duration))
  }, [duration])

  // Seek sur la barre de progression
  function handleSeek(e) {
    const a = audioRef.current; if (!a || !duration) return
    const r = e.currentTarget.getBoundingClientRect()
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left
    a.currentTime = Math.max(0, Math.min((x / r.width) * duration, duration))
  }

  const fs = 17 + taille * 2

  // Couleur d'accentuation extraite de la palette
  const accentColor = palette.grad.includes('054035') ? '#10B981'
    : palette.grad.includes('1D4ED8') ? '#60A5FA'
    : palette.grad.includes('6D28D9') ? '#A78BFA'
    : palette.grad.includes('B45309') ? '#FCD34D'
    : '#fff'

  return (
    <div style={{ minHeight: '100vh', background: BG, maxWidth: 480, margin: '0 auto', overflowX: 'hidden' }}>
      <style>{`
        @keyframes wave    { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(.15)} }
        @keyframes rotate  { to{transform:rotate(360deg)} }
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes glow    { 0%,100%{opacity:.6} 50%{opacity:1} }
        * { -webkit-tap-highlight-color: transparent }
        input[type=range] { -webkit-appearance: none; background: transparent }
      `}</style>

      {/* ── Header fixe ── */}
      <div ref={headerRef} style={{
        position: 'fixed', top: 0, left: 0, right: 0, maxWidth: 480, margin: '0 auto',
        background: `linear-gradient(180deg, ${BG} 0%, rgba(10,15,30,0.97) 100%)`,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        zIndex: 20, paddingBottom: 16,
        backdropFilter: 'blur(20px)',
      }}>
        <div style={{ padding: '44px 16px 0' }}>

          {/* Retour */}
          <button type="button" onClick={onBack}
            style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.5)', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 18 }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5M12 19l-7-7 7-7"/></svg>
            Retour
          </button>

          {/* Pochette + titre */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
            {/* Pochette animée type vinyle */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: palette.grad,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 0 24px ${palette.glow}`,
                animation: playing ? 'rotate 4s linear infinite' : 'none',
                transition: 'box-shadow .4s',
              }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />
                </div>
              </div>
              {/* Halo pulsant quand lecture */}
              {playing && (
                <div style={{
                  position: 'absolute', inset: -4, borderRadius: '50%',
                  border: `1.5px solid ${accentColor}`,
                  animation: 'glow 2s ease infinite',
                  pointerEvents: 'none',
                }} />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: '0 0 4px', lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chant.titre}</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 }}>{chant.artiste || 'Chant de camp · Navs 2026'}</p>
            </div>
          </div>

          {/* ── Player ── */}
          {hasAudio ? (
            <>
              <audio ref={audioRef} src={chant.lien_audio} preload="metadata"
                onTimeUpdate={e => setCT(e.target.currentTime)}
                onLoadedMetadata={e => setDur(e.target.duration)}
                onEnded={() => setPlaying(false)} />

              {/* Ondes animées */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, height: 32, marginBottom: 14 }}>
                {[4,8,14,6,20,10,24,8,18,14,22,6,16,10,4,18,12,8,20,6].map((h, i) => (
                  <div key={i} style={{
                    width: 2.5, borderRadius: 3,
                    background: playing ? accentColor : 'rgba(255,255,255,0.15)',
                    height: h,
                    animation: playing ? `wave 1.2s ease-in-out ${(i * 0.07).toFixed(2)}s infinite` : 'none',
                    transition: 'background .4s',
                    opacity: playing ? 1 : 0.6,
                  }} />
                ))}
              </div>

              {/* Barre de progression tactile */}
              <div
                onMouseDown={handleSeek} onTouchStart={handleSeek}
                onTouchMove={e => { setDragging(true); handleSeek(e) }}
                onTouchEnd={() => setDragging(false)}
                style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 10, height: 4, cursor: 'pointer', marginBottom: 6, position: 'relative', userSelect: 'none' }}>
                {/* Track coloré */}
                <div style={{ background: accentColor, borderRadius: 10, height: 4, width: `${pct}%`, transition: dragging ? 'none' : 'width .1s' }} />
                {/* Curseur */}
                <div style={{
                  position: 'absolute', top: '50%', left: `${pct}%`,
                  transform: 'translate(-50%,-50%)',
                  width: 14, height: 14, background: '#fff', borderRadius: '50%',
                  boxShadow: `0 0 8px ${accentColor}`,
                  transition: dragging ? 'none' : 'left .1s',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 16 }}>
                <span>{fmt(currentTime)}</span><span>{fmt(duration)}</span>
              </div>

              {/* Contrôles */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
                <button type="button" onClick={() => skip(-15)} title="-15s"
                  style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" viewBox="0 0 24 24"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 .49-3.18"/></svg>
                  <span style={{ fontSize: 7, opacity: 0.6 }}>15s</span>
                </button>

                <button type="button" onClick={togglePlay}
                  style={{
                    width: 62, height: 62, borderRadius: '50%',
                    background: palette.grad,
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: `0 0 20px ${palette.glow}, 0 4px 16px rgba(0,0,0,0.4)`,
                    transition: 'box-shadow .3s, transform .1s',
                    transform: 'scale(1)',
                  }}
                  onTouchStart={e => e.currentTarget.style.transform = 'scale(0.94)'}
                  onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}>
                  {playing
                    ? <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                    : <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff" style={{ marginLeft: 2 }}><path d="M8 5v14l11-7z"/></svg>
                  }
                </button>

                <button type="button" onClick={() => skip(15)} title="+15s"
                  style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" viewBox="0 0 24 24"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-.49-3.18"/></svg>
                  <span style={{ fontSize: 7, opacity: 0.6 }}>15s</span>
                </button>
              </div>
            </>
          ) : (
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 12, textAlign: 'center' }}>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: 0 }}>Pas d'audio disponible</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Zone paroles ── */}
      <div style={{ paddingTop: headerH || 300, paddingBottom: 40 }}
        onTouchStart={() => setAutoScroll(false)}>

        {/* Barre outils */}
        <div style={{
          position: 'sticky', top: headerH, zIndex: 10,
          background: BG, padding: '10px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            {hasLRC && (
              <button type="button" onClick={() => setAutoScroll(a => !a)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  fontSize: 11, fontWeight: 600,
                  color: autoScroll ? accentColor : 'rgba(255,255,255,0.3)',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid ${autoScroll ? accentColor + '40' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 20, padding: '5px 12px', cursor: 'pointer', transition: 'all .2s',
                }}>
                {autoScroll ? '⏩' : '⏸'} {autoScroll ? 'Défilement auto' : 'Manuel'}
              </button>
            )}
            {!hasLRC && chant.paroles && (
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>Paroles</span>
            )}
          </div>
          {/* Taille texte */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: '4px 10px' }}>
            <button type="button" onClick={() => setTaille(t => Math.max(-1, t - 1))}
              style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', width: 12, textAlign: 'center' }}>A</span>
            <button type="button" onClick={() => setTaille(t => Math.min(2, t + 1))}
              style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
          </div>
        </div>

        {/* Paroles LRC synchronisées */}
        {hasLRC && (
          <div style={{ padding: '28px 24px 80px' }}>
            {lrcLines.map((line, i) => {
              const active = i === currentIdx
              const op     = playing || currentIdx >= 0 ? getOpacity(i, currentIdx) : 0.6

              if (isSection(line.text)) {
                const sc = sectionColor(sectionLabel(line.text))
                return (
                  <div key={i} ref={el => lineRefs.current[i] = el}
                    style={{ textAlign: 'center', padding: '22px 0 10px', opacity: op, transition: 'opacity .5s' }}>
                    <span style={{
                      fontSize: 9, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase',
                      color: sc.color, background: sc.bg,
                      borderRadius: 20, padding: '5px 16px',
                      border: `1px solid ${sc.color}40`,
                    }}>
                      {sectionLabel(line.text)}
                    </span>
                  </div>
                )
              }

              return (
                <div key={i} ref={el => lineRefs.current[i] = el}
                  onClick={() => { if (audioRef.current) audioRef.current.currentTime = line.time }}
                  style={{
                    textAlign: 'center',
                    padding: `${active ? 14 : 6}px 0`,
                    cursor: 'pointer',
                    opacity: op,
                    transition: 'all .4s cubic-bezier(0.4,0,0.2,1)',
                  }}>
                  <p style={{
                    fontSize: active ? fs + 4 : fs - 1,
                    fontWeight: active ? 700 : 400,
                    color: active ? '#fff' : 'rgba(255,255,255,0.85)',
                    margin: 0, lineHeight: 1.65,
                    transition: 'all .4s cubic-bezier(0.4,0,0.2,1)',
                    textShadow: active ? `0 0 30px ${accentColor}80` : 'none',
                    letterSpacing: active ? '-0.01em' : 'normal',
                  }}>
                    {line.text}
                  </p>
                  {/* Soulignement de la ligne active */}
                  {active && (
                    <div style={{
                      height: 2, background: accentColor,
                      borderRadius: 2, margin: '6px auto 0',
                      width: '40%', opacity: 0.7,
                    }} />
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Paroles classiques */}
        {!hasLRC && chant.paroles && (
          <div style={{ padding: '32px 24px 80px', animation: 'fadeIn .5s ease' }}>
            {renderParoles(chant.paroles, taille)}
          </div>
        )}

        {/* Aucun contenu */}
        {!hasLRC && !chant.paroles && (
          <div style={{ textAlign: 'center', padding: '80px 20px', animation: 'fadeIn .5s ease' }}>
            <p style={{ fontSize: 40, margin: '0 0 16px' }}>🎵</p>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Paroles non disponibles</p>
          </div>
        )}
      </div>
    </div>
  )
}
