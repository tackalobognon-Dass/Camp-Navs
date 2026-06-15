import { useEffect, useRef, useState } from 'react'
import { parseLRC, getCurrentIdx, getOpacity, isSection, sectionLabel, sectionColor } from './lrcUtils'

// Rendu paroles classiques (sans LRC)
function isRefrain(l) { return /^(R:|Refrain|REFRAIN|Chorus)/i.test(l.trim()) }
function isBridge(l)  { return /^(Bridge|Pont)/i.test(l.trim()) }
function renderParoles(texte, taille) {
  if (!texte) return null
  const fs = 15 + taille * 2
  let vNum = 0
  return texte.split(/\n\n+/).map((bloc, bi) => {
    const lignes = bloc.split('\n').filter(l => l.trim())
    if (!lignes.length) return null
    const ref = isRefrain(lignes[0]), bridge = isBridge(lignes[0])
    if (!ref && !bridge) vNum++
    const label = ref ? 'Refrain' : bridge ? 'Pont' : `Couplet ${vNum}`
    const lColor = ref ? '#C9A84C' : bridge ? '#6D28D9' : '#94A3B8'
    const lBg    = ref ? 'rgba(201,168,76,0.08)' : bridge ? 'rgba(109,40,217,0.05)' : 'transparent'
    const lBord  = ref ? '#C9A84C' : bridge ? '#8B5CF6' : 'transparent'
    const show = lignes.filter((_, i) => !(i === 0 && (ref || bridge)))
    return (
      <div key={bi} style={{ marginBottom: 28, borderLeft: `3px solid ${lBord}`, paddingLeft: ref || bridge ? 14 : 0, background: lBg, borderRadius: ref || bridge ? '0 12px 12px 0' : 0, padding: ref || bridge ? '12px 14px 12px 16px' : 0 }}>
        <p style={{ fontSize: 9, fontWeight: 700, color: lColor, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 10px' }}>{label}</p>
        {show.map((ligne, li) => (
          <p key={li} style={{ fontSize: fs, lineHeight: 1.9, textAlign: 'center', margin: '0 0 2px', color: ref ? '#054035' : '#1E293B', fontWeight: ref ? 600 : 400, fontStyle: ref ? 'italic' : 'normal' }}>
            {ligne.replace(/^(R:|Refrain\s*:?|REFRAIN\s*:?|Chorus\s*:?|Bridge\s*:?|Pont\s*:?)\s*/i, '') || ligne}
          </p>
        ))}
      </div>
    )
  })
}

const IconArrow = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
const IconPlay  = () => <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
const IconPause = () => <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
const IconBack  = () => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 .49-3.18"/></svg>
const IconFwd   = () => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-.49-3.18"/></svg>

function fmt(s) {
  if (!s || isNaN(s)) return '0:00'
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

export default function ChantDetail({ chant, onBack, couleur }) {
  const audioRef    = useRef(null)
  const headerRef   = useRef(null)
  const lyricsRef   = useRef(null)
  const lineRefs    = useRef([])

  const [playing, setPlaying]       = useState(false)
  const [currentTime, setCT]        = useState(0)
  const [duration, setDur]          = useState(0)
  const [headerH, setHeaderH]       = useState(280)
  const [autoScroll, setAutoScroll] = useState(true)
  const [taille, setTaille]         = useState(0)

  const lrcLines   = parseLRC(chant.paroles_lrc)
  const hasLRC     = lrcLines.length > 0
  const currentIdx = getCurrentIdx(lrcLines, currentTime)
  const hasAudio   = !!chant.lien_audio

  // Mesurer le header
  useEffect(() => {
    if (headerRef.current) setHeaderH(headerRef.current.offsetHeight)
  })

  // Historique retour
  useEffect(() => {
    window.history.pushState(null, '', window.location.href)
    const h = () => onBack()
    window.addEventListener('popstate', h)
    return () => window.removeEventListener('popstate', h)
  }, [onBack])

  // Auto-scroll vers la ligne courante
  useEffect(() => {
    if (!autoScroll || !playing || currentIdx < 0) return
    const ref = lineRefs.current[currentIdx]
    if (ref) ref.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [currentIdx, autoScroll, playing])

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

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0
  const fs  = 17 + taille * 2

  return (
    <div style={{ minHeight: '100vh', background: '#0D1117', maxWidth: 480, margin: '0 auto' }}>
      <style>{`
        @keyframes wave { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(.2)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
      `}</style>

      {/* ── Header fixe ── */}
      <div ref={headerRef} style={{ position: 'fixed', top: 0, left: 0, right: 0, maxWidth: 480, margin: '0 auto', background: couleur.grad, zIndex: 20, paddingBottom: 16 }}>
        <div style={{ padding: '44px 16px 0' }}>
          <button type="button" onClick={onBack}
            style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.6)', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 16 }}>
            <IconArrow /> Retour
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: '3px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'rgba(255,255,255,0.9)' }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(0,0,0,0.3)', margin: '4.5px auto' }} />
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 17, fontWeight: 700, color: '#fff', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chant.titre}</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', margin: 0 }}>{chant.artiste || 'Chant de camp · Navs 2026'}</p>
            </div>
          </div>
        </div>

        {hasAudio ? (
          <div style={{ padding: '0 16px' }}>
            <audio ref={audioRef} src={chant.lien_audio}
              onTimeUpdate={e => setCT(e.target.currentTime)}
              onLoadedMetadata={e => setDur(e.target.duration)}
              onEnded={() => setPlaying(false)} />
            {/* Ondes */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, height: 28, marginBottom: 12 }}>
              {[5,10,18,8,22,14,26,10,20,16,24,8,18,12,6,20,14].map((h, i) => (
                <div key={i} style={{ width: 3, borderRadius: 3, background: playing ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.2)', height: h, animation: playing ? `wave 1.1s ease-in-out ${(i*0.07).toFixed(2)}s infinite` : 'none', transition: 'background .3s' }} />
              ))}
            </div>
            {/* Barre */}
            <div onClick={handleSeek} style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 10, height: 4, cursor: 'pointer', marginBottom: 6, position: 'relative' }}>
              <div style={{ background: '#fff', borderRadius: 10, height: 4, width: `${pct}%`, transition: 'width .1s' }} />
              <div style={{ position: 'absolute', top: -5, left: `${pct}%`, transform: 'translateX(-50%)', width: 14, height: 14, background: '#fff', borderRadius: '50%', boxShadow: '0 1px 6px rgba(0,0,0,0.3)', transition: 'left .1s' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>
              <span>{fmt(currentTime)}</span><span>{fmt(duration)}</span>
            </div>
            {/* Contrôles */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
              <button type="button" onClick={() => skip(-15)}
                style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <IconBack /><span style={{ fontSize: 7, opacity: 0.7 }}>15s</span>
              </button>
              <button type="button" onClick={togglePlay}
                style={{ width: 58, height: 58, borderRadius: '50%', background: '#fff', border: 'none', color: '#054035', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.25)' }}>
                {playing ? <IconPause /> : <IconPlay />}
              </button>
              <button type="button" onClick={() => skip(15)}
                style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <IconFwd /><span style={{ fontSize: 7, opacity: 0.7 }}>15s</span>
              </button>
            </div>
          </div>
        ) : (
          <div style={{ margin: '0 16px', background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 10, textAlign: 'center' }}>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: 0 }}>Pas d'audio disponible</p>
          </div>
        )}
      </div>

      {/* ── Zone paroles ── */}
      <div ref={lyricsRef} style={{ paddingTop: headerH, paddingBottom: 60, minHeight: '100vh' }}
        onTouchStart={() => setAutoScroll(false)}>

        {/* Barre outils paroles */}
        <div style={{ position: 'sticky', top: headerH, background: '#0D1117', zIndex: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {hasLRC && (
              <button type="button" onClick={() => setAutoScroll(a => !a)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: autoScroll ? '#C9A84C' : 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.06)', border: `1px solid ${autoScroll ? '#C9A84C40' : 'rgba(255,255,255,0.08)'}`, borderRadius: 20, padding: '4px 12px', cursor: 'pointer', transition: 'all .2s' }}>
                <span style={{ fontSize: 12 }}>{autoScroll ? '⏩' : '⏸'}</span>
                {autoScroll ? 'Défilement auto' : 'Défilement pausé'}
              </button>
            )}
            {!hasLRC && chant.paroles && (
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Paroles sans synchronisation</span>
            )}
          </div>
          {/* Taille texte */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 20, padding: '4px 10px' }}>
            <button type="button" onClick={() => setTaille(t => Math.max(-1, t - 1))} style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
            <button type="button" onClick={() => setTaille(t => Math.min(2, t + 1))} style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
          </div>
        </div>

        <div style={{ padding: '30px 20px 80px' }}>
          {/* ── Mode LRC (synchronisé) ── */}
          {hasLRC && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {lrcLines.map((line, i) => {
                const active = i === currentIdx
                const op     = playing || currentIdx >= 0 ? getOpacity(i, currentIdx) : 0.7
                if (isSection(line.text)) {
                  const sc = sectionColor(sectionLabel(line.text))
                  return (
                    <div key={i} ref={el => lineRefs.current[i] = el}
                      style={{ textAlign: 'center', padding: '20px 0 10px', opacity: op, transition: 'opacity .4s' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: sc.color, letterSpacing: '0.12em', textTransform: 'uppercase', background: sc.bg, borderRadius: 20, padding: '4px 16px' }}>
                        {sectionLabel(line.text)}
                      </span>
                    </div>
                  )
                }
                return (
                  <div key={i} ref={el => lineRefs.current[i] = el}
                    onClick={() => { if (audioRef.current) audioRef.current.currentTime = line.time }}
                    style={{ textAlign: 'center', padding: `${active ? 12 : 7}px 0`, cursor: 'pointer', opacity: op, transition: 'all .35s ease' }}>
                    <p style={{ fontSize: active ? fs + 3 : fs, fontWeight: active ? 700 : 400, color: active ? '#fff' : 'rgba(255,255,255,0.9)', margin: 0, lineHeight: 1.6, transition: 'all .35s ease', textShadow: active ? '0 0 20px rgba(255,255,255,0.3)' : 'none' }}>
                      {line.text}
                    </p>
                  </div>
                )
              })}
            </div>
          )}

          {/* ── Mode paroles classiques ── */}
          {!hasLRC && chant.paroles && (
            <div style={{ color: 'rgba(255,255,255,0.85)' }}>
              {renderParoles(chant.paroles, taille)}
            </div>
          )}

          {/* ── Aucun contenu ── */}
          {!hasLRC && !chant.paroles && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <p style={{ fontSize: 36, margin: '0 0 16px' }}>🎵</p>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.5)', margin: 0 }}>Paroles non disponibles</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
