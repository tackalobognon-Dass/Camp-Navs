import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/admin/AdminLayout'

const COULEURS_AVATAR = [
  { bg: '#E1F5EE', color: '#085041' },
  { bg: '#E6F1FB', color: '#185FA5' },
  { bg: '#FAEEDA', color: '#854F0B' },
  { bg: '#EEEDFE', color: '#534AB7' },
  { bg: '#FAECE7', color: '#993C1D' },
  { bg: '#EAF3DE', color: '#3B6D11' },
]

const EMPTY_FORM = { nom_complet: '', role: '', telephone: '', email: '', commission: '' }

export default function MembresPage() {
  const [membres, setMembres] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [recherche, setRecherche] = useState('')

  useEffect(() => { fetchMembres() }, [])

  async function fetchMembres() {
    const { data } = await supabase.from('bureau_membres').select('*').order('role', { ascending: true })
    setMembres(data || [])
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
      nom_complet: m.nom_complet,
      role: m.role || '',
      telephone: m.telephone || '',
      email: m.email || '',
      commission: m.commission || '',
    })
    setEditId(m.id)
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.nom_complet || !form.role) return
    setSaving(true)
    const payload = {
      nom_complet: form.nom_complet,
      role: form.role,
      telephone: form.telephone,
      email: form.email,
      commission: form.commission,
    }
    if (editId) {
      await supabase.from('bureau_membres').update(payload).eq('id', editId)
    } else {
      await supabase.from('bureau_membres').insert([payload])
    }
    setSaving(false)
    setShowForm(false)
    setEditId(null)
    setForm(EMPTY_FORM)
    fetchMembres()
  }

  async function supprimerMembre(id) {
    if (!window.confirm('Supprimer ce membre ?')) return
    await supabase.from('bureau_membres').delete().eq('id', id)
    fetchMembres()
  }

  async function monterOrdre(index) {
    if (index === 0) return
    const newList = [...membres]
    const temp = newList[index]
    newList[index] = newList[index - 1]
    newList[index - 1] = temp
    setMembres(newList)
  }

  async function descendreOrdre(index) {
    if (index === membres.length - 1) return
    const newList = [...membres]
    const temp = newList[index]
    newList[index] = newList[index + 1]
    newList[index + 1] = temp
    setMembres(newList)
  }

  const filtres = membres.filter(m =>
    m.nom_complet.toLowerCase().includes(recherche.toLowerCase()) ||
    (m.role && m.role.toLowerCase().includes(recherche.toLowerCase())) ||
    (m.commission && m.commission.toLowerCase().includes(recherche.toLowerCase()))
  )

  function getAvatar(nom, index) {
    const c = COULEURS_AVATAR[index % COULEURS_AVATAR.length]
    return { initiales: nom.slice(0, 2).toUpperCase(), ...c }
  }

  return (
    <AdminLayout>
      <div className="mb-5 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-medium text-gray-800">Membres du bureau</h1>
          <p className="text-sm text-gray-400 mt-0.5">{membres.length} membre(s)</p>
        </div>
        <button onClick={() => { showForm && !editId ? setShowForm(false) : openNew() }}
          className="bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-xl flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showForm && !editId ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"} />
          </svg>
          {showForm && !editId ? 'Fermer' : 'Ajouter un membre'}
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-5">
          <h2 className="text-sm font-medium text-gray-700 mb-4">
            {editId ? 'Modifier le membre' : 'Nouveau membre'}
          </h2>

          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-1">Nom complet *</label>
            <input type="text" value={form.nom_complet} onChange={e => setF('nom_complet', e.target.value)}
              placeholder="Ex : N'DRI SERGE PACOME"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400" />
          </div>

          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-1">Rôle *</label>
            <input type="text" value={form.role} onChange={e => setF('role', e.target.value)}
              placeholder="Ex : Directeur du camp"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400" />
          </div>

          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-1">Commission / Département</label>
            <input type="text" value={form.commission} onChange={e => setF('commission', e.target.value)}
              placeholder="Ex : Logistique, Louange, Finance..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400" />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Téléphone</label>
              <input type="text" value={form.telephone} onChange={e => setF('telephone', e.target.value)}
                placeholder="07 XX XX XX XX"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => setF('email', e.target.value)}
                placeholder="email@exemple.com"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400" />
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => { setShowForm(false); setEditId(null) }}
              className="flex-1 bg-gray-100 text-gray-600 text-sm font-medium py-3 rounded-xl">
              Annuler
            </button>
            <button onClick={handleSave} disabled={saving || !form.nom_complet || !form.role}
              className="flex-1 bg-emerald-700 text-white text-sm font-medium py-3 rounded-xl disabled:opacity-60">
              {saving ? 'Enregistrement...' : editId ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </div>
      )}

      {/* Recherche */}
      <input type="text" value={recherche} onChange={e => setRecherche(e.target.value)}
        placeholder="Rechercher par nom, rôle ou commission..."
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-4 bg-white outline-none focus:border-emerald-400" />

      {/* Liste */}
      {loading && <p className="text-sm text-gray-400 text-center py-8">Chargement...</p>}

      {!loading && membres.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-6 text-center">
          <p className="text-sm text-gray-400">Aucun membre enregistré.</p>
          <button onClick={openNew} className="mt-3 text-sm text-emerald-700 font-medium">
            + Ajouter le premier membre
          </button>
        </div>
      )}

      <div className="space-y-2">
        {filtres.map((m, index) => {
          const av = getAvatar(m.nom_complet, index)
          return (
            <div key={m.id} className="bg-white border border-gray-100 rounded-xl p-3">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: av.bg, color: av.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, flexShrink: 0 }}>
                  {av.initiales}
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{m.nom_complet}</p>
                  <p className="text-xs text-emerald-700">{m.role}</p>
                  {m.commission && <p className="text-xs text-gray-400">{m.commission}</p>}
                  <div className="flex gap-3 mt-0.5 flex-wrap">
                    {m.telephone && <p className="text-xs text-gray-400">{m.telephone}</p>}
                    {m.email && <p className="text-xs text-gray-400">{m.email}</p>}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1 flex-shrink-0">
                  {/* Ordre */}
                  <div className="flex gap-1">
                    <button onClick={() => monterOrdre(index)}
                      style={{ width: 26, height: 26, borderRadius: 6, background: '#f5f5f3', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg style={{ width: 12, height: 12, color: '#666' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button onClick={() => descendreOrdre(index)}
                      style={{ width: 26, height: 26, borderRadius: 6, background: '#f5f5f3', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg style={{ width: 12, height: 12, color: '#666' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  {/* Edit/Delete */}
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(m)}
                      style={{ width: 26, height: 26, borderRadius: 6, background: '#E1F5EE', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg style={{ width: 12, height: 12, color: '#085041' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button onClick={() => supprimerMembre(m.id)}
                      style={{ width: 26, height: 26, borderRadius: 6, background: '#FCEBEB', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg style={{ width: 12, height: 12, color: '#A32D2D' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </AdminLayout>
  )
}
