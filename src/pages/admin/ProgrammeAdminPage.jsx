import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/admin/AdminLayout'

const VERT = '#1B3B2B'
const VERT_CLAIR = '#E8F5E8'

const JOURS = [
  { key: 'Dimanche',  date: '23 août' },
  { key: 'Lundi',     date: '24 août' },
  { key: 'Mardi',     date: '25 août' },
  { key: 'Mercredi',  date: '26 août' },
  { key: 'Jeudi',     date: '27 août' },
  { key: 'Vendredi',  date: '28 août' },
  { key: 'Samedi',    date: '29 août' },
]

const ic = (d) => <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d={d}/></svg>

const TYPES_ACTIVITE = [
  { label: 'Louange et adoration',       color: '#4C1D95', icon: ic('M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3') },
  { label: 'Message',                    color: '#054035', icon: ic('M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253') },
  { label: 'Études bibliques',           color: '#065F46', icon: ic('M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4') },
  { label: 'Méditation en groupe',       color: '#1D4ED8', icon: ic('M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z') },
  { label: 'Méditation individuelle',    color: '#0E7490', icon: ic('M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z') },
  { label: "Prière d'ensemble",          color: '#7C3AED', icon: ic('M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z') },
  { label: 'Ateliers',                   color: '#B45309', icon: ic('M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z') },
  { label: 'Repas et repos',             color: '#D97706', icon: ic('M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z') },
  { label: 'Sports et loisirs',          color: '#166534', icon: ic('M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664zM21 12a9 9 0 11-18 0 9 9 0 0118 0z') },
  { label: 'Soirée récréative',          color: '#C2410C', icon: ic('M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z') },
  { label: 'Temps en équipe',            color: '#0369A1', icon: ic('M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z') },
  { label: 'Toilette et petit déjeuner', color: '#A16207', icon: ic('M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z') },
  { label: 'Dîner',                      color: '#D97706', icon: ic('M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z') },
  { label: 'Jeûne',                      color: '#0E7490', icon: ic('M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z') },
  { label: 'Pause',                      color: '#6B7280', icon: ic('M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z') },
  { label: 'Aller au lit',               color: '#1E40AF', icon: ic('M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z') },
  { label: 'Temps libre',                color: '#166534', icon: ic('M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z') },
  { label: 'Autre',                      color: '#6B7280', icon: ic('M12 6v6m0 0v6m0-6h6m-6 0H6') },
]

const EMPTY_FORM = { jour: 'Dimanche', type_activite: '', activite: '', heure_debut: '', heure_fin: '', responsable: '', lieu: '' }

const iS = { width: '100%', border: '1px solid #E2E8F0', borderRadius: 10, padding: '9px 12px', fontSize: 13, outline: 'none', background: '#fff', color: '#1E293B' }
const lS = { fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4, fontWeight: 500 }

function getTypeInfo(label) {
  return TYPES_ACTIVITE.find(t => t.label === label) || { label: 'Autre', color: '#6B7280' }
}

