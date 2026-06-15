import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/admin/AdminLayout'

const VERT = '#1B3B2B'
const VERT_CLAIR = '#E8F5E8'
const DECISIONS = ['Aucune', 'Accepté Christ', 'Rengagement', 'Baptême', 'Autre']
const STATUTS = ['En attente', 'Suivi en cours', 'Intégré groupe étude', 'Perdu de vue']
const STATUT_CONFIG = {
  'En attente':           { bg: '#F1F5F9', color: '#475569', border: '#CBD5E1', dot: '#94A3B8' },
  'Suivi en cours':       { bg: '#EFF6FF', color: '#1D4ED8', border: '#93C5FD', dot: '#1D4ED8' },
  'Intégré groupe étude': { bg: '#ECFDF5', color: '#065F46', border: '#6EE7B7', dot: '#059669' },
  'Perdu de vue':         { bg: '#FEF2F2', color: '#DC2626', border: '#FCA5A5', dot: '#DC2626' },
}
const EMPTY_FORM = {
  nom_campeur: '', telephone: '', decision_camp: 'Aucune', engagement: '',
  contacte: false, date_contact: '', lieu_vie: '', responsable: '',
  statut: 'En attente', groupe_etude: '', notes: '',
}
const iS = { width: '100%', border: '1px solid #E2E8F0', borderRadius: 10, padding: '8px 12px', fontSize: 13, outline: 'none', background: '#fff', color: '#1E293B' }
const lS = { display: 'block', fontSize: 11, color: '#64748B', marginBottom: 4, fontWeight: 500 }

function exportExcel(suivis) {
  const wb = XLSX.utils.book_new()
  const now = new Date().toLocaleDateString('fr-FR')
  const data = suivis.map(s => ({
    'Nom':              s.nom_campeur || '',
    'Téléphone':        s.telephone || '',
    'Décision au camp': s.decision_camp || '',
    'Engagement':       s.engagement || '',
    'Contacté':         s.contacte ? 'Oui' : 'Non',
    'Date contact':     s.date_contact ? new Date(s.date_contact).toLocaleDateString('fr-FR') : '',
    'Lieu de vie':      s.lieu_vie || '',
    'Responsable':      s.responsable || '',
    'Statut':           s.statut || '',
    'Groupe étude':     s.groupe_etude || '',
    'Notes':            s.notes || '',
  }))
  const resume = [
    { 'Indicateur': 'Total fiches',            'Valeur': suivis.length },
    { 'Indicateur': 'Décisions prises',        'Valeur': suivis.filter(s => s.decision_camp && s.decision_camp !== 'Aucune').length },
    { 'Indicateur': 'Contactés',               'Valeur': suivis.filter(s => s.contacte).length },
    { 'Indicateur': 'Intégrés en groupe',      'Valeur': suivis.filter(s => s.statut === 'Intégré groupe étude').length },
    { 'Indicateur': 'Perdus de vue',           'Valeur': suivis.filter(s => s.statut === 'Perdu de vue').length },
    { 'Indicateur': 'Exporté le',              'Valeur': now },
  ]
  function ws(d) {
    if (!d.length) return XLSX.utils.json_to_sheet([])
    const s = XLSX.utils.json_to_sheet(d)
    s['!cols'] = Object.keys(d[0]).map(k => ({ wch: Math.max(...d.map(r => String(r[k] || '').length), k.length, 10) }))
    return s
  }
  XLSX.utils.book_append_sheet(wb, ws(resume), 'Résumé')
  XLSX.utils.book_append_sheet(wb, ws(data), 'Toutes les fiches')
  XLSX.utils.book_append_sheet(wb, ws(data.filter((_, i) => suivis[i].decision_camp && suivis[i].decision_camp !== 'Aucune')), 'Décisions')
  XLSX.writeFile(wb, `SuiviPostCamp_${now.replace(/\//g, '-')}.xlsx`)
}

function InfoLigne({ label, valeur }) {
  if (!valeur) return null
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '7px 0', borderBottom: '1px solid #F1F5F9' }}>
      <span style={{ fontSize: 12, color: '#64748B', flexShrink: 0, marginRight: 12 }}>{label}</span>
      <span style={{ fontSize: 12, color: '#1E293B', fontWeight: 500, textAlign: 'right' }}>{valeur}</span>
    </div>
  )
}

