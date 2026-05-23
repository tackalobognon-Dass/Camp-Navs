import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/admin/AdminLayout'

const STATUT_CONFIG = {
  'en_attente': { label: 'En attente', bg: '#FFFBEB', color: '#D97706', border: '#FCD34D' },
  'approuve':   { label: 'Approuvé',   bg: '#ECFDF5', color: '#059669', border: '#86EFAC' },
  'rejete':     { label: 'Rejeté',     bg: '#FEF2F2', color: '#DC2626', border: '#FCA5A5' },
}

export default function TemoignagesAdminPage() {
  const [temoignages, setTemoignages] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtre, setFiltre] = useState('en_attente')
  const [saving, setSaving] = useState(null)

  useEffect(() => { fetchTemoignages() }, [])

  async function fetchTemoignages() {
    const { data } = await supabase
      .from('temoignages')
      .select('*')
      .order('created_at', { ascending: false })
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

  const filtres = temoignages.filter(t => filtre === 'tous' || t.statut === filtre)
  const enAttente = temoignages.filter(t => t.statut === 'en_attente').length

  return (
    <AdminLayout>
      <div className="mb-5 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-medium text-gray-800">Témoignages</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {temoignages.length} témoignage(s)
            {enAttente > 0 && <span style={{ marginLeft: 8, background: '#FFFBEB', color: '#D97706', borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 500 }}>{enAttente} en attente</span>}
          </p>
        </div>
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {[
          { key: 'en_attente', label: `En attente${enAttente > 0 ? ` (${enAttente})` : ''}` },
          { key: 'approuve', label: 'Approuvés' },
          { key: 'rejete', label: 'Rejetés' },
          { key: 'tous', label: 'Tous' },
        ].map(f => (
          <button key={f.key} onClick={() => setFiltre(f.key)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ border: `0.5px solid ${filtre === f.key ? '#054035' : '#e5e5e0'}`, background: filtre === f.key ? '#054035' : '#fff', color: filtre === f.key ? '#fff' : '#666' }}>
            {f.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-gray-400 text-center py-8">Chargement...</p>}
      {!loading && filtres.length === 0 && (
        <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #F3F4F6', padding: 24, textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: '#9CA3AF' }}>Aucun témoignage dans cette catégorie.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtres.map(t => {
          const sc = STATUT_CONFIG[t.statut] || STATUT_CONFIG['en_attente']
          const nom = t.anonyme ? 'Anonyme' : (t.nom || 'Anonyme')
          const date = new Date(t.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
          return (
            <div key={t.id} style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #F3F4F6', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: 14 }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: t.anonyme ? '#F3F4F6' : '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: t.anonyme ? '#9CA3AF' : '#054035' }}>{nom.charAt(0)}</span>
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: '#111827', margin: 0 }}>{nom}</p>
                    <p style={{ fontSize: 10, color: '#9CA3AF', margin: '2px 0 0' }}>{date}</p>
                  </div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 500, background: sc.bg, color: sc.color, border: `0.5px solid ${sc.border}`, borderRadius: 20, padding: '2px 9px' }}>
                  {sc.label}
                </span>
              </div>

              {/* Contenu */}
              <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, margin: '0 0 12px', fontStyle: 'italic', background: '#F9FAFB', borderRadius: 8, padding: '10px 12px' }}>
                "{t.contenu}"
              </p>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8 }}>
                {t.statut !== 'approuve' && (
                  <button onClick={() => changerStatut(t.id, 'approuve')} disabled={saving === t.id}
                    style={{ flex: 1, background: '#ECFDF5', color: '#059669', border: '0.5px solid #86EFAC', borderRadius: 8, padding: '8px', fontSize: 12, fontWeight: 500, cursor: 'pointer', opacity: saving === t.id ? 0.6 : 1 }}>
                    Approuver
                  </button>
                )}
                {t.statut !== 'rejete' && (
                  <button onClick={() => changerStatut(t.id, 'rejete')} disabled={saving === t.id}
                    style={{ flex: 1, background: '#FEF2F2', color: '#DC2626', border: '0.5px solid #FCA5A5', borderRadius: 8, padding: '8px', fontSize: 12, fontWeight: 500, cursor: 'pointer', opacity: saving === t.id ? 0.6 : 1 }}>
                    Rejeter
                  </button>
                )}
                {t.statut === 'approuve' && (
                  <button onClick={() => changerStatut(t.id, 'en_attente')} disabled={saving === t.id}
                    style={{ flex: 1, background: '#FFFBEB', color: '#D97706', border: '0.5px solid #FCD34D', borderRadius: 8, padding: '8px', fontSize: 12, fontWeight: 500, cursor: 'pointer', opacity: saving === t.id ? 0.6 : 1 }}>
                    Suspendre
                  </button>
                )}
                <button onClick={() => supprimer(t.id)}
                  style={{ width: 36, height: 36, borderRadius: 8, background: '#FEF2F2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg style={{ width: 14, height: 14, color: '#DC2626' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </AdminLayout>
  )
}
