import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/admin/AdminLayout'

export default function TresoreriePage() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ type: 'entree', montant: '', description: '', commission: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchTransactions() }, [])

  async function fetchTransactions() {
    const { data } = await supabase.from('transactions').select('*').order('created_at', { ascending: false })
    setTransactions(data || [])
    setLoading(false)
  }

  async function handleAjouter() {
    if (!form.montant || !form.description) return
    setSaving(true)
    await supabase.from('transactions').insert([{
      type: form.type,
      montant: parseInt(form.montant),
      description: form.description,
      commission: form.commission,
    }])
    setForm({ type: 'entree', montant: '', description: '', commission: '' })
    setSaving(false)
    fetchTransactions()
  }

  async function supprimerTransaction(id) {
    if (!window.confirm('Supprimer cette transaction ?')) return
    await supabase.from('transactions').delete().eq('id', id)
    fetchTransactions()
  }

  const entrees = transactions.filter(t => t.type === 'entree').reduce((s, t) => s + t.montant, 0)
  const sorties = transactions.filter(t => t.type === 'sortie').reduce((s, t) => s + t.montant, 0)
  const solde = entrees - sorties

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-xl font-medium text-gray-800">Trésorerie</h1>
        <p className="text-sm text-gray-400 mt-0.5">Suivi des entrées et sorties de fonds</p>
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-emerald-50 rounded-xl p-4">
          <p className="text-xs text-emerald-600 mb-1">Entrées</p>
          <p className="text-lg font-medium text-emerald-700">{entrees.toLocaleString()} F</p>
        </div>
        <div className="bg-red-50 rounded-xl p-4">
          <p className="text-xs text-red-500 mb-1">Dépenses</p>
          <p className="text-lg font-medium text-red-600">{sorties.toLocaleString()} F</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Solde</p>
          <p className={`text-lg font-medium ${solde >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>{solde.toLocaleString()} F</p>
        </div>
      </div>

      {/* Formulaire ajout */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
        <h2 className="text-sm font-medium text-gray-700 mb-4">Ajouter une transaction</h2>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Type</label>
            <select
              value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400"
            >
              <option value="entree">Entrée</option>
              <option value="sortie">Sortie / Dépense</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Montant (FCFA)</label>
            <input
              type="number"
              value={form.montant}
              onChange={e => setForm({ ...form, montant: e.target.value })}
              placeholder="Ex : 50000"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400"
            />
          </div>
        </div>
        <div className="mb-3">
          <label className="block text-xs text-gray-500 mb-1">Description</label>
          <input
            type="text"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Ex : Frais participation YAO Jean"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400"
          />
        </div>
        <div className="mb-4">
          <label className="block text-xs text-gray-500 mb-1">Commission (optionnel)</label>
          <input
            type="text"
            value={form.commission}
            onChange={e => setForm({ ...form, commission: e.target.value })}
            placeholder="Ex : Cuisine, Logistique..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400"
          />
        </div>
        <button
          onClick={handleAjouter}
          disabled={saving}
          className="w-full bg-emerald-700 text-white text-sm font-medium py-3 rounded-xl disabled:opacity-60"
        >
          {saving ? 'Enregistrement...' : 'Ajouter la transaction'}
        </button>
      </div>

      {/* Historique */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <h2 className="text-sm font-medium text-gray-700 mb-4">Historique</h2>
        {loading && <p className="text-sm text-gray-400 text-center py-4">Chargement...</p>}
        {!loading && transactions.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">Aucune transaction enregistrée.</p>
        )}
        {transactions.map((t) => (
          <div key={t.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${t.type === 'entree' ? 'bg-emerald-50' : 'bg-red-50'}`}>
                <svg className={`w-4 h-4 ${t.type === 'entree' ? 'text-emerald-600' : 'text-red-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {t.type === 'entree'
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />}
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-800">{t.description}</p>
                {t.commission && <p className="text-xs text-gray-400">{t.commission}</p>}
                <p className="text-xs text-gray-300">{new Date(t.created_at).toLocaleDateString('fr-FR')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <p className={`text-sm font-medium ${t.type === 'entree' ? 'text-emerald-700' : 'text-red-600'}`}>
                {t.type === 'entree' ? '+' : '-'}{t.montant.toLocaleString()} F
              </p>
              <button onClick={() => supprimerTransaction(t.id)} className="text-gray-300 hover:text-red-400">
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
