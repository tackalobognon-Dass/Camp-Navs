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

const TYPES_ACTIVITE = [
  { label: 'Louange et adoration',      color: '#4C1D95' },
  { label: 'Message',                   color: '#054035' },
  { label: 'Études bibliques',          color: '#065F46' },
  { label: 'Méditation en groupe',      color: '#1D4ED8' },
  { label: 'Méditation individuelle',   color: '#0E7490' },
  { label: "Prière d'ensemble",         color: '#7C3AED' },
  { label: 'Ateliers',                  color: '#B45309' },
  { label: 'Repas et repos',            color: '#D97706' },
  { label: 'Sports et loisirs',         color: '#166534' },
  { label: 'Soirée récréative',         color: '#C2410C' },
  { label: 'Temps en équipe',           color: '#0369A1' },
  { label: 'Toilette et petit déjeuner',color: '#A16207' },
  { label: 'Dîner',                     color: '#D97706' },
  { label: 'Jeûne',                     color: '#0E7490' },
  { label: 'Pause',                     color: '#6B7280' },
  { label: 'Aller au lit',              color: '#1E40AF' },
  { label: 'Temps libre',               color: '#166534' },
  { label: 'Autre',                     color: '#6B7280' },
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
                        style={{ padding: '7px 10px', borderRadius: 8, border: `1px solid ${sel ? t.color : '#E2E8F0'}`, background: sel ? t.color : '#fff', color: sel ? '#fff' : '#475569', fontSize: 11, fontWeight: sel ? 600 : 400, cursor: 'pointer', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', transition: 'all .15s' }}>
                        {t.label}
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
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: t.color, marginTop: 12, flexShrink: 0 }} />
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
