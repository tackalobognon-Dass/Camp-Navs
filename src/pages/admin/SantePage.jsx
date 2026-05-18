import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/admin/AdminLayout'

export default function SantePage() {
  const [medicaments, setMedicaments] = useState([])
  const [malades, setMalades] = useState([])
  const [loading, setLoading] = useState(true)
  const [onglet, setOnglet] = useState('medicaments')
  const [formMed, setFormMed] = useState({ nom: '', quantite: '', statut: 'disponible' })
  const [formMalade, setFormMalade] = useState({ nom_complet: '', symptomes: '', traitement: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const [{ data: med }, { data: mal }] = await Promise.all([
      supabase.from('stocks_medicaments').select('*').order('nom'),
      supabase.from('inscriptions').select('*').eq('statut_paiement', 'malade')
    ])
    setMedicaments(med || [])
    setMalades(mal || [])
    setLoading(false)
  }

  async function handleAjouterMed() {
    if (!formMed.nom) return
    setSaving(true)
    await supabase.from('stocks_medicaments').insert([formMed])
    setFormMed({ nom: '', quantite: '', statut: 'disponible' })
    setSaving(false)
    fetchData()
  }

  async function supprimerMed(id) {
    if (!window.confirm('Supprimer ce médicament ?')) return
    await supabase.from('stocks_medicaments').delete().eq('id', id)
    fetchData()
  }

  const statutColor = {
    'disponible': 'bg-emerald-50 text-emerald-700',
    'epuise': 'bg-red-50 text-red-600',
    'faible': 'bg-amber-50 text-amber-700',
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-xl font-medium text-gray-800">Santé</h1>
        <p className="text-sm text-gray-400 mt-0.5">Médicaments et suivi des campeurs malades</p>
      </div>

      {/* Onglets */}
      <div className="flex gap-2 mb-5">
        {['medicaments', 'malades'].map(o => (
          <button key={o} onClick={() => setOnglet(o)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${
              onglet === o ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white text-gray-500 border-gray-200'
            }`}>
            {o === 'medicaments' ? 'Médicaments' : 'Campeurs malades'}
          </button>
        ))}
      </div>

      {onglet === 'medicaments' && (
        <>
          <div className="bg-white border border-gray-100 rounded-xl p-5 mb-5">
            <h2 className="text-sm font-medium text-gray-700 mb-4">Ajouter un médicament</h2>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Nom *</label>
                <input type="text" value={formMed.nom} onChange={e => setFormMed({ ...formMed, nom: e.target.value })}
                  placeholder="Ex : Paracétamol"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Quantité</label>
                <input type="text" value={formMed.quantite} onChange={e => setFormMed({ ...formMed, quantite: e.target.value })}
                  placeholder="Ex : 2 boites"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400" />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1">Statut</label>
              <select value={formMed.statut} onChange={e => setFormMed({ ...formMed, statut: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none">
                <option value="disponible">Disponible</option>
                <option value="faible">Stock faible</option>
                <option value="epuise">Épuisé</option>
              </select>
            </div>
            <button onClick={handleAjouterMed} disabled={saving}
              className="w-full bg-emerald-700 text-white text-sm font-medium py-3 rounded-xl disabled:opacity-60">
              {saving ? 'Enregistrement...' : 'Ajouter'}
            </button>
          </div>

          {loading && <p className="text-sm text-gray-400 text-center py-4">Chargement...</p>}
          <div className="space-y-2">
            {medicaments.map(m => (
              <div key={m.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{m.nom}</p>
                  {m.quantite && <p className="text-xs text-gray-400">{m.quantite}</p>}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${statutColor[m.statut] || 'bg-gray-100 text-gray-500'}`}>
                  {m.statut}
                </span>
                <button onClick={() => supprimerMed(m.id)} className="text-gray-300 hover:text-red-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {onglet === 'malades' && (
        <div className="bg-white border border-gray-100 rounded-xl p-5 text-center">
          <p className="text-sm text-gray-400 py-4">
            Les campeurs malades seront listés ici lors du camp.
          </p>
        </div>
      )}
    </AdminLayout>
  )
}
