import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/admin/AdminLayout'

export default function EnfantsPage() {
  const [enfants, setEnfants] = useState([])
  const [loading, setLoading] = useState(true)
  const [recherche, setRecherche] = useState('')

  useEffect(() => { fetchEnfants() }, [])

  async function fetchEnfants() {
    const { data } = await supabase
      .from('inscriptions')
      .select('*')
      .eq('tranche_age', 'Enfants & Adolescents')
      .order('nom_complet')
    setEnfants(data || [])
    setLoading(false)
  }

  async function updateStatut(id, statut) {
    await supabase.from('inscriptions').update({ statut_paiement: statut }).eq('id', id)
    fetchEnfants()
  }

  const filtres = enfants.filter(e =>
    e.nom_complet.toLowerCase().includes(recherche.toLowerCase()) ||
    (e.eglise && e.eglise.toLowerCase().includes(recherche.toLowerCase()))
  )

  const statutColor = {
    'payé': 'bg-emerald-50 text-emerald-700',
    'en attente': 'bg-amber-50 text-amber-700',
    'partiel': 'bg-blue-50 text-blue-700',
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-xl font-medium text-gray-800">Enfants & Adolescents</h1>
        <p className="text-sm text-gray-400 mt-0.5">{enfants.length} enfant(s) et adolescent(s) inscrit(s) · 0 à 15 ans · 25 000 FCFA</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-emerald-50 rounded-xl p-3 text-center">
          <p className="text-lg font-medium text-emerald-700">{enfants.filter(e => e.statut_paiement === 'payé').length}</p>
          <p className="text-xs text-emerald-600">Payés</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-3 text-center">
          <p className="text-lg font-medium text-amber-700">{enfants.filter(e => e.statut_paiement === 'en attente').length}</p>
          <p className="text-xs text-amber-600">En attente</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-3 text-center">
          <p className="text-lg font-medium text-blue-700">{enfants.filter(e => e.statut_paiement === 'partiel').length}</p>
          <p className="text-xs text-blue-600">Partiel</p>
        </div>
      </div>

      {/* Recherche */}
      <input type="text" value={recherche} onChange={e => setRecherche(e.target.value)}
        placeholder="Rechercher par nom ou église..."
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-4 bg-white outline-none focus:border-emerald-400" />

      {/* Liste */}
      {loading && <p className="text-sm text-gray-400 text-center py-8">Chargement...</p>}
      {!loading && filtres.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-8 text-center">
          <p className="text-sm text-gray-400">Aucun enfant ou adolescent inscrit pour le moment.</p>
        </div>
      )}
      <div className="space-y-2">
        {filtres.map(e => (
          <div key={e.id} className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-emerald-50 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-emerald-700">{e.nom_complet.charAt(0)}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-medium text-gray-800">{e.nom_complet}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statutColor[e.statut_paiement] || 'bg-gray-100 text-gray-500'}`}>
                    {e.statut_paiement}
                  </span>
                </div>
                <p className="text-xs text-gray-400">{e.telephone}</p>
                {e.eglise && <p className="text-xs text-gray-400">{e.eglise}</p>}
                <p className="text-xs text-gray-300 mt-0.5">
                  {new Date(e.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <select value={e.statut_paiement} onChange={ev => updateStatut(e.id, ev.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-600 outline-none">
                <option value="en attente">En attente</option>
                <option value="partiel">Partiel</option>
                <option value="payé">Payé</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  )
}
