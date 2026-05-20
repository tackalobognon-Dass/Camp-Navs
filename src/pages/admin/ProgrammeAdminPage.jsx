import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/admin/AdminLayout'

const JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

const TYPES_ACTIVITE = [
  { label: 'Louange et adoration', emoji: '🎵', color: '#534AB7' },
  { label: 'Message', emoji: '📖', color: '#085041' },
  { label: 'Études bibliques', emoji: '📚', color: '#0F6E56' },
  { label: 'Méditation en groupe', emoji: '🧘', color: '#185FA5' },
  { label: 'Méditation individuelle', emoji: '🙏', color: '#185FA5' },
  { label: "Prière d'ensemble", emoji: '🤲', color: '#534AB7' },
  { label: 'Ateliers', emoji: '✏️', color: '#854F0B' },
  { label: 'Repas et repos', emoji: '🍽️', color: '#854F0B' },
  { label: 'Sports et loisirs', emoji: '⚽', color: '#3B6D11' },
  { label: 'Soirée récréative', emoji: '🎉', color: '#993C1D' },
  { label: 'Temps en équipe', emoji: '👥', color: '#185FA5' },
  { label: 'Toilette et petit déjeuner', emoji: '🌅', color: '#854F0B' },
  { label: 'Dîner', emoji: '🍽️', color: '#854F0B' },
  { label: 'Jeûne', emoji: '💧', color: '#185FA5' },
  { label: 'Pause', emoji: '☕', color: '#5F5E5A' },
  { label: 'Aller au lit', emoji: '🌙', color: '#444441' },
  { label: 'Temps libre', emoji: '🌿', color: '#3B6D11' },
  { label: 'Autre', emoji: '📌', color: '#5F5E5A' },
]

const EMPTY_FORM = {
  jour: 'Dimanche',
  type_activite: '',
  activite: '',
  heure_debut: '',
  heure_fin: '',
  responsable: '',
  lieu: '',
}

