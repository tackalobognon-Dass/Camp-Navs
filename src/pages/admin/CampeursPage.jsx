import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/admin/AdminLayout'

export default function CampeursPage() {
  const [inscriptions, setInscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [recherche, setRecherche] = useState('')
  const [filtre, setFiltre] = useState('tous')

  useEffect(() => { fetchInscriptions() }, [])

  async function fetchInscriptions() {
    const { data } = await supabase.from('inscriptions').select('*').order('created_at', { ascending: false })
    setInscriptions(data || [])
    setLoading(false)
  }

  async function updateStatut(id, statut) {
    await supabase.from('inscriptions').update({ statut_paiement: statut }).eq('id', id)
    fetchInscriptions()
  }

  async function supprimerInscription(id) {
    if (!window.confirm('Supprimer cette inscription ?')) return
    await supabase.from('inscriptions').delete().eq('id', id)
    fetchInscriptions()
  }

  const filtres = inscriptions
    .filter(i => filtre === 'tous' || i.statut_paiement === filtre)
    .filter(i =>
      i.nom_complet.toLowerCase().includes(recherche.toLowerCase()) ||
      (i.telephone && i.telephone.includes(recherche))
    )

  const statutColor = {
    'payé': 'bg-emerald-50 text-emerald-700',
    'en attente': 'bg-amber-50 text-amber-700',
    'partiel': 'bg-blue-50 text-blue-700',
  }

  return (
    <AdminLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-gray-800">Campeurs</h1>
          <p className="text-sm text-gray-400 mt-0.5">{inscriptions.length} inscription(s) au total</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['tous', 'en attente', 'partiel', 'payé'].map(f => (
          <button
            key={f}
            onClick={() => setFiltre(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${
              filtre === f ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white text-gray-500 border-gray-200'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Recherche */}
      <input
        type="text"
        value={recherche}
        onChange={e => setRecherche(e.target.value)}
        placeholder="Rechercher par nom ou téléphone..."
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-4 bg-white outline-none focus:border-emerald-400"
      />

      {/* Liste */}
      {loading && <p className="text-sm text-gray-400 text-center py-8">Chargement...</p>}
      {!loading && filtres.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-8 text-center">
          <p className="text-sm text-gray-400">Aucun campeur trouvé.</p>
        </div>
      )}

      <div className="space-y-3">
        {filtres.map((ins) => (
          <div key={ins.id} className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-gray-800">{ins.nom_complet}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statutColor[ins.statut_paiement] || 'bg-gray-100 text-gray-500'}`}>
                    {ins.statut_paiement}
                  </span>
                </div>
                <p className="text-xs text-gray-400">{ins.telephone} · {ins.tranche_age}</p>
                {ins.eglise && <p className="text-xs text-gray-400">{ins.eglise}</p>}
                <p className="text-xs text-gray-300 mt-1">
                  {new Date(ins.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <select
                  value={ins.statut_paiement}
                  onChange={e => updateStatut(ins.id, e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-600 outline-none"
                >
                  <option value="en attente">En attente</option>
                  <option value="partiel">Partiel</option>
                  <option value="payé">Payé</option>
                </select>
                <button
                  onClick={() => supprimerInscription(ins.id)}
                  className="text-xs text-red-400 border border-red-100 rounded-lg px-2 py-1.5 hover:bg-red-50"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  )
}
