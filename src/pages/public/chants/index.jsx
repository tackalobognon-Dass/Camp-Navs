import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../../lib/supabase'
import BottomNav from '../../../components/public/BottomNav'
import ChantDetail from './ChantDetail'

const VERT = '#054035'
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
const IconArrow = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>

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

  const filtres = chants
    .filter(c => {
      if (filtre === 'audio')   return !!c.lien_audio
      if (filtre === 'paroles') return !!(c.paroles || c.paroles_lrc)
      if (filtre === 'sync')    return !!c.paroles_lrc
      return true
    })
    .filter(c =>
      c.titre.toLowerCase().includes(recherche.toLowerCase()) ||
      (c.artiste && c.artiste.toLowerCase().includes(recherche.toLowerCase()))
    )

  const nbAudio  = chants.filter(c => c.lien_audio).length
  const nbParoles = chants.filter(c => c.paroles || c.paroles_lrc).length
  const nbSync   = chants.filter(c => c.paroles_lrc).length

  if (chantSel) {
    const idx = chants.findIndex(c => c.id === chantSel.id)
    return <ChantDetail chant={chantSel} couleur={COULEURS[idx % COULEURS.length]} onBack={() => setChantSel(null)} />
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', maxWidth: 480, margin: '0 auto' }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{ background: `linear-gradient(160deg,${VERT},#0A6B50)`, padding: '44px 16px 16px', position: 'relative', overflow: 'hidden' }}>
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
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', margin: 0 }}>{chants.length} chant(s) · {nbAudio} audio · {nbSync} sync</p>
          </div>
        </div>

        {/* Recherche */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '9px 13px', display: 'flex', alignItems: 'center', gap: 9, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: 12 }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#9CA3AF" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input type="text" value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Titre, artiste..."
            style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: '#1E293B', width: '100%' }} />
          {recherche && <button type="button" onClick={() => setRecherche('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 16, lineHeight: 1, padding: 0 }}>✕</button>}
        </div>

        {/* Filtres */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {[
            { key: 'tous',    label: `Tous (${chants.length})` },
            { key: 'audio',   label: `🎵 Audio (${nbAudio})` },
            { key: 'paroles', label: `📄 Paroles (${nbParoles})` },
            { key: 'sync',    label: `✨ Synchronisés (${nbSync})` },
          ].map(f => (
            <button key={f.key} type="button" onClick={() => setFiltre(f.key)}
              style={{ flexShrink: 0, padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: filtre === f.key ? 700 : 500, cursor: 'pointer', border: `1px solid ${filtre === f.key ? '#fff' : 'rgba(255,255,255,0.3)'}`, background: filtre === f.key ? '#fff' : 'transparent', color: filtre === f.key ? VERT : 'rgba(255,255,255,0.8)', transition: 'all .2s' }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Liste */}
      <div style={{ padding: '12px 14px 90px' }}>
        {loading && <p style={{ textAlign: 'center', fontSize: 13, color: '#94A3B8', padding: '40px 0' }}>Chargement...</p>}
        {!loading && chants.length === 0 && (
          <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #F1F5F9', padding: '40px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎵</div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', margin: 0 }}>Aucun chant disponible</p>
          </div>
        )}
        {!loading && recherche && filtres.length === 0 && (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #F1F5F9', padding: 20, textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>Aucun résultat pour "{recherche}"</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtres.map((c, i) => {
            const idx = chants.findIndex(ch => ch.id === c.id)
            const col = COULEURS[idx % COULEURS.length]
            const hasSync = !!c.paroles_lrc
            return (
              <div key={c.id} onClick={() => setChantSel(c)}
                style={{ background: '#fff', borderRadius: 14, border: '1px solid #F1F5F9', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', animation: `fadeUp .3s ease ${Math.min(i * 0.04, 0.3)}s both` }}
                onTouchStart={e => e.currentTarget.style.transform = 'scale(0.98)'}
                onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: col.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: `0 3px 10px ${col.color}40` }}>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/></svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.titre}</p>
                  <p style={{ fontSize: 11, color: '#94A3B8', margin: '0 0 5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.artiste || 'Chant de camp'}</p>
                  <div style={{ display: 'flex', gap: 5 }}>
                    {c.lien_audio && <span style={{ fontSize: 9, fontWeight: 700, color: '#1D4ED8', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 20, padding: '2px 8px' }}>🎵 Audio</span>}
                    {hasSync     && <span style={{ fontSize: 9, fontWeight: 700, color: '#C9A84C', background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 20, padding: '2px 8px' }}>✨ Sync</span>}
                    {c.paroles && !hasSync && <span style={{ fontSize: 9, fontWeight: 700, color: '#6D28D9', background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: 20, padding: '2px 8px' }}>📄 Paroles</span>}
                  </div>
                </div>
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
