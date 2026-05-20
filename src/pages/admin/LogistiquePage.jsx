import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/admin/AdminLayout'

const STATUTS = ['En stock', 'Transporté', 'Sur place', 'Retourné']

const STATUT_CONFIG = {
  'En stock':   { bg: '#E1F5EE', color: '#085041', dot: '#085041' },
  'Transporté': { bg: '#E6F1FB', color: '#185FA5', dot: '#185FA5' },
  'Sur place':  { bg: '#FAEEDA', color: '#854F0B', dot: '#854F0B' },
  'Retourné':   { bg: '#F1EFE8', color: '#5F5E5A', dot: '#888780' },
}

const EMPTY_FORM = { nom: '', quantite: 1, proprietaire: '', responsable: '', statut: 'En stock' }

export default function LogistiquePage() {
  const [materiel, setMateriel] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [recherche, setRecherche] = useState('')
  const [filtreStatut, setFiltreStatut] = useState('tous')

  useEffect(() => { fetchMateriel() }, [])

  async function fetchMateriel() {
    const { data } = await supabase.from('materiel_logistique').select('*').order('nom')
    setMateriel(data || [])
    setLoading(false)
  }

  function setF(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function openNew() {
    setForm(EMPTY_FORM)
    setEditId(null)
    setShowForm(true)
  }

  function openEdit(m) {
    setForm({
      nom: m.nom,
      quantite: m.quantite || 1,
      proprietaire: m.proprietaire || '',
      responsable: m.responsable || '',
      statut: m.statut || 'En stock',
    })
    setEditId(m.id)
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.nom) return
    setSaving(true)
    const payload = {
      nom: form.nom,
      quantite: parseInt(form.quantite) || 1,
      proprietaire: form.proprietaire,
      responsable: form.responsable,
      statut: form.statut,
    }
    if (editId) {
      await supabase.from('materiel_logistique').update(payload).eq('id', editId)
    } else {
      await supabase.from('materiel_logistique').insert([{ ...payload, checkin: false, checkout: false }])
    }
    setSaving(false)
    setShowForm(false)
    setEditId(null)
    setForm(EMPTY_FORM)
    fetchMateriel()
  }

  async function updateStatut(id, statut) {
    await supabase.from('materiel_logistique').update({ statut }).eq('id', id)
    fetchMateriel()
  }

  async function toggleCheckin(id, val) {
    await supabase.from('materiel_logistique').update({ checkin: !val, statut: !val ? 'Transporté' : 'En stock' }).eq('id', id)
    fetchMateriel()
  }

  async function toggleCheckout(id, val) {
    await supabase.from('materiel_logistique').update({ checkout: !val, statut: !val ? 'Retourné' : 'Sur place' }).eq('id', id)
    fetchMateriel()
  }

  async function supprimerMateriel(id) {
    if (!window.confirm('Supprimer cet équipement ?')) return
    await supabase.from('materiel_logistique').delete().eq('id', id)
    fetchMateriel()
  }

  // Stats
  const total = materiel.length
  const enStock = materiel.filter(m => m.statut === 'En stock').length
  const surPlace = materiel.filter(m => m.statut === 'Sur place').length
  const nonRetournes = materiel.filter(m => m.checkin && !m.checkout).length
  const alertes = materiel.filter(m => m.statut === 'Transporté' || (m.checkin && !m.checkout)).length

  const filtres = materiel
    .filter(m => filtreStatut === 'tous' || m.statut === filtreStatut)
    .filter(m =>
      m.nom.toLowerCase().includes(recherche.toLowerCase()) ||
      (m.responsable && m.responsable.toLowerCase().includes(recherche.toLowerCase())) ||
      (m.proprietaire && m.proprietaire.toLowerCase().includes(recherche.toLowerCase()))
    )

  return (
    <AdminLayout>
      <div className="mb-5 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-medium text-gray-800">Logistique</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total} équipement(s) dans l'inventaire</p>
        </div>
        <button onClick={() => { showForm && !editId ? setShowForm(false) : openNew() }}
          className="bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-xl flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showForm && !editId ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"} />
          </svg>
          {showForm && !editId ? 'Fermer' : 'Ajouter'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div style={{ background: '#E1F5EE', borderRadius: 12, padding: '12px 14px' }}>
          <p style={{ fontSize: 22, fontWeight: 600, color: '#085041' }}>{total}</p>
          <p style={{ fontSize: 11, color: '#0F6E56' }}>Total équipements</p>
        </div>
        <div style={{ background: alertes > 0 ? '#FCEBEB' : '#F1EFE8', borderRadius: 12, padding: '12px 14px' }}>
          <p style={{ fontSize: 22, fontWeight: 600, color: alertes > 0 ? '#A32D2D' : '#5F5E5A' }}>{alertes}</p>
          <p style={{ fontSize: 11, color: alertes > 0 ? '#993C1D' : '#888780' }}>
            {alertes > 0 ? 'Alertes à vérifier' : 'Aucune alerte'}
          </p>
        </div>
        <div style={{ background: '#E6F1FB', borderRadius: 12, padding: '12px 14px' }}>
          <p style={{ fontSize: 22, fontWeight: 600, color: '#185FA5' }}>{surPlace}</p>
          <p style={{ fontSize: 11, color: '#185FA5' }}>Sur place</p>
        </div>
        <div style={{ background: nonRetournes > 0 ? '#FAEEDA' : '#F1EFE8', borderRadius: 12, padding: '12px 14px' }}>
          <p style={{ fontSize: 22, fontWeight: 600, color: nonRetournes > 0 ? '#854F0B' : '#5F5E5A' }}>{nonRetournes}</p>
          <p style={{ fontSize: 11, color: nonRetournes > 0 ? '#854F0B' : '#888780' }}>Non retournés</p>
        </div>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-5">
          <h2 className="text-sm font-medium text-gray-700 mb-4">
            {editId ? "Modifier l'équipement" : 'Nouvel équipement'}
          </h2>

          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-1">Nom de l'équipement *</label>
            <input type="text" value={form.nom} onChange={e => setF('nom', e.target.value)}
              placeholder="Ex : Micro sans fil, Baffle, Câble HDMI..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400" />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Quantité</label>
              <input type="number" min="1" value={form.quantite} onChange={e => setF('quantite', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Statut</label>
              <select value={form.statut} onChange={e => setF('statut', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none">
                {STATUTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-1">Propriétaire</label>
            <input type="text" value={form.proprietaire} onChange={e => setF('proprietaire', e.target.value)}
              placeholder="Ex : Navigateurs CI, Emprunté, Loué..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400" />
          </div>

          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-1">Responsable</label>
            <input type="text" value={form.responsable} onChange={e => setF('responsable', e.target.value)}
              placeholder="Ex : AKRE ALPHONSE"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400" />
          </div>

          <div className="flex gap-3">
            <button onClick={() => { setShowForm(false); setEditId(null) }}
              className="flex-1 bg-gray-100 text-gray-600 text-sm font-medium py-3 rounded-xl">
              Annuler
            </button>
            <button onClick={handleSave} disabled={saving || !form.nom}
              className="flex-1 bg-emerald-700 text-white text-sm font-medium py-3 rounded-xl disabled:opacity-60">
              {saving ? 'Enregistrement...' : editId ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="flex gap-2 overflow-x-auto mb-3 pb-1" style={{ scrollbarWidth: 'none' }}>
        {['tous', ...STATUTS].map(s => (
          <button key={s} onClick={() => setFiltreStatut(s)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              border: `0.5px solid ${filtreStatut === s ? '#085041' : '#e5e5e0'}`,
              background: filtreStatut === s ? '#085041' : '#fff',
              color: filtreStatut === s ? '#fff' : '#666',
            }}>
            {s === 'tous' ? 'Tous' : s}
          </button>
        ))}
      </div>

      {/* Recherche */}
      <input type="text" value={recherche} onChange={e => setRecherche(e.target.value)}
        placeholder="Rechercher un équipement..."
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-4 bg-white outline-none focus:border-emerald-400" />

      {/* Liste */}
      {loading && <p className="text-sm text-gray-400 text-center py-8">Chargement...</p>}
      {!loading && filtres.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-6 text-center">
          <p className="text-sm text-gray-400">Aucun équipement trouvé.</p>
        </div>
      )}

      <div className="space-y-2">
        {filtres.map(m => {
          const sc = STATUT_CONFIG[m.statut] || STATUT_CONFIG['En stock']
          const alerte = m.checkin && !m.checkout
          return (
            <div key={m.id} style={{ background: '#fff', borderRadius: 14, border: `0.5px solid ${alerte ? '#F09595' : '#e5e5e0'}`, padding: '12px 14px' }}>
              <div className="flex items-start gap-3">
                {/* Dot statut */}
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: sc.dot, flexShrink: 0, marginTop: 5 }} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>{m.nom}</p>
                    {m.quantite > 1 && <span style={{ fontSize: 9, background: '#f5f5f3', color: '#666', borderRadius: 20, padding: '1px 6px' }}>x{m.quantite}</span>}
                    <span style={{ fontSize: 9, background: sc.bg, color: sc.color, borderRadius: 20, padding: '1px 6px', fontWeight: 500 }}>{m.statut}</span>
                    {alerte && <span style={{ fontSize: 9, background: '#FCEBEB', color: '#A32D2D', borderRadius: 20, padding: '1px 6px', fontWeight: 500 }}>Non retourné</span>}
                  </div>
                  <div className="flex gap-3 mt-1 flex-wrap">
                    {m.proprietaire && <p style={{ fontSize: 10, color: '#888' }}>Proprio : {m.proprietaire}</p>}
                    {m.responsable && <p style={{ fontSize: 10, color: '#888' }}>Resp : {m.responsable}</p>}
                  </div>

                  {/* Check-in / Check-out */}
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => toggleCheckin(m.id, m.checkin)}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, padding: '4px 8px', borderRadius: 8, border: '0.5px solid #e5e5e0', background: m.checkin ? '#085041' : '#fff', color: m.checkin ? '#fff' : '#666', cursor: 'pointer' }}>
                      <svg style={{ width: 10, height: 10 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {m.checkin ? 'Chargé' : 'Check-in'}
                    </button>
                    <button onClick={() => toggleCheckout(m.id, m.checkout)}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, padding: '4px 8px', borderRadius: 8, border: '0.5px solid #e5e5e0', background: m.checkout ? '#085041' : '#fff', color: m.checkout ? '#fff' : '#666', cursor: 'pointer' }}>
                      <svg style={{ width: 10, height: 10 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {m.checkout ? 'Retourné' : 'Check-out'}
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(m)}
                    style={{ width: 30, height: 30, borderRadius: 8, background: '#E1F5EE', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg style={{ width: 13, height: 13, color: '#085041' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button onClick={() => supprimerMateriel(m.id)}
                    style={{ width: 30, height: 30, borderRadius: 8, background: '#FCEBEB', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg style={{ width: 13, height: 13, color: '#A32D2D' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </AdminLayout>
  )
}