function formatHeure(h) {
  if (!h) return ''
  return h.slice(0, 5)
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
    const { data } = await supabase.from('programme_camp').select('*').order('heure_debut', { ascending: true })
    setProgramme(data || [])
    setLoading(false)
  }

  function setF(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function openNew() {
    setForm({ ...EMPTY_FORM, jour: jourActif })
    setEditId(null); setShowForm(true)
  }

  function openEdit(item) {
    setForm({ jour: item.jour, type_activite: item.type_activite || '', activite: item.activite, heure_debut: item.heure_debut || '', heure_fin: item.heure_fin || '', responsable: item.responsable || '', lieu: item.lieu || '' })
    setEditId(item.id); setShowForm(true)
  }

  async function handleSave() {
    if (!form.activite || !form.heure_debut) return
    setSaving(true)
    const payload = { jour: form.jour, type_activite: form.type_activite || 'Autre', activite: form.activite, heure_debut: form.heure_debut, heure_fin: form.heure_fin, responsable: form.responsable, lieu: form.lieu }
    if (editId) await supabase.from('programme_camp').update(payload).eq('id', editId)
    else await supabase.from('programme_camp').insert([payload])
    setSaving(false); setShowForm(false); setEditId(null); setForm(EMPTY_FORM)
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

  const totalParJour = (j) => programme.filter(p => p.jour === j).length

  return (
    <AdminLayout>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#F8FAFC', overflow: 'hidden' }}>

        {/* ── HEADER FIXE ── */}
        <div style={{ flexShrink: 0, background: '#F8FAFC', zIndex: 2, position: 'relative', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderBottom: '1px solid #E2E8F0' }}>
          {/* Titre + bouton */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 14px 10px' }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1E293B', margin: 0 }}>Programme</h1>
              <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 0' }}>Camp-Navs · 23 – 29 août 2026 · {programme.length} activité(s)</p>
            </div>
            <button type="button" onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ ...EMPTY_FORM, jour: jourActif }) }}
              style={{ width: 32, height: 32, borderRadius: '50%', background: showForm && !editId ? '#FEF2F2' : VERT, color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 300 }}>
              {showForm && !editId ? '×' : '+'}
            </button>
          </div>

          {/* Sélecteur de jours */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', padding: '0 14px 12px' }}>
            {JOURS.map(j => {
              const actif = jourActif === j.key
              const nb = totalParJour(j.key)
              return (
                <button key={j.key} type="button" onClick={() => setJourActif(j.key)}
                  style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px 12px', borderRadius: 12, border: `1px solid ${actif ? VERT : '#E2E8F0'}`, background: actif ? VERT : '#fff', cursor: 'pointer', minWidth: 64, transition: 'all .2s' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: actif ? '#fff' : '#1E293B' }}>{j.key.slice(0, 3)}</span>
                  <span style={{ fontSize: 9, color: actif ? 'rgba(255,255,255,0.7)' : '#94A3B8', marginTop: 1 }}>{j.date}</span>
                  {nb > 0 && (
                    <span style={{ fontSize: 9, fontWeight: 700, marginTop: 3, background: actif ? 'rgba(255,255,255,0.2)' : VERT_CLAIR, color: actif ? '#fff' : VERT, borderRadius: 10, padding: '1px 6px' }}>
                      {nb}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── ZONE SCROLLABLE ── */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '12px 14px 14px' }}>

          {/* Formulaire */}
          {showForm && (
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: 14, marginBottom: 12 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', margin: '0 0 12px' }}>
                {editId ? "Modifier l'activité" : 'Nouvelle activité'}
              </p>

              {/* Jour */}
              <div style={{ marginBottom: 10 }}>
                <label style={lS}>Jour</label>
                <select value={form.jour} onChange={e => setF('jour', e.target.value)} style={iS}>
                  {JOURS.map(j => <option key={j.key} value={j.key}>{j.key} {j.date}</option>)}
                </select>
              </div>

              {/* Type d'activité */}
              <div style={{ marginBottom: 10 }}>
                <label style={lS}>Type d'activité</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {TYPES_ACTIVITE.map(t => {
                    const sel = form.type_activite === t.label
                    return (
                      <button key={t.label} type="button"
                        onClick={() => { setF('type_activite', t.label); if (!form.activite || form.activite === form.type_activite) setF('activite', t.label) }}
                        style={{ padding: '7px 10px', borderRadius: 8, border: `1px solid ${sel ? t.color : '#E2E8F0'}`, background: sel ? t.color : '#fff', color: sel ? '#fff' : '#475569', fontSize: 11, fontWeight: sel ? 600 : 400, cursor: 'pointer', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', transition: 'all .15s', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ flexShrink: 0, color: sel ? '#fff' : t.color }}>{t.icon}</span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Nom */}
              <div style={{ marginBottom: 10 }}>
                <label style={lS}>Nom de l'activité *</label>
                <input type="text" value={form.activite} onChange={e => setF('activite', e.target.value)} placeholder="Ex : Louange et adoration" style={iS} />
              </div>

              {/* Heures */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={lS}>Heure début *</label>
                  <input type="time" value={form.heure_debut} onChange={e => setF('heure_debut', e.target.value)} style={iS} />
                </div>
                <div>
                  <label style={lS}>Heure fin</label>
                  <input type="time" value={form.heure_fin} onChange={e => setF('heure_fin', e.target.value)} style={iS} />
                </div>
              </div>

              {/* Responsable & Lieu */}
              <div style={{ marginBottom: 10 }}>
                <label style={lS}>Responsable</label>
                <input type="text" value={form.responsable} onChange={e => setF('responsable', e.target.value)} placeholder="Ex : AKRE ALPHONSE" style={iS} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={lS}>Lieu</label>
                <input type="text" value={form.lieu} onChange={e => setF('lieu', e.target.value)} placeholder="Ex : Grande salle, Chapelle..." style={iS} />
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => { setShowForm(false); setEditId(null) }}
                  style={{ flex: 1, background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 10, padding: 10, fontSize: 13, cursor: 'pointer' }}>
                  Annuler
                </button>
                <button type="button" onClick={handleSave} disabled={saving || !form.activite || !form.heure_debut}
                  style={{ flex: 1, background: VERT, color: '#fff', border: 'none', borderRadius: 10, padding: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving || !form.activite || !form.heure_debut ? 0.7 : 1 }}>
                  {saving ? '...' : editId ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </div>
          )}

          {loading && <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '30px 0' }}>Chargement...</p>}

          {!loading && activitesDuJour.length === 0 && (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: 28, textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: '#94A3B8', margin: '0 0 10px' }}>Aucune activité pour {jourActif}.</p>
              <button type="button" onClick={openNew}
                style={{ fontSize: 13, color: VERT, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                + Ajouter une activité
              </button>
            </div>
          )}

          {/* Timeline des activités */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {activitesDuJour.map((item, i) => {
              const t = getTypeInfo(item.type_activite)
              return (
                <div key={item.id} style={{ display: 'flex', gap: 10 }}>
                  {/* Heure */}
                  <div style={{ width: 50, flexShrink: 0, paddingTop: 10, textAlign: 'right' }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#1E293B', margin: 0, lineHeight: 1 }}>{formatHeure(item.heure_debut)}</p>
                    {item.heure_fin && <p style={{ fontSize: 10, color: '#94A3B8', margin: '2px 0 0' }}>{formatHeure(item.heure_fin)}</p>}
                  </div>

                  {/* Ligne verticale */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: t.color + '18', border: `1.5px solid ${t.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 8, flexShrink: 0, color: t.color }}>
                    {t.icon}
                  </div>
                    {i < activitesDuJour.length - 1 && (
                      <div style={{ width: 2, flex: 1, background: '#F1F5F9', marginTop: 3 }} />
                    )}
                  </div>

                  {/* Carte activité */}
                  <div style={{ flex: 1, background: '#fff', borderRadius: 12, border: '1px solid #F1F5F9', padding: '10px 12px', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          {item.type_activite && (
                            <span style={{ fontSize: 9, fontWeight: 700, background: t.color + '18', color: t.color, borderRadius: 20, padding: '2px 8px', flexShrink: 0 }}>
                              {item.type_activite}
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.activite}</p>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {item.responsable && <span style={{ fontSize: 11, color: '#64748B' }}>{item.responsable}</span>}
                          {item.lieu && <span style={{ fontSize: 11, color: '#94A3B8' }}>📍 {item.lieu}</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                        <button type="button" onClick={() => openEdit(item)}
                          style={{ width: 28, height: 28, borderRadius: 8, background: VERT_CLAIR, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke={VERT} strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                        </button>
                        <button type="button" onClick={() => handleDelete(item.id)}
                          style={{ width: 28, height: 28, borderRadius: 8, background: '#FEF2F2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#DC2626" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

        </div>
      </div>
    </AdminLayout>
  )
}
