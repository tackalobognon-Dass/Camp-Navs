import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/admin/AdminLayout'

const JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

const TYPES_ACTIVITE = [
  { label: 'Louange et adoration', color: '#4C1D95', icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/></svg> },
  { label: 'Message', color: '#054035', icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg> },
  { label: 'Études bibliques', color: '#065F46', icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg> },
  { label: 'Méditation en groupe', color: '#1D4ED8', icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg> },
  { label: 'Méditation individuelle', color: '#0E7490', icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg> },
  { label: "Prière d'ensemble", color: '#7C3AED', icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg> },
  { label: 'Ateliers', color: '#B45309', icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg> },
  { label: 'Repas et repos', color: '#D97706', icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg> },
  { label: 'Sports et loisirs', color: '#166534', icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> },
  { label: 'Soirée récréative', color: '#B45309', icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg> },
  { label: 'Temps en équipe', color: '#0369A1', icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg> },
  { label: 'Toilette et petit déjeuner', color: '#B45309', icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg> },
  { label: 'Dîner', color: '#D97706', icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg> },
  { label: 'Jeûne', color: '#0E7490', icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg> },
  { label: 'Pause', color: '#6B7280', icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg> },
  { label: 'Aller au lit', color: '#1E40AF', icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg> },
  { label: 'Temps libre', color: '#166534', icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/></svg> },
  { label: 'Autre', color: '#6B7280', icon: <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/></svg> },
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
                  <span style={{ display: "flex", alignItems: "center", flexShrink: 0, color: form.type_activite === t.label ? "#fff" : t.color }}>{t.icon}</span>
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
              <div style={{ width: 36, height: 36, borderRadius: 10, background: t.color + '20', border: `1px solid ${t.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: t.color }}>
                {t.icon}
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
