import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/admin/AdminLayout'

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

export default function ProgrammeAdminPage() {
  const [programme, setProgramme] = useState([])
  const [loading, setLoading] = useState(true)
  const [jourActif, setJourActif] = useState('Lundi')
  const [form, setForm] = useState({ jour: 'Lundi', heure_debut: '', heure_fin: '', activite: '', responsable: '', lieu: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchProgramme() }, [])

  async function fetchProgramme() {
    const { data } = await supabase.from('programme_camp').select('*').order('heure_debut', { ascending: true })
    setProgramme(data || [])
    setLoading(false)
  }

  async function handleAjouter() {
    if (!form.activite || !form.heure_debut) return
    setSaving(true)
    await supabase.from('programme_camp').insert([form])
    setForm({ jour: jourActif, heure_debut: '', heure_fin: '', activite: '', responsable: '', lieu: '' })
    setSaving(false)
    fetchProgramme()
  }

  async function supprimerActivite(id) {
    if (!window.confirm('Supprimer cette activité ?')) return
    await supabase.from('programme_camp').delete().eq('id', id)
    fetchProgramme()
  }

  const activitesDuJour = programme.filter(p => p.jour === jourActif)

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-xl font-medium text-gray-800">Programme du camp</h1>
        <p className="text-sm text-gray-400 mt-0.5">23 – 29 août 2026</p>
      </div>

      {/* Formulaire */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
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
            <label className="block text-xs text-gray-500 mb-1">Activité *</label>
            <input type="text" value={form.activite} onChange={e => setForm({ ...form, activite: e.target.value })}
              placeholder="Ex : Louange et adoration"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Heure début *</label>
            <input type="time" value={form.heure_debut} onChange={e => setForm({ ...form, heure_debut: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Heure fin</label>
            <input type="time" value={form.heure_fin} onChange={e => setForm({ ...form, heure_fin: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Lieu</label>
            <input type="text" value={form.lieu} onChange={e => setForm({ ...form, lieu: e.target.value })}
              placeholder="Ex : Grande salle"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400" />
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-xs text-gray-500 mb-1">Responsable</label>
          <input type="text" value={form.responsable} onChange={e => setForm({ ...form, responsable: e.target.value })}
            placeholder="Ex : AKRE ALPHONSE"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400" />
        </div>
        <button onClick={handleAjouter} disabled={saving}
          className="w-full bg-emerald-700 text-white text-sm font-medium py-3 rounded-xl disabled:opacity-60">
          {saving ? 'Enregistrement...' : 'Ajouter l\'activité'}
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

      {/* Activités du jour */}
      {loading && <p className="text-sm text-gray-400 text-center py-8">Chargement...</p>}
      {!loading && activitesDuJour.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-6 text-center">
          <p className="text-sm text-gray-400">Aucune activité pour {jourActif}.</p>
        </div>
      )}
      <div className="space-y-2">
        {activitesDuJour.map((item) => (
          <div key={item.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs text-emerald-700 font-medium">{item.heure_debut}{item.heure_fin ? ` – ${item.heure_fin}` : ''}</span>
                {item.lieu && <span className="text-xs text-gray-400">· {item.lieu}</span>}
              </div>
              <p className="text-sm font-medium text-gray-800">{item.activite}</p>
              {item.responsable && <p className="text-xs text-gray-400">{item.responsable}</p>}
            </div>
            <button onClick={() => supprimerActivite(item.id)} className="text-gray-300 hover:text-red-400">
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
