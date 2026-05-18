import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/admin/AdminLayout'

export default function SoireePage() {
  const [activites, setActivites] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ jour: 'Lundi', activite: '', groupe: '', heure: '' })
  const [saving, setSaving] = useState(false)
  const [jourActif, setJourActif] = useState('Lundi')

  const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

  useEffect(() => { fetchActivites() }, [])

  async function fetchActivites() {
    const { data } = await supabase.from('programme_camp')
      .select('*')
      .ilike('activite', '%soirée%')
      .order('heure_debut')
    setActivites(data || [])
    setLoading(false)
  }

  async function handleAjouter() {
    if (!form.activite) return
    setSaving(true)
    await supabase.from('programme_camp').insert([{
      jour: form.jour,
      heure_debut: form.heure,
      activite: `Soirée récréative — ${form.activite}`,
      responsable: form.groupe,
      lieu: 'Salle principale',
    }])
    setForm({ jour: jourActif, activite: '', groupe: '', heure: '' })
    setSaving(false)
    fetchActivites()
  }

  async function supprimerActivite(id) {
    if (!window.confirm('Supprimer cette activité ?')) return
    await supabase.from('programme_camp').delete().eq('id', id)
    fetchActivites()
  }

  const activitesDuJour = activites.filter(a => a.jour === jourActif)

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-xl font-medium text-gray-800">Soirée récréative</h1>
        <p className="text-sm text-gray-400 mt-0.5">Programme des activités et prestations du soir</p>
      </div>

      {/* Formulaire */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 mb-5">
        <h2 className="text-sm font-medium text-gray-700 mb-4">Ajouter une activité</h2>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Jour</label>
            <select value={form.jour} onChange={e => { setForm({ ...form, jour: e.target.value }); setJourActif(e.target.value) }}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none">
              {JOURS.map(j => <option key={j}>{j}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Heure</label>
            <input type="time" value={form.heure} onChange={e => setForm({ ...form, heure: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400" />
          </div>
        </div>
        <div className="mb-3">
          <label className="block text-xs text-gray-500 mb-1">Activité / Prestation *</label>
          <input type="text" value={form.activite} onChange={e => setForm({ ...form, activite: e.target.value })}
            placeholder="Ex : Sketch théâtral, Chant, Jeu collectif..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400" />
        </div>
        <div className="mb-4">
          <label className="block text-xs text-gray-500 mb-1">Groupe / Responsable</label>
          <input type="text" value={form.groupe} onChange={e => setForm({ ...form, groupe: e.target.value })}
            placeholder="Ex : Groupe 1, YAO N'GUESSAN..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400" />
        </div>
        <button onClick={handleAjouter} disabled={saving}
          className="w-full bg-emerald-700 text-white text-sm font-medium py-3 rounded-xl disabled:opacity-60">
          {saving ? 'Enregistrement...' : 'Ajouter'}
        </button>
      </div>

      {/* Sélecteur jour */}
      <div className="flex overflow-x-auto gap-2 mb-4">
        {JOURS.map(j => (
          <button key={j} onClick={() => setJourActif(j)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              jourActif === j ? 'bg-emerald-700 text-white' : 'bg-white text-gray-500 border border-gray-200'
            }`}>
            {j}
          </button>
        ))}
      </div>

      {/* Liste */}
      {loading && <p className="text-sm text-gray-400 text-center py-4">Chargement...</p>}
      {!loading && activitesDuJour.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-6 text-center">
          <p className="text-sm text-gray-400">Aucune activité pour {jourActif}.</p>
        </div>
      )}
      <div className="space-y-2">
        {activitesDuJour.map(a => (
          <div key={a.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">{a.activite}</p>
              <div className="flex gap-3 mt-0.5">
                {a.heure_debut && <span className="text-xs text-emerald-700">{a.heure_debut}</span>}
                {a.responsable && <span className="text-xs text-gray-400">{a.responsable}</span>}
              </div>
            </div>
            <button onClick={() => supprimerActivite(a.id)} className="text-gray-300 hover:text-red-400">
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