export default function ProgrammeAdminPage() {
  const [programme, setProgramme] = useState([])
  const [loading, setLoading] = useState(true)
  const [jourActif, setJourActif] = useState('Dimanche')
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => { fetchProgramme() }, [])

  async function fetchProgramme() {
    const { data } = await supabase
      .from('programme_camp')
      .select('*')
      .order('heure_debut', { ascending: true })
    setProgramme(data || [])
    setLoading(false)
  }

  function setF(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function openNew() {
    setForm({ ...EMPTY_FORM, jour: jourActif })
    setEditId(null)
    setShowForm(true)
  }

  function openEdit(item) {
    setForm({
      jour: item.jour,
      type_activite: item.type_activite || '',
      activite: item.activite,
      heure_debut: item.heure_debut || '',
      heure_fin: item.heure_fin || '',
      responsable: item.responsable || '',
      lieu: item.lieu || '',
    })
    setEditId(item.id)
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.activite || !form.heure_debut) return
    setSaving(true)
    const payload = {
      jour: form.jour,
      type_activite: form.type_activite || 'Autre',
      activite: form.activite,
      heure_debut: form.heure_debut,
      heure_fin: form.heure_fin,
      responsable: form.responsable,
      lieu: form.lieu,
    }
    if (editId) {
      await supabase.from('programme_camp').update(payload).eq('id', editId)
    } else {
      await supabase.from('programme_camp').insert([payload])
    }
    setSaving(false)
    setShowForm(false)
    setEditId(null)
    setForm(EMPTY_FORM)
    fetchProgramme()
  }

  async function handleDelete(id) {
    if (!window.confirm('Supprimer cette activité ?')) return
    await supabase.from('programme_camp').delete().eq('id', id)
    fetchProgramme()
  }

  const activitesDuJour = programme
    .filter(p => p.jour === jourActif)
    .sort((a, b) => (a.heure_debut || '').localeCompare(b.heure_debut || ''))

  const typeInfo = (t) => TYPES_ACTIVITE.find(x => x.label === t) || TYPES_ACTIVITE[TYPES_ACTIVITE.length - 1]

  return (
    <AdminLayout>
      <div className="mb-5 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-medium text-gray-800">Programme du camp</h1>
          <p className="text-sm text-gray-400 mt-0.5">23 – 29 août 2026</p>
        </div>
        <button onClick={openNew}
          className="bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-xl flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Ajouter
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-5">
          <h2 className="text-sm font-medium text-gray-700 mb-4">
            {editId ? "Modifier l'activité" : 'Nouvelle activité'}
          </h2>

          {/* Jour */}
          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-1">Jour</label>
            <select value={form.jour} onChange={e => setF('jour', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none">
              {JOURS.map(j => <option key={j}>{j}</option>)}
            </select>
          </div>

          {/* Type d'activité — grille adaptée mobile */}
          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-2">Type d'activité</label>
            <div className="grid grid-cols-2 gap-2">
              {TYPES_ACTIVITE.map(t => (
                <button key={t.label}
                  onClick={() => { setF('type_activite', t.label); setF('activite', t.label) }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all text-left"
                  style={{
                    border: `0.5px solid ${form.type_activite === t.label ? t.color : '#e5e5e0'}`,
                    background: form.type_activite === t.label ? t.color : '#fff',
                    color: form.type_activite === t.label ? '#fff' : '#555',
                  }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{t.emoji}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Nom activité */}
          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-1">Nom de l'activité *</label>
            <input type="text" value={form.activite} onChange={e => setF('activite', e.target.value)}
              placeholder="Ex : Louange et adoration"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400" />
          </div>

          {/* Heures */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Heure début *</label>
              <input type="time" value={form.heure_debut} onChange={e => setF('heure_debut', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Heure fin</label>
              <input type="time" value={form.heure_fin} onChange={e => setF('heure_fin', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400" />
            </div>
          </div>

          {/* Responsable & Lieu */}
          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-1">Responsable</label>
            <input type="text" value={form.responsable} onChange={e => setF('responsable', e.target.value)}
              placeholder="Ex : AKRE ALPHONSE"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400 mb-3" />
            <label className="block text-xs text-gray-500 mb-1">Lieu</label>
            <input type="text" value={form.lieu} onChange={e => setF('lieu', e.target.value)}
              placeholder="Ex : Grande salle"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400" />
          </div>

          <div className="flex gap-3">
            <button onClick={() => { setShowForm(false); setEditId(null) }}
              className="flex-1 bg-gray-100 text-gray-600 text-sm font-medium py-3 rounded-xl">
              Annuler
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 bg-emerald-700 text-white text-sm font-medium py-3 rounded-xl disabled:opacity-60">
              {saving ? 'Enregistrement...' : editId ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </div>
      )}

      {/* Sélecteur de jours — scroll horizontal */}
      <div className="flex gap-2 overflow-x-auto mb-4 pb-1" style={{ scrollbarWidth: 'none' }}>
        {JOURS.map(j => (
          <button key={j} onClick={() => setJourActif(j)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              border: `0.5px solid ${jourActif === j ? '#085041' : '#e5e5e0'}`,
              background: jourActif === j ? '#085041' : '#fff',
              color: jourActif === j ? '#fff' : '#666',
            }}>
            {j}
          </button>
        ))}
      </div>

      {/* Liste activités */}
      {loading && <p className="text-sm text-gray-400 text-center py-8">Chargement...</p>}

      {!loading && activitesDuJour.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-6 text-center">
          <p className="text-sm text-gray-400">Aucune activité pour {jourActif}.</p>
          <button onClick={openNew} className="mt-3 text-sm text-emerald-700 font-medium">
            + Ajouter une activité
          </button>
        </div>
      )}

      <div className="space-y-2">
        {activitesDuJour.map(item => {
          const t = typeInfo(item.type_activite)
          return (
            <div key={item.id} className="bg-white border border-gray-100 rounded-xl p-3 flex items-center gap-3">
              <div style={{ width: 36, height: 36, borderRadius: 10, background: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>
                {t.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{item.activite}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {item.heure_debut}{item.heure_fin ? ` – ${item.heure_fin}` : ''}
                  {item.lieu ? ` · ${item.lieu}` : ''}
                </p>
                {item.responsable && <p className="text-xs text-gray-400">{item.responsable}</p>}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => openEdit(item)}
                  style={{ width: 32, height: 32, borderRadius: 8, background: '#E1F5EE', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg style={{ width: 14, height: 14, color: '#085041' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button onClick={() => handleDelete(item.id)}
                  style={{ width: 32, height: 32, borderRadius: 8, background: '#FCEBEB', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg style={{ width: 14, height: 14, color: '#A32D2D' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </AdminLayout>
  )
}
