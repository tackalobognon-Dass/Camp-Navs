import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/admin/AdminLayout'

export default function LogistiquePage() {
  const [materiel, setMateriel] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ nom: '', proprietaire: '', statut: 'disponible' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchMateriel() }, [])

  async function fetchMateriel() {
    const { data } = await supabase.from('materiel_logistique').select('*').order('nom')
    setMateriel(data || [])
    setLoading(false)
  }

  async function handleAjouter() {
    if (!form.nom) return
    setSaving(true)
    await supabase.from('materiel_logistique').insert([form])
    setForm({ nom: '', proprietaire: '', statut: 'disponible' })
    setSaving(false)
    fetchMateriel()
  }

  async function updateStatut(id, statut) {
    await supabase.from('materiel_logistique').update({ statut }).eq('id', id)
    fetchMateriel()
  }

  async function supprimerMateriel(id) {
    if (!window.confirm('Supprimer cet équipement ?')) return
    await supabase.from('materiel_logistique').delete().eq('id', id)
    fetchMateriel()
  }

  const statutColor = {
    'disponible': 'bg-emerald-50 text-emerald-700',
    'en cours': 'bg-blue-50 text-blue-700',
    'retourné': 'bg-gray-100 text-gray-500',
    'manquant': 'bg-red-50 text-red-600',
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-xl font-medium text-gray-800">Logistique</h1>
        <p className="text-sm text-gray-400 mt-0.5">Inventaire du matériel de sonorisation et équipements</p>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-emerald-50 rounded-xl p-3 text-center">
          <p className="text-lg font-medium text-emerald-700">{materiel.filter(m => m.statut === 'disponible').length}</p>
          <p className="text-xs text-emerald-600">Disponibles</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-3 text-center">
          <p className="text-lg font-medium text-blue-700">{materiel.filter(m => m.statut === 'en cours').length}</p>
          <p className="text-xs text-blue-600">En cours</p>
        </div>
        <div className="bg-red-50 rounded-xl p-3 text-center">
          <p className="text-lg font-medium text-red-600">{materiel.filter(m => m.statut === 'manquant').length}</p>
          <p className="text-xs text-red-500">Manquants</p>
        </div>
      </div>

      {/* Formulaire */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 mb-5">
        <h2 className="text-sm font-medium text-gray-700 mb-4">Ajouter un équipement</h2>
        <div className="mb-3">
          <label className="block text-xs text-gray-500 mb-1">Nom de l'équipement *</label>
          <input type="text" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })}
            placeholder="Ex : Micro sans fil, Baffle, Ampli..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400" />
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Propriétaire</label>
            <input type="text" value={form.proprietaire} onChange={e => setForm({ ...form, proprietaire: e.target.value })}
              placeholder="Ex : Ministère, Emprunté..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Statut</label>
            <select value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none">
              <option value="disponible">Disponible</option>
              <option value="en cours">En cours d'utilisation</option>
              <option value="retourné">Retourné</option>
              <option value="manquant">Manquant</option>
            </select>
          </div>
        </div>
        <button onClick={handleAjouter} disabled={saving}
          className="w-full bg-emerald-700 text-white text-sm font-medium py-3 rounded-xl disabled:opacity-60">
          {saving ? 'Enregistrement...' : 'Ajouter'}
        </button>
      </div>

      {/* Liste */}
      {loading && <p className="text-sm text-gray-400 text-center py-4">Chargement...</p>}
      {!loading && materiel.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-6 text-center">
          <p className="text-sm text-gray-400">Aucun équipement enregistré.</p>
        </div>
      )}
      <div className="space-y-2">
        {materiel.map(m => (
          <div key={m.id} className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{m.nom}</p>
                {m.proprietaire && <p className="text-xs text-gray-400">{m.proprietaire}</p>}
              </div>
              <select value={m.statut} onChange={e => updateStatut(m.id, e.target.value)}
                className={`text-xs border-0 rounded-lg px-2 py-1.5 font-medium outline-none ${statutColor[m.statut] || 'bg-gray-100 text-gray-500'}`}>
                <option value="disponible">Disponible</option>
                <option value="en cours">En cours</option>
                <option value="retourné">Retourné</option>
                <option value="manquant">Manquant</option>
              </select>
              <button onClick={() => supprimerMateriel(m.id)} className="text-gray-300 hover:text-red-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  )
}
