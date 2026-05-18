import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/admin/AdminLayout'

export default function DashboardPage() {
  const [stats, setStats] = useState({ campeurs: 0, fonds: 0, depenses: 0, annonces: 0 })
  const [inscriptions, setInscriptions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const [{ data: camp }, { data: trans }, { data: ann }] = await Promise.all([
        supabase.from('inscriptions').select('*'),
        supabase.from('transactions').select('*'),
        supabase.from('annonces').select('*').eq('publie', true),
      ])
      const entrees = (trans || []).filter(t => t.type === 'entree').reduce((s, t) => s + t.montant, 0)
      const sorties = (trans || []).filter(t => t.type === 'sortie').reduce((s, t) => s + t.montant, 0)
      setStats({
        campeurs: (camp || []).length,
        fonds: entrees,
        depenses: sorties,
        annonces: (ann || []).length,
      })
      setInscriptions((camp || []).slice(0, 5))
      setLoading(false)
    }
    fetchData()
  }, [])

  const statCards = [
    { label: 'Campeurs inscrits', value: stats.campeurs, color: 'text-emerald-700', bg: 'bg-emerald-50' },
    { label: 'Fonds collectés', value: stats.fonds.toLocaleString() + ' F', color: 'text-blue-700', bg: 'bg-blue-50' },
    { label: 'Dépenses', value: stats.depenses.toLocaleString() + ' F', color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Annonces publiées', value: stats.annonces, color: 'text-amber-700', bg: 'bg-amber-50' },
  ]

  const statutColor = {
    'payé': 'bg-emerald-50 text-emerald-700',
    'en attente': 'bg-amber-50 text-amber-700',
    'partiel': 'bg-blue-50 text-blue-700',
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-xl font-medium text-gray-800">Tableau de bord</h1>
        <p className="text-sm text-gray-400 mt-0.5">Camp-Navs 2026 · 23 – 29 août · La Sablière, Bingerville</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">{s.label}</p>
            <p className={`text-xl font-medium ${s.color}`}>{loading ? '...' : s.value}</p>
          </div>
        ))}
      </div>

      {/* Solde */}
      <div className="bg-emerald-700 text-white rounded-xl p-5 mb-6">
        <p className="text-sm text-emerald-100 mb-1">Solde disponible</p>
        <p className="text-3xl font-medium">
          {loading ? '...' : (stats.fonds - stats.depenses).toLocaleString()} <span className="text-lg font-normal">FCFA</span>
        </p>
      </div>

      {/* Dernières inscriptions */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-gray-700">Dernières inscriptions</h2>
          <a href="/admin/campeurs" className="text-xs text-emerald-700">Voir tout</a>
        </div>
        {loading && <p className="text-sm text-gray-400 text-center py-4">Chargement...</p>}
        {!loading && inscriptions.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">Aucune inscription pour le moment.</p>
        )}
        {inscriptions.map((ins) => (
          <div key={ins.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
            <div>
              <p className="text-sm font-medium text-gray-800">{ins.nom_complet}</p>
              <p className="text-xs text-gray-400">{ins.tranche_age} · {ins.eglise || 'Non renseigné'}</p>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${statutColor[ins.statut_paiement] || 'bg-gray-100 text-gray-500'}`}>
              {ins.statut_paiement}
            </span>
          </div>
        ))}
      </div>
    </AdminLayout>
  )
}
