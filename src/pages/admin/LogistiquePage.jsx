import { useEffect, useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/admin/AdminLayout'

const VERT = '#1B3B2B'
const VERT_CLAIR = '#E8F5E8'
const CATEGORIES = ['Son & Musique', 'Éclairage', 'Transport', 'Cuisine', 'Sport & Loisirs', 'Bureau & Admin', 'Médical', 'Autre']
const ETATS = ['Bon', 'Moyen', 'Mauvais']
const STATUT_CONFIG = {
  'En stock':   { bg: '#DCFCE7', color: '#166534', border: '#86EFAC', label: 'En stock' },
  'Sur place':  { bg: '#FEF9C3', color: '#854D0E', border: '#FDE047', label: 'Sur place' },
  'Retourné':   { bg: '#F1F5F9', color: '#475569', border: '#E2E8F0', label: 'Retourné' },
}
const MOUVEMENT_CONFIG = {
  'depart':   { color: '#065F46', bg: '#ECFDF5', label: 'Départ' },
  'incident': { color: '#DC2626', bg: '#FEF2F2', label: 'Incident' },
  'retour':   { color: '#1D4ED8', bg: '#EFF6FF', label: 'Retour' },
}
const EMPTY_FORM = { nom: '', categorie: 'Autre', proprietaire: '', responsable: '', quantite_depart: 1, etat_depart: 'Bon' }
const EMPTY_RETOUR = { etat_retour: 'Bon', quantite_casse: 0, quantite_vole: 0, quantite_perdu: 0, observation: '', responsable_retour: '' }
const iS = { width: '100%', border: '1px solid #E2E8F0', borderRadius: 10, padding: '8px 12px', fontSize: 13, outline: 'none', background: '#fff', color: '#1E293B' }
const lS = { display: 'block', fontSize: 11, color: '#64748B', marginBottom: 4, fontWeight: 500 }

function fmt(d) {
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function exportExcel(materiel, responsableGeneral) {
  const wb = XLSX.utils.book_new()
  const now = new Date().toLocaleDateString('fr-FR')
  const data = materiel.map(m => {
    const qd = m.quantite_depart || m.quantite || 0
    // Cassés reviennent, seuls volés + perdus réduisent le retour
    const qr = qd - (m.quantite_vole || 0) - (m.quantite_perdu || 0)
    return {
      'Équipement':    m.nom || '',
      'Catégorie':     m.categorie || '',
      'Propriétaire':  m.proprietaire || '',
      'Responsable':   m.responsable || '',
      'Qté départ':   qd,
      'État départ':  m.etat_depart || '',
      'Statut':        m.statut || '',
      'Qté retournée': m.checkout ? qr : '-',
      'Dont cassés':   m.quantite_casse || 0,
      'Volés':         m.quantite_vole || 0,
      'Perdus':        m.quantite_perdu || 0,
      'Manquants':     (m.quantite_vole || 0) + (m.quantite_perdu || 0),
      'État retour':  m.etat_retour || '',
      'Retourné':      m.checkout ? 'Oui' : 'Non',
    }
  })
  const resume = [
    { 'Indicateur': 'Responsable général',    'Valeur': responsableGeneral || '-' },
    { 'Indicateur': 'Total équipements',       'Valeur': materiel.length },
    { 'Indicateur': 'Unités au départ',        'Valeur': materiel.reduce((s, m) => s + (m.quantite_depart || m.quantite || 0), 0) },
    { 'Indicateur': 'Retournés',               'Valeur': materiel.filter(m => m.checkout).length },
    { 'Indicateur': 'En cours',                'Valeur': materiel.filter(m => !m.checkout).length },
    { 'Indicateur': 'Total cassés (revenus)',  'Valeur': materiel.reduce((s, m) => s + (m.quantite_casse || 0), 0) },
    { 'Indicateur': 'Total volés',             'Valeur': materiel.reduce((s, m) => s + (m.quantite_vole || 0), 0) },
    { 'Indicateur': 'Total perdus',            'Valeur': materiel.reduce((s, m) => s + (m.quantite_perdu || 0), 0) },
    { 'Indicateur': 'Exporté le',              'Valeur': now },
  ]
  function ws(d) {
    if (!d.length) return XLSX.utils.json_to_sheet([])
    const s = XLSX.utils.json_to_sheet(d)
    s['!cols'] = Object.keys(d[0]).map(k => ({ wch: Math.max(...d.map(r => String(r[k] || '').length), k.length, 10) }))
    return s
  }
  XLSX.utils.book_append_sheet(wb, ws(resume), 'Résumé')
  XLSX.utils.book_append_sheet(wb, ws(data), 'Inventaire')
  XLSX.utils.book_append_sheet(wb, ws(data.filter((_, i) => materiel[i].checkout)), 'Retournés')
  XLSX.utils.book_append_sheet(wb, ws(data.filter((_, i) => !materiel[i].checkout)), 'En cours')
  XLSX.writeFile(wb, `Logistique_CampNavs2026_${now.replace(/\//g, '-')}.xlsx`)
}

function exportPDF(materiel, responsableGeneral) {
  const doc = new jsPDF()
  const now = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const pw = doc.internal.pageSize.getWidth()
  doc.setFillColor(27, 59, 43); doc.rect(0, 0, pw, 32, 'F')
  doc.setTextColor(255, 255, 255); doc.setFontSize(14); doc.setFont('helvetica', 'bold')
  doc.text('Bilan Logistique — Camp-Navs 2026', 14, 14)
  doc.setFontSize(8); doc.setFont('helvetica', 'normal')
  doc.text(`Responsable : ${responsableGeneral || '-'} · ${now}`, 14, 26)
  autoTable(doc, {
    startY: 42,
    head: [['Équipement', 'Catégorie', 'Responsable', 'Qté départ', 'Retourné', 'Cassés', 'Volés+Perdus']],
    body: materiel.map(m => {
      const qd = m.quantite_depart || m.quantite || 0
      const qr = qd - (m.quantite_vole || 0) - (m.quantite_perdu || 0)
      const mq = (m.quantite_vole || 0) + (m.quantite_perdu || 0)
      return [m.nom, m.categorie || '', m.responsable || '-', qd, m.checkout ? qr : 'En cours', m.quantite_casse || 0, mq > 0 ? mq : '✓']
    }),
    headStyles: { fillColor: [27, 59, 43], fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: { 3: { halign: 'center' }, 4: { halign: 'center' }, 5: { halign: 'center' }, 6: { halign: 'center' } },
    alternateRowStyles: { fillColor: [232, 245, 232] },
    margin: { left: 14, right: 14 },
  })
  const avecInc = materiel.filter(m => (m.quantite_casse || 0) + (m.quantite_vole || 0) + (m.quantite_perdu || 0) > 0)
  if (avecInc.length > 0) {
    let y = doc.lastAutoTable.finalY + 10
    if (y > 240) { doc.addPage(); y = 20 }
    doc.setTextColor(220, 38, 38); doc.setFont('helvetica', 'bold'); doc.setFontSize(10)
    doc.text('INCIDENTS', 14, y)
    autoTable(doc, {
      startY: y + 4,
      head: [['Équipement', 'Cassés (revenus)', 'Volés', 'Perdus', 'Détail']],
      body: avecInc.map(m => [m.nom, m.quantite_casse || 0, m.quantite_vole || 0, m.quantite_perdu || 0, (m.incident || '').slice(0, 50)]),
      headStyles: { fillColor: [220, 38, 38], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      alternateRowStyles: { fillColor: [254, 242, 242] },
      margin: { left: 14, right: 14 },
    })
  }
  doc.save(`Logistique_CampNavs2026_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.pdf`)
}

export default function LogistiquePage() {
  const [materiel, setMateriel] = useState([])
  const [mouvements, setMouvements] = useState([])
  const [loading, setLoading] = useState(true)
  const [onglet, setOnglet] = useState('inventaire')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [recherche, setRecherche] = useState('')
  const [filtreCategorie, setFiltreCategorie] = useState('toutes')
  const [responsableGeneral, setResponsableGeneral] = useState('')
  const [configId, setConfigId] = useState(null)
  const [editResponsable, setEditResponsable] = useState(false)
  const [responsableForm, setResponsableForm] = useState('')
  const [menuOuvert, setMenuOuvert] = useState(null)
  const [showRetour, setShowRetour] = useState(false)
  const [retourItem, setRetourItem] = useState(null)
  const [retourForm, setRetourForm] = useState(EMPTY_RETOUR)
  const [showIncident, setShowIncident] = useState(false)
  const [incidentItem, setIncidentItem] = useState(null)
  const [incidentForm, setIncidentForm] = useState({ type: 'cassé', quantite: 1, detail: '' })
  const [ficheOuverte, setFicheOuverte] = useState(null)
  const menuRef = useRef(null)

  useEffect(() => { fetchData() }, [])
  useEffect(() => {
    function handleClick(e) { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOuvert(null) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function fetchData() {
    const [{ data: m }, { data: cfg }, { data: mv }] = await Promise.all([
      supabase.from('materiel_logistique').select('*').order('nom'),
      supabase.from('config_logistique').select('*').limit(1),
      supabase.from('mouvements_logistique').select('*').order('date_heure', { ascending: false }),
    ])
    setMateriel(m || [])
    setMouvements(mv || [])
    if (cfg && cfg.length > 0) {
      setResponsableGeneral(cfg[0].responsable_general || '')
      setResponsableForm(cfg[0].responsable_general || '')
      setConfigId(cfg[0].id)
    }
    setLoading(false)
  }

  async function logMouvement(materiel_id, type, detail, quantite = 0, responsable = '') {
    await supabase.from('mouvements_logistique').insert([{ materiel_id, type, detail, quantite, responsable }])
  }

  function setF(k, v) { setForm(f => ({ ...f, [k]: v })) }
  function setR(k, v) { setRetourForm(f => ({ ...f, [k]: v })) }
  function setI(k, v) { setIncidentForm(f => ({ ...f, [k]: v })) }

  async function handleSave() {
    if (!form.nom) return
    setSaving(true)
    const payload = { nom: form.nom, categorie: form.categorie, proprietaire: form.proprietaire, responsable: form.responsable, quantite: parseInt(form.quantite_depart) || 1, quantite_depart: parseInt(form.quantite_depart) || 1, etat_depart: form.etat_depart, statut: 'En stock', checkin: false, checkout: false }
    if (editId) {
      await supabase.from('materiel_logistique').update(payload).eq('id', editId)
      await logMouvement(editId, 'modification', `Informations modifiées`, 0, form.responsable)
    } else {
      const { data } = await supabase.from('materiel_logistique').insert([payload]).select().single()
      if (data) await logMouvement(data.id, 'depart', `Enregistré : ${form.quantite_depart} unité(s) · État : ${form.etat_depart}`, parseInt(form.quantite_depart) || 1, form.responsable)
    }
    setSaving(false); setShowForm(false); setEditId(null); setForm(EMPTY_FORM); fetchData()
  }

  async function marquerSurPlace(m) {
    await supabase.from('materiel_logistique').update({ statut: 'Sur place' }).eq('id', m.id)
    await logMouvement(m.id, 'depart', `Parti au camp · ${m.quantite_depart || m.quantite || 0} unité(s)`, m.quantite_depart || m.quantite || 0, m.responsable)
    fetchData()
  }

  async function saveResponsable() {
    setSaving(true)
    if (configId) await supabase.from('config_logistique').update({ responsable_general: responsableForm }).eq('id', configId)
    setResponsableGeneral(responsableForm); setEditResponsable(false); setSaving(false)
  }

  async function handleRetour() {
    if (!retourItem) return
    setSaving(true)
    const qd = retourItem.quantite_depart || retourItem.quantite || 0
    // Cassés reviennent → ne réduisent PAS la quantité retournée
    // Seuls volés + perdus réduisent
    const qr = qd - (parseInt(retourForm.quantite_vole) || 0) - (parseInt(retourForm.quantite_perdu) || 0)
    const qCasse = parseInt(retourForm.quantite_casse) || 0
    const qVole  = parseInt(retourForm.quantite_vole)  || 0
    const qPerdu = parseInt(retourForm.quantite_perdu) || 0
    await supabase.from('materiel_logistique').update({
      quantite_retour: qr, etat_retour: retourForm.etat_retour,
      quantite_casse: qCasse, quantite_vole: qVole, quantite_perdu: qPerdu,
      incident: retourForm.observation, statut: 'Retourné', checkout: true,
      date_retour: new Date().toISOString().split('T')[0]
    }).eq('id', retourItem.id)

    const details = [`Retourné : ${qr}/${qd} unité(s)`]
    if (qCasse > 0) details.push(`Cassés (revenus) : ${qCasse}`)
    if (qVole > 0)  details.push(`Volés : ${qVole}`)
    if (qPerdu > 0) details.push(`Perdus : ${qPerdu}`)
    if (retourForm.observation) details.push(retourForm.observation)
    await logMouvement(retourItem.id, 'retour', details.join(' · '), qr, retourForm.responsable_retour)

    setSaving(false); setShowRetour(false); setRetourItem(null); setRetourForm(EMPTY_RETOUR); fetchData()
  }

  async function handleSignalerIncident() {
    if (!incidentItem) return
    setSaving(true)
    const updates = {}
    const qte = parseInt(incidentForm.quantite) || 1
    if (incidentForm.type === 'cassé') updates.quantite_casse = (incidentItem.quantite_casse || 0) + qte
    if (incidentForm.type === 'volé')  updates.quantite_vole  = (incidentItem.quantite_vole  || 0) + qte
    if (incidentForm.type === 'perdu') updates.quantite_perdu = (incidentItem.quantite_perdu || 0) + qte
    updates.incident = (incidentItem.incident ? incidentItem.incident + '\n' : '') + `[${incidentForm.type.toUpperCase()}] x${qte} — ${incidentForm.detail}`
    await supabase.from('materiel_logistique').update(updates).eq('id', incidentItem.id)
    await logMouvement(incidentItem.id, 'incident', `${incidentForm.type.toUpperCase()} x${qte} : ${incidentForm.detail}`, qte)
    setSaving(false); setShowIncident(false); setIncidentItem(null); setIncidentForm({ type: 'cassé', quantite: 1, detail: '' }); fetchData()
  }

  async function supprimerMateriel(id) {
    if (!window.confirm('Supprimer cet équipement et son historique ?')) return
    await supabase.from('mouvements_logistique').delete().eq('materiel_id', id)
    await supabase.from('materiel_logistique').delete().eq('id', id)
    setMenuOuvert(null); setFicheOuverte(null); fetchData()
  }

  function openRetour(m) {
    setRetourItem(m)
    setRetourForm({ etat_retour: m.etat_retour || 'Bon', quantite_casse: m.quantite_casse || 0, quantite_vole: m.quantite_vole || 0, quantite_perdu: m.quantite_perdu || 0, observation: m.incident || '', responsable_retour: '' })
    setShowRetour(true); setMenuOuvert(null); setFicheOuverte(null)
  }

  function openEdit(m) {
    setForm({ nom: m.nom, categorie: m.categorie || 'Autre', proprietaire: m.proprietaire || '', responsable: m.responsable || '', quantite_depart: m.quantite_depart || m.quantite || 1, etat_depart: m.etat_depart || 'Bon' })
    setEditId(m.id); setShowForm(true); setMenuOuvert(null); setFicheOuverte(null)
  }

  const totalEquip    = materiel.length
  const totalDepart   = materiel.reduce((s, m) => s + (m.quantite_depart || m.quantite || 0), 0)
  const totalVole     = materiel.reduce((s, m) => s + (m.quantite_vole || 0), 0)
  const totalPerdu    = materiel.reduce((s, m) => s + (m.quantite_perdu || 0), 0)
  const totalCasse    = materiel.reduce((s, m) => s + (m.quantite_casse || 0), 0)
  const nonRetournes  = materiel.filter(m => !m.checkout).length
  const avecIncidents = materiel.filter(m => (m.quantite_casse || 0) + (m.quantite_vole || 0) + (m.quantite_perdu || 0) > 0)

  const filtres = materiel
    .filter(m => filtreCategorie === 'toutes' || m.categorie === filtreCategorie)
    .filter(m => m.nom.toLowerCase().includes(recherche.toLowerCase()) || (m.responsable && m.responsable.toLowerCase().includes(recherche.toLowerCase())))

  const chipS = (active) => ({ flexShrink: 0, padding: '5px 13px', borderRadius: 20, fontSize: 12, fontWeight: active ? 700 : 500, cursor: 'pointer', border: `1px solid ${active ? VERT : '#E2E8F0'}`, background: active ? VERT : '#fff', color: active ? '#fff' : '#64748B', transition: 'all .2s' })

  return (
    <AdminLayout>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#F8FAFC', overflow: 'hidden' }}>

        {/* ── HEADER FIXE ── */}
        <div style={{ flexShrink: 0, background: '#F8FAFC', zIndex: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', borderBottom: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 14px 10px' }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1E293B', margin: 0 }}>Logistique</h1>
              <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 0' }}>{totalEquip} équipement(s) · {totalDepart} unité(s)</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button type="button" onClick={() => exportPDF(materiel, responsableGeneral)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', borderRadius: 10, padding: '7px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                PDF
              </button>
              <button type="button" onClick={() => exportExcel(materiel, responsableGeneral)}
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
          <div style={{ display: 'flex', gap: 6, padding: '0 14px 10px', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {[
              { key: 'inventaire', label: `Inventaire (${totalEquip})` },
              { key: 'incidents',  label: `Incidents${avecIncidents.length > 0 ? ` (${avecIncidents.length})` : ''}` },
              { key: 'bilan',      label: 'Bilan retour' },
            ].map(o => (
              <button key={o.key} type="button" onClick={() => setOnglet(o.key)} style={chipS(onglet === o.key)}>{o.label}</button>
            ))}
          </div>
        </div>

        {/* ── ZONE SCROLLABLE ── */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '12px 14px 14px' }}>

          {/* Responsable général */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: '10px 14px', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', margin: '0 0 3px', textTransform: 'uppercase' }}>Responsable général</p>
                {editResponsable ? (
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <input type="text" value={responsableForm} onChange={e => setResponsableForm(e.target.value)} placeholder="Nom du responsable" style={{ ...iS, padding: '6px 10px' }} />
                    <button type="button" onClick={saveResponsable} style={{ background: VERT, color: '#fff', border: 'none', borderRadius: 10, padding: '6px 14px', fontSize: 12, cursor: 'pointer' }}>{saving ? '...' : 'OK'}</button>
                  </div>
                ) : (
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', margin: 0 }}>
                    {responsableGeneral || <span style={{ color: '#94A3B8', fontWeight: 400, fontSize: 12 }}>Non défini</span>}
                  </p>
                )}
              </div>
              {!editResponsable && (
                <button type="button" onClick={() => { setEditResponsable(true); setResponsableForm(responsableGeneral) }}
                  style={{ fontSize: 11, color: VERT, background: VERT_CLAIR, border: 'none', borderRadius: 10, padding: '5px 10px', cursor: 'pointer', fontWeight: 600 }}>
                  Modifier
                </button>
              )}
            </div>
          </div>

          {/* KPI */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginBottom: 12 }}>
            {[
              { val: totalDepart,            label: 'Départ',    color: '#065F46', bg: '#ECFDF5', border: '#6EE7B7' },
              { val: nonRetournes,           label: 'En cours',  color: nonRetournes > 0 ? '#92400E' : '#94A3B8', bg: nonRetournes > 0 ? '#FFFBEB' : '#F8FAFC', border: nonRetournes > 0 ? '#FCD34D' : '#E2E8F0' },
              { val: totalCasse,             label: 'Cassés',    color: totalCasse > 0 ? '#92400E' : '#94A3B8', bg: totalCasse > 0 ? '#FFFBEB' : '#F8FAFC', border: totalCasse > 0 ? '#FCD34D' : '#E2E8F0' },
              { val: totalVole + totalPerdu, label: 'Manquants', color: (totalVole + totalPerdu) > 0 ? '#991B1B' : '#94A3B8', bg: (totalVole + totalPerdu) > 0 ? '#FEF2F2' : '#F8FAFC', border: (totalVole + totalPerdu) > 0 ? '#FCA5A5' : '#E2E8F0' },
            ].map(s => (
              <div key={s.label} style={{ background: s.bg, borderRadius: 10, border: `1px solid ${s.border}`, padding: '8px 6px', textAlign: 'center' }}>
                <p style={{ fontSize: 20, fontWeight: 700, color: s.color, margin: '0 0 2px', lineHeight: 1 }}>{s.val}</p>
                <p style={{ fontSize: 9, color: '#94A3B8', margin: 0 }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Formulaire */}
          {showForm && (
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: 14, marginBottom: 12 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', margin: '0 0 12px' }}>{editId ? 'Modifier' : 'Nouvel équipement'}</p>
              <div style={{ marginBottom: 8 }}><label style={lS}>Nom *</label><input type="text" value={form.nom} onChange={e => setF('nom', e.target.value)} placeholder="Ex : Micro sans fil" style={iS} /></div>
              <div style={{ marginBottom: 8 }}><label style={lS}>Catégorie</label><select value={form.categorie} onChange={e => setF('categorie', e.target.value)} style={iS}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                <div><label style={lS}>Quantité</label><input type="number" min="1" value={form.quantite_depart} onChange={e => setF('quantite_depart', e.target.value)} style={iS} /></div>
                <div><label style={lS}>État départ</label><select value={form.etat_depart} onChange={e => setF('etat_depart', e.target.value)} style={iS}>{ETATS.map(e => <option key={e}>{e}</option>)}</select></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                <div><label style={lS}>Propriétaire</label><input type="text" value={form.proprietaire} onChange={e => setF('proprietaire', e.target.value)} placeholder="Ex : Navigateurs CI" style={iS} /></div>
                <div><label style={lS}>Responsable</label><input type="text" value={form.responsable} onChange={e => setF('responsable', e.target.value)} placeholder="Ex : AKRE ALPHONSE" style={iS} /></div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => { setShowForm(false); setEditId(null) }} style={{ flex: 1, background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 10, padding: 10, fontSize: 13, cursor: 'pointer' }}>Annuler</button>
                <button type="button" onClick={handleSave} disabled={saving || !form.nom} style={{ flex: 1, background: VERT, color: '#fff', border: 'none', borderRadius: 10, padding: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving || !form.nom ? 0.7 : 1 }}>{saving ? '...' : editId ? 'Modifier' : 'Ajouter'}</button>
              </div>
            </div>
          )}

          {/* ── INVENTAIRE ── */}
          {onglet === 'inventaire' && (
            <>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
                {['toutes', ...CATEGORIES].map(c => (
                  <button key={c} type="button" onClick={() => setFiltreCategorie(c)} style={chipS(filtreCategorie === c)}>{c === 'toutes' ? 'Toutes' : c}</button>
                ))}
              </div>
              <div style={{ position: 'relative', marginBottom: 12 }}>
                <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#94A3B8" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                <input type="text" value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Rechercher..." style={{ ...iS, paddingLeft: 30, fontSize: 12 }} />
              </div>
              {loading && <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '16px 0' }}>Chargement...</p>}
              <div ref={menuRef} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filtres.length === 0 && !loading && (
                  <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: 24, textAlign: 'center' }}>
                    <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>Aucun équipement.</p>
                  </div>
                )}
                {filtres.map(m => {
                  const sc = STATUT_CONFIG[m.statut] || STATUT_CONFIG['En stock']
                  const aIncident = (m.quantite_casse || 0) + (m.quantite_vole || 0) + (m.quantite_perdu || 0) > 0
                  const qd = m.quantite_depart || m.quantite || 0
                  const qr = qd - (m.quantite_vole || 0) - (m.quantite_perdu || 0)
                  return (
                    <div key={m.id}
                      style={{ background: '#fff', borderRadius: 12, border: `1px solid ${aIncident ? '#FCA5A5' : '#E2E8F0'}`, padding: '11px 14px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', cursor: 'pointer', borderLeft: aIncident ? '3px solid #FCA5A5' : undefined }}
                      onClick={() => setFicheOuverte(m)}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 5 }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', margin: 0 }}>{m.nom}</p>
                            <span style={{ fontSize: 9, fontWeight: 600, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, borderRadius: 20, padding: '1px 7px' }}>{sc.label}</span>
                            {m.categorie && <span style={{ fontSize: 9, background: '#F1F5F9', color: '#64748B', borderRadius: 20, padding: '1px 7px' }}>{m.categorie}</span>}
                            {aIncident && <span style={{ fontSize: 9, fontWeight: 700, background: '#FEF2F2', color: '#DC2626', borderRadius: 20, padding: '1px 7px' }}>Incident</span>}
                          </div>
                          <p style={{ fontSize: 11, color: '#94A3B8', margin: '0 0 5px' }}>
                            {qd} unité(s) au départ{m.checkout ? ` · ${qr} retournée(s)` : ''}{m.responsable ? ` · ${m.responsable}` : ''}
                          </p>
                          {!m.checkout && m.statut === 'En stock' && (
                            <button type="button" onClick={e => { e.stopPropagation(); marquerSurPlace(m) }}
                              style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, border: `1px solid ${VERT}`, background: VERT_CLAIR, color: VERT, cursor: 'pointer', fontWeight: 600 }}>
                              Marquer comme parti
                            </button>
                          )}
                          {!m.checkout && m.statut === 'Sur place' && (
                            <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                              <button type="button" onClick={() => { setIncidentItem(m); setIncidentForm({ type: 'cassé', quantite: 1, detail: '' }); setShowIncident(true) }}
                                style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', fontWeight: 500 }}>
                                Incident
                              </button>
                              <button type="button" onClick={() => openRetour(m)}
                                style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, border: `1px solid ${VERT}`, background: VERT_CLAIR, color: VERT, cursor: 'pointer', fontWeight: 500 }}>
                                Retour
                              </button>
                            </div>
                          )}
                          {m.checkout && <span style={{ fontSize: 10, fontWeight: 600, background: VERT_CLAIR, color: VERT, borderRadius: 20, padding: '2px 10px' }}>✓ Retourné · {qr}/{qd}</span>}
                        </div>
                        <div style={{ position: 'relative', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                          <button type="button" onClick={() => setMenuOuvert(menuOuvert === m.id ? null : m.id)}
                            style={{ width: 28, height: 28, borderRadius: 8, background: '#F8FAFC', border: '1px solid #E2E8F0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#94A3B8' }}>
                            ···
                          </button>
                          {menuOuvert === m.id && (
                            <div style={{ position: 'absolute', right: 0, top: 32, background: '#fff', borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', zIndex: 20, minWidth: 140, overflow: 'hidden' }}>
                              <button type="button" onClick={() => openEdit(m)} style={{ width: '100%', padding: '9px 14px', fontSize: 13, color: '#1E293B', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>Modifier</button>
                              <div style={{ height: 1, background: '#F1F5F9' }} />
                              <button type="button" onClick={() => supprimerMateriel(m.id)} style={{ width: '100%', padding: '9px 14px', fontSize: 13, color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>Supprimer</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* ── INCIDENTS ── */}
          {onglet === 'incidents' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {avecIncidents.length === 0 && <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: 24, textAlign: 'center' }}><p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>Aucun incident signalé.</p></div>}
              {avecIncidents.map(m => (
                <div key={m.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #FCA5A5', padding: '11px 14px', cursor: 'pointer' }} onClick={() => setFicheOuverte(m)}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', margin: '0 0 8px' }}>{m.nom}</p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: m.incident ? 8 : 0 }}>
                    {(m.quantite_casse || 0) > 0 && <span style={{ fontSize: 11, background: '#FFFBEB', color: '#92400E', borderRadius: 20, padding: '2px 10px', fontWeight: 600 }}>Cassé (revenu) : {m.quantite_casse}</span>}
                    {(m.quantite_vole  || 0) > 0 && <span style={{ fontSize: 11, background: '#FEF2F2', color: '#991B1B', borderRadius: 20, padding: '2px 10px', fontWeight: 600 }}>Volé : {m.quantite_vole}</span>}
                    {(m.quantite_perdu || 0) > 0 && <span style={{ fontSize: 11, background: '#F5F3FF', color: '#6D28D9', borderRadius: 20, padding: '2px 10px', fontWeight: 600 }}>Perdu : {m.quantite_perdu}</span>}
                  </div>
                  {m.incident && <p style={{ fontSize: 11, color: '#64748B', margin: 0, lineHeight: 1.5, whiteSpace: 'pre-line', background: '#F8FAFC', borderRadius: 8, padding: '6px 10px' }}>{m.incident}</p>}
                </div>
              ))}
            </div>
          )}

          {/* ── BILAN ── */}
          {onglet === 'bilan' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {materiel.length === 0 && <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: 24, textAlign: 'center' }}><p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>Aucun équipement.</p></div>}
              {materiel.map(m => {
                const qd = m.quantite_depart || m.quantite || 0
                const qr = qd - (m.quantite_vole || 0) - (m.quantite_perdu || 0)
                return (
                  <div key={m.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: '11px 14px', cursor: 'pointer' }} onClick={() => setFicheOuverte(m)}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', margin: '0 0 10px' }}>{m.nom}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginBottom: m.checkout ? 0 : 10 }}>
                      {[
                        { val: qd,                      label: 'Parti',           color: '#065F46', bg: '#ECFDF5', border: '#6EE7B7' },
                        { val: m.checkout ? qr : '—', label: 'Retourné',     color: m.checkout ? '#1D4ED8' : '#94A3B8', bg: m.checkout ? '#EFF6FF' : '#F8FAFC', border: m.checkout ? '#93C5FD' : '#E2E8F0' },
                        { val: m.quantite_casse || 0,   label: 'Cassé (revenu)', color: (m.quantite_casse || 0) > 0 ? '#92400E' : '#94A3B8', bg: (m.quantite_casse || 0) > 0 ? '#FFFBEB' : '#F8FAFC', border: (m.quantite_casse || 0) > 0 ? '#FCD34D' : '#E2E8F0' },
                        { val: (m.quantite_vole || 0) + (m.quantite_perdu || 0), label: 'Manquant', color: ((m.quantite_vole || 0) + (m.quantite_perdu || 0)) > 0 ? '#991B1B' : '#065F46', bg: ((m.quantite_vole || 0) + (m.quantite_perdu || 0)) > 0 ? '#FEF2F2' : '#ECFDF5', border: ((m.quantite_vole || 0) + (m.quantite_perdu || 0)) > 0 ? '#FCA5A5' : '#6EE7B7' },
                      ].map(s => (
                        <div key={s.label} style={{ textAlign: 'center', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: '6px 4px' }}>
                          <p style={{ fontSize: 16, fontWeight: 700, color: s.color, margin: '0 0 2px', lineHeight: 1 }}>{s.val}</p>
                          <p style={{ fontSize: 8, color: s.color, margin: 0, opacity: 0.8 }}>{s.label}</p>
                        </div>
                      ))}
                    </div>
                    {!m.checkout && (
                      <button type="button" onClick={e => { e.stopPropagation(); openRetour(m) }}
                        style={{ width: '100%', fontSize: 12, padding: '8px', borderRadius: 10, border: `1px solid ${VERT}`, background: VERT_CLAIR, color: VERT, cursor: 'pointer', fontWeight: 600, marginTop: 2 }}>
                        Enregistrer le retour
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── FICHE DÉTAILLÉE ── */}
      {ficheOuverte && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setFicheOuverte(null)}>
          <div style={{ background: '#F8FAFC', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 480, maxHeight: '88vh', overflowY: 'auto', paddingBottom: 28 }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 36, height: 3, background: '#E2E8F0', borderRadius: 2, margin: '14px auto 0' }} />
            <div style={{ padding: '14px 16px 0' }}>
              {/* En-tête */}
              <div style={{ background: VERT, borderRadius: 14, padding: '14px 16px', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>{ficheOuverte.nom}</p>
                  {(() => { const sc = STATUT_CONFIG[ficheOuverte.statut] || STATUT_CONFIG['En stock']; return <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: 20, padding: '2px 10px' }}>{sc.label}</span> })()}
                </div>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', margin: '0 0 4px' }}>{ficheOuverte.categorie} {ficheOuverte.proprietaire ? `· ${ficheOuverte.proprietaire}` : ''}</p>
                {ficheOuverte.responsable && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', margin: 0 }}>Responsable : {ficheOuverte.responsable}</p>}
              </div>

              {/* Stats */}
              {(() => {
                const qd = ficheOuverte.quantite_depart || ficheOuverte.quantite || 0
                const qr = qd - (ficheOuverte.quantite_vole || 0) - (ficheOuverte.quantite_perdu || 0)
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginBottom: 14 }}>
                    {[
                      { val: qd, label: 'Parti', color: '#065F46', bg: '#ECFDF5', border: '#6EE7B7' },
                      { val: ficheOuverte.checkout ? qr : '—', label: 'Retourné', color: '#1D4ED8', bg: '#EFF6FF', border: '#93C5FD' },
                      { val: ficheOuverte.quantite_casse || 0, label: 'Cassé', color: '#92400E', bg: '#FFFBEB', border: '#FCD34D' },
                      { val: (ficheOuverte.quantite_vole || 0) + (ficheOuverte.quantite_perdu || 0), label: 'Manquant', color: '#991B1B', bg: '#FEF2F2', border: '#FCA5A5' },
                    ].map(s => (
                      <div key={s.label} style={{ textAlign: 'center', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: '8px 4px' }}>
                        <p style={{ fontSize: 18, fontWeight: 700, color: s.color, margin: '0 0 2px', lineHeight: 1 }}>{s.val}</p>
                        <p style={{ fontSize: 9, color: s.color, margin: 0, opacity: 0.8 }}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                )
              })()}

              {/* Infos retour */}
              {ficheOuverte.checkout && (
                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: '10px 14px', marginBottom: 12 }}>
                  <p style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', margin: '0 0 6px', textTransform: 'uppercase' }}>État au retour</p>
                  <p style={{ fontSize: 13, color: '#1E293B', margin: '0 0 4px', fontWeight: 500 }}>
                    {ficheOuverte.etat_retour || 'Non précisé'}
                  </p>
                  {ficheOuverte.incident && <p style={{ fontSize: 11, color: '#64748B', margin: 0, lineHeight: 1.5, whiteSpace: 'pre-line' }}>{ficheOuverte.incident}</p>}
                </div>
              )}

              {/* Historique des mouvements */}
              <p style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', margin: '0 0 8px', textTransform: 'uppercase' }}>
                Historique ({mouvements.filter(mv => mv.materiel_id === ficheOuverte.id).length} événement(s))
              </p>
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden', marginBottom: 14 }}>
                {mouvements.filter(mv => mv.materiel_id === ficheOuverte.id).length === 0 ? (
                  <p style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center', padding: 14, margin: 0 }}>Aucun mouvement enregistré.</p>
                ) : (
                  mouvements.filter(mv => mv.materiel_id === ficheOuverte.id).map((mv, i, arr) => {
                    const mc = MOUVEMENT_CONFIG[mv.type] || { color: '#64748B', bg: '#F8FAFC', label: mv.type }
                    return (
                      <div key={mv.id} style={{ display: 'flex', gap: 12, padding: '10px 14px', borderBottom: i < arr.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: mc.bg, border: `1px solid ${mc.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: mc.color }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: mc.color }}>{mc.label}</span>
                            <span style={{ fontSize: 10, color: '#CBD5E1' }}>{fmt(mv.date_heure)}</span>
                          </div>
                          <p style={{ fontSize: 12, color: '#475569', margin: 0, lineHeight: 1.4 }}>{mv.detail}</p>
                          {mv.responsable && <p style={{ fontSize: 10, color: '#94A3B8', margin: '2px 0 0' }}>{mv.responsable}</p>}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8 }}>
                {!ficheOuverte.checkout && ficheOuverte.statut === 'Sur place' && (
                  <>
                    <button type="button" onClick={() => { setIncidentItem(ficheOuverte); setIncidentForm({ type: 'cassé', quantite: 1, detail: '' }); setShowIncident(true); setFicheOuverte(null) }}
                      style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', borderRadius: 10, padding: '10px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
                      Incident
                    </button>
                    <button type="button" onClick={() => openRetour(ficheOuverte)}
                      style={{ flex: 1, background: VERT_CLAIR, color: VERT, border: `1px solid ${VERT}`, borderRadius: 10, padding: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      Enregistrer retour
                    </button>
                  </>
                )}
                {!ficheOuverte.checkout && ficheOuverte.statut === 'En stock' && (
                  <button type="button" onClick={() => { marquerSurPlace(ficheOuverte); setFicheOuverte(null) }}
                    style={{ flex: 1, background: VERT, color: '#fff', border: 'none', borderRadius: 10, padding: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    Marquer comme parti
                  </button>
                )}
                <button type="button" onClick={() => setFicheOuverte(null)}
                  style={{ background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 10, padding: '10px 14px', fontSize: 12, cursor: 'pointer' }}>
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL RETOUR ── */}
      {showRetour && retourItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 60, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setShowRetour(false)}>
          <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 480, padding: '0 16px 28px' }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 36, height: 3, background: '#E2E8F0', borderRadius: 2, margin: '14px auto 14px' }} />
            <p style={{ fontSize: 15, fontWeight: 700, color: '#1E293B', margin: '0 0 3px' }}>Retour — {retourItem.nom}</p>
            <div style={{ background: VERT_CLAIR, borderRadius: 10, padding: '8px 12px', marginBottom: 12 }}>
              <p style={{ fontSize: 11, color: VERT, margin: 0, fontWeight: 500 }}>
                Quantité retournée = {retourItem.quantite_depart || retourItem.quantite || 0} − (volés + perdus). Les cassés reviennent.
              </p>
            </div>
            <div style={{ marginBottom: 10 }}><label style={lS}>Responsable au retour</label><input type="text" value={retourForm.responsable_retour} onChange={e => setR('responsable_retour', e.target.value)} placeholder="Qui reçoit l'équipement ?" style={iS} /></div>
            <div style={{ marginBottom: 10 }}><label style={lS}>État au retour</label><select value={retourForm.etat_retour} onChange={e => setR('etat_retour', e.target.value)} style={iS}>{ETATS.map(e => <option key={e}>{e}</option>)}</select></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
              <div><label style={{ ...lS, color: '#92400E' }}>Cassés (revenus)</label><input type="number" min="0" value={retourForm.quantite_casse} onChange={e => setR('quantite_casse', e.target.value)} style={iS} /></div>
              <div><label style={{ ...lS, color: '#991B1B' }}>Volés</label><input type="number" min="0" value={retourForm.quantite_vole} onChange={e => setR('quantite_vole', e.target.value)} style={iS} /></div>
              <div><label style={{ ...lS, color: '#6D28D9' }}>Perdus</label><input type="number" min="0" value={retourForm.quantite_perdu} onChange={e => setR('quantite_perdu', e.target.value)} style={iS} /></div>
            </div>
            {/* Calcul en temps réel */}
            {(() => {
              const qd = retourItem.quantite_depart || retourItem.quantite || 0
              const qVole = parseInt(retourForm.quantite_vole) || 0
              const qPerdu = parseInt(retourForm.quantite_perdu) || 0
              const qCasse = parseInt(retourForm.quantite_casse) || 0
              const qr = qd - qVole - qPerdu
              return (
                <div style={{ background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0', padding: '10px 14px', marginBottom: 12 }}>
                  <p style={{ fontSize: 11, color: '#64748B', margin: '0 0 4px' }}>
                    <strong>{qd}</strong> partis − <strong style={{ color: '#991B1B' }}>{qVole} volés</strong> − <strong style={{ color: '#6D28D9' }}>{qPerdu} perdus</strong> = <strong style={{ color: VERT, fontSize: 14 }}>{Math.max(qr, 0)} retournés</strong>
                  </p>
                  {qCasse > 0 && <p style={{ fontSize: 11, color: '#92400E', margin: 0 }}>Dont <strong>{qCasse} cassés</strong> (revenus mais endommagés)</p>}
                </div>
              )
            })()}
            <div style={{ marginBottom: 14 }}><label style={lS}>Observation</label><textarea value={retourForm.observation} onChange={e => setR('observation', e.target.value)} placeholder="Remarques éventuelles..." rows={2} style={{ ...iS, resize: 'none' }} /></div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setShowRetour(false)} style={{ flex: 1, background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 10, padding: 11, fontSize: 13, cursor: 'pointer' }}>Annuler</button>
              <button type="button" onClick={handleRetour} disabled={saving} style={{ flex: 1, background: VERT, color: '#fff', border: 'none', borderRadius: 10, padding: 11, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? '...' : 'Confirmer'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL INCIDENT ── */}
      {showIncident && incidentItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 60, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setShowIncident(false)}>
          <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 480, padding: '0 16px 28px' }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 36, height: 3, background: '#E2E8F0', borderRadius: 2, margin: '14px auto 14px' }} />
            <p style={{ fontSize: 15, fontWeight: 700, color: '#1E293B', margin: '0 0 14px' }}>Incident — {incidentItem.nom}</p>
            <div style={{ marginBottom: 10 }}>
              <label style={lS}>Type</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[{ key: 'cassé', color: '#92400E', bg: '#FFFBEB', border: '#FCD34D' }, { key: 'volé', color: '#991B1B', bg: '#FEF2F2', border: '#FCA5A5' }, { key: 'perdu', color: '#6D28D9', bg: '#F5F3FF', border: '#DDD6FE' }].map(t => (
                  <button key={t.key} type="button" onClick={() => setI('type', t.key)}
                    style={{ flex: 1, padding: '8px', borderRadius: 10, border: `1px solid ${incidentForm.type === t.key ? t.border : '#E2E8F0'}`, background: incidentForm.type === t.key ? t.bg : '#fff', color: t.color, fontSize: 12, fontWeight: incidentForm.type === t.key ? 700 : 400, cursor: 'pointer', textTransform: 'capitalize' }}>
                    {t.key}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 10 }}><label style={lS}>Quantité</label><input type="number" min="1" value={incidentForm.quantite} onChange={e => setI('quantite', e.target.value)} style={iS} /></div>
            <div style={{ marginBottom: 14 }}><label style={lS}>Description</label><textarea value={incidentForm.detail} onChange={e => setI('detail', e.target.value)} placeholder="Ex : Tombé lors du transport..." rows={2} style={{ ...iS, resize: 'none' }} /></div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setShowIncident(false)} style={{ flex: 1, background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 10, padding: 11, fontSize: 13, cursor: 'pointer' }}>Annuler</button>
              <button type="button" onClick={handleSignalerIncident} disabled={saving} style={{ flex: 1, background: '#DC2626', color: '#fff', border: 'none', borderRadius: 10, padding: 11, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? '...' : 'Signaler'}</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
