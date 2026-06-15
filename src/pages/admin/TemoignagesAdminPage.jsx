import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/admin/AdminLayout'

const VERT = '#1B3B2B'
const VERT_CLAIR = '#E8F5E8'
const STATUT_CONFIG = {
  'en_attente': { label: 'En attente', bg: '#FFFBEB', color: '#D97706', border: '#FCD34D' },
  'approuve':   { label: 'Approuvé',   bg: '#ECFDF5', color: '#059669', border: '#86EFAC' },
  'rejete':     { label: 'Rejeté',     bg: '#FEF2F2', color: '#DC2626', border: '#FCA5A5' },
}

function CarteTemoin({ t, saving, onStatut, onSupprimer }) {
  const [etendu, setEtendu] = useState(false)
  const sc = STATUT_CONFIG[t.statut] || STATUT_CONFIG['en_attente']
  const nom = t.anonyme ? 'Anonyme' : (t.nom || 'Anonyme')
  const date = new Date(t.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  const contenuLong = t.contenu && t.contenu.length > 200
  const contenuAffiche = contenuLong && !etendu ? t.contenu.slice(0, 200) + '…' : t.contenu

  return (
    <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${t.statut === 'en_attente' ? '#FCD34D' : '#F1F5F9'}`, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: 14 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: t.anonyme ? '#F1F5F9' : VERT_CLAIR, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: t.anonyme ? '#94A3B8' : VERT }}>{nom.charAt(0)}</span>
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', margin: 0 }}>{nom}</p>
            <p style={{ fontSize: 10, color: '#94A3B8', margin: '2px 0 0' }}>{date}</p>
          </div>
        </div>
        <span style={{ fontSize: 10, fontWeight: 600, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, borderRadius: 20, padding: '2px 10px' }}>
          {sc.label}
        </span>
      </div>

      {/* Contenu */}
      <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '10px 12px', marginBottom: 12 }}>
        <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>
          "{contenuAffiche}"
        </p>
        {contenuLong && (
          <button type="button" onClick={() => setEtendu(!etendu)}
            style={{ fontSize: 11, color: VERT, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0 0', display: 'block' }}>
            {etendu ? 'Réduire' : 'Lire la suite'}
          </button>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        {t.statut !== 'approuve' && (
          <button type="button" onClick={() => onStatut(t.id, 'approuve')} disabled={saving === t.id}
            style={{ flex: 1, background: '#ECFDF5', color: '#059669', border: '1px solid #86EFAC', borderRadius: 10, padding: '8px', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: saving === t.id ? 0.6 : 1 }}>
            ✓ Approuver
          </button>
        )}
        {t.statut === 'approuve' && (
          <button type="button" onClick={() => onStatut(t.id, 'en_attente')} disabled={saving === t.id}
            style={{ flex: 1, background: '#FFFBEB', color: '#D97706', border: '1px solid #FCD34D', borderRadius: 10, padding: '8px', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: saving === t.id ? 0.6 : 1 }}>
            Suspendre
          </button>
        )}
        {t.statut !== 'rejete' && (
          <button type="button" onClick={() => onStatut(t.id, 'rejete')} disabled={saving === t.id}
            style={{ flex: 1, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', borderRadius: 10, padding: '8px', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: saving === t.id ? 0.6 : 1 }}>
            Rejeter
          </button>
        )}
        <button type="button" onClick={() => onSupprimer(t.id)}
          style={{ width: 36, height: 36, borderRadius: 10, background: '#FEF2F2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#DC2626" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </button>
      </div>
    </div>
  )
}

export default function TemoignagesAdminPage() {
  const [temoignages, setTemoignages] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtre, setFiltre] = useState('en_attente')
  const [recherche, setRecherche] = useState('')
  const [saving, setSaving] = useState(null)

  useEffect(() => { fetchTemoignages() }, [])

  async function fetchTemoignages() {
    const { data } = await supabase.from('temoignages').select('*').order('created_at', { ascending: false })
    setTemoignages(data || [])
    setLoading(false)
  }

  async function changerStatut(id, statut) {
    setSaving(id)
    await supabase.from('temoignages').update({ statut }).eq('id', id)
    setSaving(null)
    fetchTemoignages()
  }

  async function supprimer(id) {
    if (!window.confirm('Supprimer ce témoignage ?')) return
    await supabase.from('temoignages').delete().eq('id', id)
    fetchTemoignages()
  }

  const enAttente  = temoignages.filter(t => t.statut === 'en_attente').length
  const approuves  = temoignages.filter(t => t.statut === 'approuve').length
  const rejetes    = temoignages.filter(t => t.statut === 'rejete').length

  const filtres = temoignages
    .filter(t => filtre === 'tous' || t.statut === filtre)
    .filter(t => {
      if (!recherche) return true
      const nom = t.anonyme ? 'anonyme' : (t.nom || '').toLowerCase()
      return nom.includes(recherche.toLowerCase()) || (t.contenu || '').toLowerCase().includes(recherche.toLowerCase())
    })

  const chipS = (active) => ({
    flexShrink: 0, padding: '5px 13px', borderRadius: 20, fontSize: 12,
    fontWeight: active ? 700 : 500, cursor: 'pointer',
    border: `1px solid ${active ? VERT : '#E2E8F0'}`,
    background: active ? VERT : '#fff',
    color: active ? '#fff' : '#64748B',
    transition: 'all .2s',
  })

  return (
    <AdminLayout>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#F8FAFC', overflow: 'hidden' }}>

        {/* ── HEADER FIXE ── */}
        <div style={{ flexShrink: 0, background: '#F8FAFC', zIndex: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderBottom: '1px solid #E2E8F0' }}>
          <div style={{ padding: '14px 14px 10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1E293B', margin: 0 }}>Témoignages</h1>
                <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 0' }}>
                  {temoignages.length} témoignage(s)
                  {enAttente > 0 && (
                    <span style={{ marginLeft: 8, background: '#FFFBEB', color: '#D97706', border: '1px solid #FCD34D', borderRadius: 20, padding: '1px 8px', fontSize: 10, fontWeight: 600 }}>
                      {enAttente} en attente
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Barre de recherche */}
            <div style={{ position: 'relative', marginBottom: 10 }}>
              <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#94A3B8" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input type="text" value={recherche} onChange={e => setRecherche(e.target.value)}
                placeholder="Rechercher par nom ou contenu..."
                style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: 10, padding: '8px 12px 8px 30px', fontSize: 12, outline: 'none', background: '#fff', color: '#1E293B' }} />
            </div>

            {/* Filtres pills */}
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
              {[
                { key: 'en_attente', label: `En attente${enAttente > 0 ? ` (${enAttente})` : ''}` },
                { key: 'approuve',   label: `Approuvés${approuves > 0 ? ` (${approuves})` : ''}` },
                { key: 'rejete',     label: `Rejetés${rejetes > 0 ? ` (${rejetes})` : ''}` },
                { key: 'tous',       label: `Tous (${temoignages.length})` },
              ].map(f => (
                <button key={f.key} type="button" onClick={() => setFiltre(f.key)} style={chipS(filtre === f.key)}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── ZONE SCROLLABLE ── */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '12px 14px 14px' }}>

          {loading && <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '30px 0' }}>Chargement...</p>}

          {!loading && filtres.length === 0 && (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: 28, textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>
                {recherche ? 'Aucun résultat pour cette recherche.' : 'Aucun témoignage dans cette catégorie.'}
              </p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtres.map(t => (
              <CarteTemoin key={t.id} t={t} saving={saving} onStatut={changerStatut} onSupprimer={supprimer} />
            ))}
          </div>

        </div>
      </div>
    </AdminLayout>
  )
}