export default function SuiviPostCampPage() {
  const [suivis, setSuivis] = useState([])
  const [inscriptions, setInscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [recherche, setRecherche] = useState('')
  const [filtreStatut, setFiltreStatut] = useState('tous')
  const [ficheOuverte, setFicheOuverte] = useState(null)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const [{ data: s }, { data: ins }] = await Promise.all([
      supabase.from('suivi_post_camp').select('*').order('created_at', { ascending: false }),
      supabase.from('inscriptions').select('id, nom_complet, telephone').order('nom_complet'),
    ])
    setSuivis(s || [])
    setInscriptions(ins || [])
    setLoading(false)
  }

  function setF(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function openNew() { setForm(EMPTY_FORM); setEditId(null); setShowForm(true) }

  function openEdit(s) {
    setForm({ nom_campeur: s.nom_campeur, telephone: s.telephone || '', decision_camp: s.decision_camp || 'Aucune', engagement: s.engagement || '', contacte: s.contacte || false, date_contact: s.date_contact || '', lieu_vie: s.lieu_vie || '', responsable: s.responsable || '', statut: s.statut || 'En attente', groupe_etude: s.groupe_etude || '', notes: s.notes || '' })
    setEditId(s.id); setShowForm(true); setFicheOuverte(null)
  }

  async function handleSave() {
    if (!form.nom_campeur) return
    setSaving(true)
    const payload = { ...form, updated_at: new Date().toISOString() }
    if (editId) await supabase.from('suivi_post_camp').update(payload).eq('id', editId)
    else await supabase.from('suivi_post_camp').insert([payload])
    setSaving(false); setShowForm(false); setEditId(null); setForm(EMPTY_FORM); fetchData()
  }

  async function supprimerSuivi(id) {
    if (!window.confirm('Supprimer cette fiche de suivi ?')) return
    await supabase.from('suivi_post_camp').delete().eq('id', id)
    setFicheOuverte(null); fetchData()
  }

  async function importerTousCampeurs() {
    if (!window.confirm(`Créer une fiche de suivi pour chaque campeur inscrit ? (${inscriptions.length} campeurs)`)) return
    setSaving(true)
    const existants = new Set(suivis.map(s => s.nom_campeur))
    const nouveaux = inscriptions.filter(i => !existants.has(i.nom_complet))
    for (const ins of nouveaux) {
      await supabase.from('suivi_post_camp').insert([{ ...EMPTY_FORM, nom_campeur: ins.nom_complet, telephone: ins.telephone || '' }])
    }
    setSaving(false); fetchData()
  }

  const total    = suivis.length
  const integres = suivis.filter(s => s.statut === 'Intégré groupe étude').length
  const perdus   = suivis.filter(s => s.statut === 'Perdu de vue').length
  const decisions = suivis.filter(s => s.decision_camp && s.decision_camp !== 'Aucune').length
  const contactes = suivis.filter(s => s.contacte).length

  const filtres = suivis
    .filter(s => filtreStatut === 'tous' || s.statut === filtreStatut)
    .filter(s => s.nom_campeur.toLowerCase().includes(recherche.toLowerCase()) || (s.responsable && s.responsable.toLowerCase().includes(recherche.toLowerCase())))

  const chipS = (active) => ({ flexShrink: 0, padding: '5px 13px', borderRadius: 20, fontSize: 12, fontWeight: active ? 700 : 500, cursor: 'pointer', border: `1px solid ${active ? VERT : '#E2E8F0'}`, background: active ? VERT : '#fff', color: active ? '#fff' : '#64748B', transition: 'all .2s' })

  return (
    <AdminLayout>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#F8FAFC', overflow: 'hidden' }}>

        {/* ── HEADER FIXE ── */}
        <div style={{ flexShrink: 0, background: '#F8FAFC', zIndex: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderBottom: '1px solid #E2E8F0' }}>
          <div style={{ padding: '14px 14px 10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1E293B', margin: 0 }}>Suivi post-camp</h1>
                <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 0' }}>{total} fiche(s) · {decisions} décision(s) · {integres} intégré(s)</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => exportExcel(suivis)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, background: VERT_CLAIR, color: VERT, border: `1px solid ${VERT}`, borderRadius: 10, padding: '7px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                  Excel
                </button>
                <button type="button" onClick={() => { setShowForm(!showForm); setEditId(null); setForm(EMPTY_FORM) }}
                  style={{ width: 32, height: 32, borderRadius: '50%', background: showForm && !editId ? '#FEF2F2' : VERT, color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 300 }}>
                  {showForm && !editId ? '×' : '+'}
                </button>
              </div>
            </div>
            {/* Recherche */}
            <div style={{ position: 'relative', marginBottom: 10 }}>
              <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#94A3B8" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              <input type="text" value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Rechercher par nom ou responsable..."
                style={{ ...iS, paddingLeft: 30, fontSize: 12 }} />
            </div>
            {/* Filtres */}
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
              {[
                { key: 'tous',                    label: `Tous (${total})` },
                { key: 'En attente',              label: `En attente (${suivis.filter(s => s.statut === 'En attente').length})` },
                { key: 'Suivi en cours',          label: `En cours (${suivis.filter(s => s.statut === 'Suivi en cours').length})` },
                { key: 'Intégré groupe étude',    label: `Intégrés (${integres})` },
                { key: 'Perdu de vue',            label: `Perdus (${perdus})` },
              ].map(f => (
                <button key={f.key} type="button" onClick={() => setFiltreStatut(f.key)} style={chipS(filtreStatut === f.key)}>{f.label}</button>
              ))}
            </div>
          </div>
        </div>

        {/* ── ZONE SCROLLABLE ── */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '12px 14px 14px' }}>

          {/* KPI */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginBottom: 12 }}>
            {[
              { val: decisions,  label: 'Décisions',  bg: '#F5F3FF', color: '#6D28D9', border: '#DDD6FE' },
              { val: contactes,  label: 'Contactés',  bg: '#EFF6FF', color: '#1D4ED8', border: '#93C5FD' },
              { val: integres,   label: 'Intégrés',   bg: '#ECFDF5', color: '#065F46', border: '#6EE7B7' },
              { val: perdus,     label: 'Perdus',     bg: perdus > 0 ? '#FEF2F2' : '#F8FAFC', color: perdus > 0 ? '#DC2626' : '#94A3B8', border: perdus > 0 ? '#FCA5A5' : '#E2E8F0' },
            ].map(s => (
              <div key={s.label} style={{ background: s.bg, borderRadius: 10, border: `1px solid ${s.border}`, padding: '8px 6px', textAlign: 'center' }}>
                <p style={{ fontSize: 20, fontWeight: 700, color: s.color, margin: '0 0 2px', lineHeight: 1 }}>{s.val}</p>
                <p style={{ fontSize: 9, color: '#94A3B8', margin: 0 }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Bouton import campeurs */}
          {inscriptions.length > 0 && suivis.length < inscriptions.length && (
            <button type="button" onClick={importerTousCampeurs} disabled={saving}
              style={{ width: '100%', marginBottom: 12, background: '#fff', color: VERT, border: `1px dashed ${VERT}`, borderRadius: 10, padding: '10px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
              Importer tous les campeurs inscrits ({inscriptions.length - suivis.length} manquants)
            </button>
          )}

          {/* Formulaire */}
          {showForm && (
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: 14, marginBottom: 12 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', margin: '0 0 12px' }}>{editId ? 'Modifier la fiche' : 'Nouvelle fiche de suivi'}</p>

              {/* Import depuis inscription */}
              <div style={{ marginBottom: 10 }}>
                <label style={lS}>Choisir depuis les inscriptions</label>
                <select onChange={e => { const ins = inscriptions.find(i => i.id === e.target.value); if (ins) { setF('nom_campeur', ins.nom_complet); setF('telephone', ins.telephone || '') } }} style={iS} defaultValue="">
                  <option value="">-- Sélectionner un campeur --</option>
                  {inscriptions.map(i => <option key={i.id} value={i.id}>{i.nom_complet}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                <div><label style={lS}>Nom complet *</label><input type="text" value={form.nom_campeur} onChange={e => setF('nom_campeur', e.target.value)} placeholder="Nom du campeur" style={iS} /></div>
                <div><label style={lS}>Téléphone</label><input type="text" value={form.telephone} onChange={e => setF('telephone', e.target.value)} placeholder="07 XX XX XX XX" style={iS} /></div>
              </div>

              {/* Suivi spirituel */}
              <div style={{ background: '#F8FAFC', borderRadius: 10, padding: 12, marginBottom: 10 }}>
                <p style={{ fontSize: 9, fontWeight: 700, color: VERT, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 10px' }}>Suivi spirituel</p>
                <div style={{ marginBottom: 8 }}><label style={lS}>Décision au camp</label><select value={form.decision_camp} onChange={e => setF('decision_camp', e.target.value)} style={iS}>{DECISIONS.map(d => <option key={d}>{d}</option>)}</select></div>
                <div><label style={lS}>Engagement / Description</label><textarea value={form.engagement} onChange={e => setF('engagement', e.target.value)} placeholder="Décrivez l'engagement pris..." rows={2} style={{ ...iS, resize: 'none' }} /></div>
              </div>

              {/* Contact */}
              <div style={{ background: '#F8FAFC', borderRadius: 10, padding: 12, marginBottom: 10 }}>
                <p style={{ fontSize: 9, fontWeight: 700, color: VERT, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 10px' }}>Contact après camp</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <input type="checkbox" id="contacte" checked={form.contacte} onChange={e => setF('contacte', e.target.checked)} style={{ width: 16, height: 16, accentColor: VERT }} />
                  <label htmlFor="contacte" style={{ fontSize: 12, color: '#475569' }}>Le campeur a été recontacté</label>
                </div>
                {form.contacte && <div style={{ marginBottom: 8 }}><label style={lS}>Date du contact</label><input type="date" value={form.date_contact} onChange={e => setF('date_contact', e.target.value)} style={iS} /></div>}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div><label style={lS}>Lieu de vie</label><input type="text" value={form.lieu_vie} onChange={e => setF('lieu_vie', e.target.value)} placeholder="Ex : Cocody" style={iS} /></div>
                  <div><label style={lS}>Responsable suivi</label><input type="text" value={form.responsable} onChange={e => setF('responsable', e.target.value)} placeholder="Nom" style={iS} /></div>
                </div>
              </div>

              {/* Statut */}
              <div style={{ background: '#F8FAFC', borderRadius: 10, padding: 12, marginBottom: 12 }}>
                <p style={{ fontSize: 9, fontWeight: 700, color: VERT, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 10px' }}>Statut</p>
                <div style={{ marginBottom: 8 }}><label style={lS}>Statut actuel</label><select value={form.statut} onChange={e => setF('statut', e.target.value)} style={iS}>{STATUTS.map(s => <option key={s}>{s}</option>)}</select></div>
                {form.statut === 'Intégré groupe étude' && <div style={{ marginBottom: 8 }}><label style={lS}>Groupe d'étude biblique</label><input type="text" value={form.groupe_etude} onChange={e => setF('groupe_etude', e.target.value)} placeholder="Ex : Groupe Cocody Nord" style={iS} /></div>}
                <div><label style={lS}>Notes</label><textarea value={form.notes} onChange={e => setF('notes', e.target.value)} placeholder="Informations complémentaires..." rows={2} style={{ ...iS, resize: 'none' }} /></div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => { setShowForm(false); setEditId(null) }} style={{ flex: 1, background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 10, padding: 10, fontSize: 13, cursor: 'pointer' }}>Annuler</button>
                <button type="button" onClick={handleSave} disabled={saving || !form.nom_campeur} style={{ flex: 1, background: VERT, color: '#fff', border: 'none', borderRadius: 10, padding: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving || !form.nom_campeur ? 0.7 : 1 }}>{saving ? '...' : editId ? 'Modifier' : 'Enregistrer'}</button>
              </div>
            </div>
          )}

          {loading && <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '20px 0' }}>Chargement...</p>}

          {!loading && filtres.length === 0 && (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: 24, textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>Aucune fiche de suivi.</p>
            </div>
          )}

          {/* ── LISTE ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtres.map(s => {
              const sc = STATUT_CONFIG[s.statut] || STATUT_CONFIG['En attente']
              return (
                <div key={s.id} onClick={() => setFicheOuverte(s)}
                  style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', borderLeft: `3px solid ${sc.dot}`, padding: '11px 14px', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: sc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: sc.color }}>{s.nom_campeur?.charAt(0)}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.nom_campeur}</p>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {s.responsable && <span style={{ fontSize: 10, color: '#94A3B8' }}>Resp : {s.responsable}</span>}
                        {s.decision_camp && s.decision_camp !== 'Aucune' && (
                          <span style={{ fontSize: 9, background: '#F5F3FF', color: '#6D28D9', borderRadius: 20, padding: '1px 7px', fontWeight: 600 }}>{s.decision_camp}</span>
                        )}
                        {s.contacte && <span style={{ fontSize: 9, background: VERT_CLAIR, color: VERT, borderRadius: 20, padding: '1px 7px', fontWeight: 600 }}>Contacté</span>}
                      </div>
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 700, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, borderRadius: 20, padding: '2px 8px', flexShrink: 0 }}>
                      {s.statut}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── FICHE DÉTAILLÉE ── */}
      {ficheOuverte && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setFicheOuverte(null)}>
          <div style={{ background: '#F8FAFC', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 480, maxHeight: '88vh', overflowY: 'auto', paddingBottom: 28 }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 36, height: 3, background: '#E2E8F0', borderRadius: 2, margin: '14px auto 0' }} />
            <div style={{ padding: '14px 16px 0' }}>
              {/* En-tête */}
              {(() => {
                const sc = STATUT_CONFIG[ficheOuverte.statut] || STATUT_CONFIG['En attente']
                return (
                  <div style={{ background: VERT, borderRadius: 14, padding: '14px 16px', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>{ficheOuverte.nom_campeur}</p>
                      <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: 20, padding: '2px 10px' }}>{ficheOuverte.statut}</span>
                    </div>
                    {ficheOuverte.telephone && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', margin: 0 }}>{ficheOuverte.telephone}</p>}
                    {ficheOuverte.responsable && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', margin: '2px 0 0' }}>Suivi par {ficheOuverte.responsable}</p>}
                  </div>
                )
              })()}

              {/* Suivi spirituel */}
              {(ficheOuverte.decision_camp !== 'Aucune' || ficheOuverte.engagement) && (
                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: '10px 14px', marginBottom: 10 }}>
                  <p style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 8px' }}>Suivi spirituel</p>
                  <InfoLigne label="Décision" valeur={ficheOuverte.decision_camp !== 'Aucune' ? ficheOuverte.decision_camp : null} />
                  {ficheOuverte.engagement && <p style={{ fontSize: 12, color: '#475569', margin: '6px 0 0', lineHeight: 1.5, fontStyle: 'italic' }}>{ficheOuverte.engagement}</p>}
                </div>
              )}

              {/* Contact */}
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: '10px 14px', marginBottom: 10 }}>
                <p style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 8px' }}>Contact après camp</p>
                <InfoLigne label="Contacté" valeur={ficheOuverte.contacte ? 'Oui' : 'Non'} />
                <InfoLigne label="Date contact" valeur={ficheOuverte.date_contact ? new Date(ficheOuverte.date_contact).toLocaleDateString('fr-FR') : null} />
                <InfoLigne label="Lieu de vie" valeur={ficheOuverte.lieu_vie} />
              </div>

              {/* Groupe */}
              {ficheOuverte.groupe_etude && (
                <div style={{ background: VERT_CLAIR, borderRadius: 12, border: `1px solid ${VERT}`, padding: '10px 14px', marginBottom: 10 }}>
                  <p style={{ fontSize: 9, fontWeight: 700, color: VERT, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 4px' }}>Groupe d'étude biblique</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: VERT, margin: 0 }}>{ficheOuverte.groupe_etude}</p>
                </div>
              )}

              {ficheOuverte.notes && (
                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: '10px 14px', marginBottom: 14 }}>
                  <p style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 6px' }}>Notes</p>
                  <p style={{ fontSize: 12, color: '#475569', margin: 0, lineHeight: 1.6 }}>{ficheOuverte.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {ficheOuverte.telephone && (
                  <a href={`https://wa.me/${ficheOuverte.telephone.replace(/\s/g, '').replace(/^0/, '225')}`} target="_blank" rel="noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#25D366', color: '#fff', borderRadius: 10, padding: '10px 14px', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.859L.057 23.625a.5.5 0 00.612.612l5.766-1.476A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.9 0-3.7-.514-5.253-1.408l-.375-.223-3.886.995 1.013-3.786-.244-.388A9.955 9.955 0 012 12c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10z"/></svg>
                    WhatsApp
                  </a>
                )}
                <button type="button" onClick={() => supprimerSuivi(ficheOuverte.id)}
                  style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', borderRadius: 10, padding: '10px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
                  Supprimer
                </button>
                <button type="button" onClick={() => openEdit(ficheOuverte)}
                  style={{ flex: 1, background: VERT_CLAIR, color: VERT, border: 'none', borderRadius: 10, padding: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  Modifier
                </button>
                <button type="button" onClick={() => setFicheOuverte(null)}
                  style={{ background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 10, padding: '10px 14px', fontSize: 12, cursor: 'pointer' }}>
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
