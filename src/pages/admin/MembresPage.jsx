import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/admin/AdminLayout'

export default function MembresPage() {
  const [membres, setMembres] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ nom_complet: '', role: '', telephone: '' })
  const [saving, setSaving] = useState(false)
  const [recherche, setRecherche] = useState('')

  useEffect(() => { fetchMembres() }, [])

  async function fetchMembres() {
    const { data } = await supabase.from('bureau_membres').select('*').order('role', { ascending: true })
    setMembres(data || [])
    setLoading(false)
  }

  async function handleAjouter() {
    if (!form.nom_complet || !form.role) return
    setSaving(true)
    await supabase.from('bureau_membres').insert([form])
    setForm({ nom_complet: '', role: '', telephone: '' })
    setSaving(false)
    fetchMembres()
  }

  async function supprimerMembre(id) {
    if (!window.confirm('Supprimer ce membre ?')) return
    await supabase.from('bureau_membres').delete().eq('id', id)
    fetchMembres()
  }

  const filtres = membres.filter(m =>
    m.nom_complet.toLowerCase().includes(recherche.toLowerCase()) ||
    m.role.toLowerCase().includes(recherche.toLowerCase())
  )

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-xl font-medium text-gray-800">Membres du bureau</h1>
        <p className="text-sm text-gray-400 mt-0.5">{membres.length} membre(s) enregistré(s)</p>
      </div>

      {/* Formulaire */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
        <h2 className="text-sm font-medium text-gray-700 mb-4">Ajouter un membre</h2>
        <div className="mb-3">
          <label className="block text-xs text-gray-500 mb-1">Nom complet *</label>
          <input type="text" value={form.nom_complet} onChange={e => setForm({ ...form, nom_complet: e.target.value })}
            placeholder="Ex : N'DRI SERGE PACOME"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400" />
        </div>
        <div className="mb-3">
          <label className="block text-xs text-gray-500 mb-1">Rôle / Commission *</label>
          <input type="text" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
            placeholder="Ex : Directeur"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400" />
        </div>
        <div className="mb-4">
          <label className="block text-xs text-gray-500 mb-1">Téléphone</label>
          <input type="text" value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })}
            placeholder="Ex : 07 48 92 49 74"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400" />
        </div>
        <button onClick={handleAjouter} disabled={saving}
          className="w-full bg-emerald-700 text-white text-sm font-medium py-3 rounded-xl disabled:opacity-60">
          {saving ? 'Enregistrement...' : 'Ajouter le membre'}
        </button>
      </div>

      {/* Recherche */}
      <input type="text" value={recherche} onChange={e => setRecherche(e.target.value)}
        placeholder="Rechercher par nom ou rôle..."
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-4 bg-white outline-none focus:border-emerald-400" />

      {/* Liste */}
      {loading && <p className="text-sm text-gray-400 text-center py-8">Chargement...</p>}
      <div className="space-y-2">
        {filtres.map((m) => (
          <div key={m.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-emerald-700">{m.nom_complet.charAt(0)}</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">{m.nom_complet}</p>
              <p className="text-xs text-emerald-700">{m.role}</p>
              {m.telephone && <p className="text-xs text-gray-400 mt-0.5">{m.telephone}</p>}
            </div>
            <button onClick={() => supprimerMembre(m.id)} className="text-gray-300 hover:text-red-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </AdminLayout>
  )
}
