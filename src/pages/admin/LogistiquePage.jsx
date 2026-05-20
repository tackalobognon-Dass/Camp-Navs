import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/admin/AdminLayout'

function exportExcel(materiel) {
  const lignes = [
    ['BILAN LOGISTIQUE — CAMP-NAVS 2026'],
    [],
    ['=== INVENTAIRE COMPLET ==='],
    ['Équipement', 'Propriétaire', 'Responsable', 'Qté départ', 'État départ', 'Qté retour', 'État retour', 'Cassé', 'Volé', 'Perdu', 'Manquant', 'Observation'],
    ...materiel.map(m => {
      const qteDepart = m.quantite_depart || m.quantite || 0
      const qteRetour = m.quantite_retour || 0
      const manquant = qteDepart - qteRetour
      return [
        m.nom, m.proprietaire || '', m.responsable || '',
        qteDepart, m.etat_depart || 'Bon',
        qteRetour, m.etat_retour || '-',
        m.quantite_casse || 0, m.quantite_vole || 0, m.quantite_perdu || 0,
        manquant > 0 ? manquant : 0,
        m.incident || ''
      ]
    }),
    [],
    ['=== INCIDENTS ==='],
    ['Équipement', 'Cassé', 'Volé', 'Perdu', 'Description'],
    ...materiel.filter(m => (m.quantite_casse || 0) + (m.quantite_vole || 0) + (m.quantite_perdu || 0) > 0)
      .map(m => [m.nom, m.quantite_casse || 0, m.quantite_vole || 0, m.quantite_perdu || 0, m.incident || '']),
    [],
    ['=== BILAN RETOUR ==='],
    ['Équipement', 'Parti', 'Retourné', 'Manquant', 'Statut'],
    ...materiel.map(m => {
      const qteDepart = m.quantite_depart || m.quantite || 0
      const qteRetour = m.quantite_retour || 0
      const diff = qteDepart - qteRetour
      return [m.nom, qteDepart, qteRetour, diff > 0 ? diff : 0, m.checkout ? 'Retourné' : 'En attente']
    }),
    [],
    ['=== RÉSUMÉ ==='],
    ['Total équipements', materiel.length],
    ['Total unités au départ', materiel.reduce((s, m) => s + (m.quantite_depart || m.quantite || 0), 0)],
    ['Total unités au retour', materiel.reduce((s, m) => s + (m.quantite_retour || 0), 0)],
    ['Total incidents', materiel.reduce((s, m) => s + (m.quantite_casse || 0) + (m.quantite_vole || 0) + (m.quantite_perdu || 0), 0)],
    ['Généré le', new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })],
  ]

  const csvContent = '\uFEFF' + lignes.map(row =>
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';')
  ).join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Bilan_Logistique_CampNavs2026_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function exportPDF(materiel) {
  const dateStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const totalDepart = materiel.reduce((s, m) => s + (m.quantite_depart || m.quantite || 0), 0)
  const totalRetour = materiel.reduce((s, m) => s + (m.quantite_retour || 0), 0)
  const totalIncidents = materiel.reduce((s, m) => s + (m.quantite_casse || 0) + (m.quantite_vole || 0) + (m.quantite_perdu || 0), 0)
  const avecIncidents = materiel.filter(m => (m.quantite_casse || 0) + (m.quantite_vole || 0) + (m.quantite_perdu || 0) > 0)

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Bilan Logistique — Camp-Navs 2026</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 12px; color: #1a1a1a; margin: 30px; }
  h1 { font-size: 20px; color: #085041; margin-bottom: 4px; }
  h2 { font-size: 14px; color: #085041; margin: 24px 0 10px; border-bottom: 2px solid #085041; padding-bottom: 4px; }
  .subtitle { font-size: 12px; color: #666; margin-bottom: 20px; }
  .resume { display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
  .stat { background: #E1F5EE; border-radius: 8px; padding: 10px 14px; min-width: 120px; }
  .stat .num { font-size: 22px; font-weight: bold; color: #085041; }
  .stat .lbl { font-size: 10px; color: #0F6E56; }
  .stat.alert { background: #FCEBEB; }
  .stat.alert .num { color: #A32D2D; }
  .stat.alert .lbl { color: #993C1D; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th { background: #085041; color: #fff; padding: 7px 10px; text-align: left; font-size: 11px; }
  td { padding: 6px 10px; border-bottom: 0.5px solid #e5e5e0; font-size: 11px; }
  tr:nth-child(even) td { background: #f8f8f6; }
  .badge { padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: bold; }
  .badge-ok { background: #E1F5EE; color: #085041; }
  .badge-warn { background: #FAEEDA; color: #854F0B; }
  .badge-danger { background: #FCEBEB; color: #A32D2D; }
  .footer { margin-top: 30px; font-size: 10px; color: #888; text-align: center; border-top: 0.5px solid #e5e5e0; padding-top: 10px; }
</style>
</head>
<body>
<h1>Bilan Logistique — Camp-Navs 2026</h1>
<p class="subtitle">La Sablière · Bingerville · 23–29 août 2026 · Généré le ${dateStr}</p>

<div class="resume">
  <div class="stat"><div class="num">${materiel.length}</div><div class="lbl">Équipements</div></div>
  <div class="stat"><div class="num">${totalDepart}</div><div class="lbl">Unités au départ</div></div>
  <div class="stat"><div class="num">${totalRetour}</div><div class="lbl">Unités au retour</div></div>
  <div class="stat ${totalIncidents > 0 ? 'alert' : ''}"><div class="num">${totalIncidents}</div><div class="lbl">${totalIncidents > 0 ? 'Incidents' : 'Aucun incident'}</div></div>
</div>

<h2>Inventaire complet</h2>
<table>
  <tr><th>Équipement</th><th>Propriétaire</th><th>Responsable</th><th>Qté départ</th><th>État départ</th><th>Qté retour</th><th>État retour</th><th>Manquant</th></tr>
  ${materiel.map(m => {
    const qd = m.quantite_depart || m.quantite || 0
    const qr = m.quantite_retour || 0
    const diff = qd - qr
    return `<tr>
      <td><strong>${m.nom}</strong></td>
      <td>${m.proprietaire || '-'}</td>
      <td>${m.responsable || '-'}</td>
      <td>${qd}</td>
      <td><span class="badge badge-ok">${m.etat_depart || 'Bon'}</span></td>
      <td>${m.checkout ? qr : '-'}</td>
      <td>${m.checkout ? `<span class="badge badge-ok">${m.etat_retour || 'Bon'}</span>` : '-'}</td>
      <td>${diff > 0 ? `<span class="badge badge-danger">${diff}</span>` : '<span class="badge badge-ok">0</span>'}</td>
    </tr>`
  }).join('')}
</table>

<h2>Incidents signalés</h2>
${avecIncidents.length === 0
  ? '<p style="color:#888;font-style:italic">Aucun incident signalé.</p>'
  : `<table>
  <tr><th>Équipement</th><th>Cassé</th><th>Volé</th><th>Perdu</th><th>Description</th></tr>
  ${avecIncidents.map(m => `<tr>
    <td><strong>${m.nom}</strong></td>
    <td>${(m.quantite_casse || 0) > 0 ? `<span class="badge badge-danger">${m.quantite_casse}</span>` : '0'}</td>
    <td>${(m.quantite_vole || 0) > 0 ? `<span class="badge badge-warn">${m.quantite_vole}</span>` : '0'}</td>
    <td>${(m.quantite_perdu || 0) > 0 ? `<span class="badge badge-warn">${m.quantite_perdu}</span>` : '0'}</td>
    <td>${m.incident || '-'}</td>
  </tr>`).join('')}
</table>`}

<h2>Bilan retour</h2>
<table>
  <tr><th>Équipement</th><th>Parti</th><th>Retourné</th><th>Manquant</th><th>Statut</th></tr>
  ${materiel.map(m => {
    const qd = m.quantite_depart || m.quantite || 0
    const qr = m.quantite_retour || 0
    const diff = qd - qr
    return `<tr>
      <td><strong>${m.nom}</strong></td>
      <td>${qd}</td>
      <td>${m.checkout ? qr : '-'}</td>
      <td>${diff > 0 ? `<span class="badge badge-danger">${diff}</span>` : '<span class="badge badge-ok">0</span>'}</td>
      <td>${m.checkout ? '<span class="badge badge-ok">Retourné</span>' : '<span class="badge badge-warn">En attente</span>'}</td>
    </tr>`
  }).join('')}
</table>

<div class="footer">Camp-Navs 2026 · Mission Évangélique des Navigateurs — Côte d'Ivoire · ${dateStr}</div>
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank')
  if (win) setTimeout(() => win.print(), 800)
  URL.revokeObjectURL(url)
}

const ETATS = ['Bon', 'Moyen', 'Mauvais']
const ETAT_CONFIG = {
  'Bon':    { bg: '#E1F5EE', color: '#085041' },
  'Moyen':  { bg: '#FAEEDA', color: '#854F0B' },
  'Mauvais':{ bg: '#FCEBEB', color: '#A32D2D' },
}

const EMPTY_FORM = {
  nom: '', proprietaire: '', responsable: '',
  quantite_depart: 1, etat_depart: 'Bon',
}

const EMPTY_RETOUR = {
  quantite_retour: 0, etat_retour: 'Bon',
  quantite_casse: 0, quantite_vole: 0, quantite_perdu: 0, incident: '',
}

export default function LogistiquePage() {
  const [materiel, setMateriel] = useState([])
  const [loading, setLoading] = useState(true)
  const [onglet, setOnglet] = useState('inventaire') // inventaire | incidents | bilan
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [recherche, setRecherche] = useState('')

  // Retour modal
  const [showRetour, setShowRetour] = useState(false)
  const [retourItem, setRetourItem] = useState(null)
  const [retourForm, setRetourForm] = useState(EMPTY_RETOUR)

  // Incident modal
  const [showIncident, setShowIncident] = useState(false)
  const [incidentItem, setIncidentItem] = useState(null)
  const [incidentForm, setIncidentForm] = useState({ type: 'cassé', quantite: 1, detail: '' })

  useEffect(() => { fetchMateriel() }, [])

  async function fetchMateriel() {
    const { data } = await supabase.from('materiel_logistique').select('*').order('nom')
    setMateriel(data || [])
    setLoading(false)
  }

  function setF(key, val) { setForm(f => ({ ...f, [key]: val })) }
  function setR(key, val) { setRetourForm(f => ({ ...f, [key]: val })) }
  function setI(key, val) { setIncidentForm(f => ({ ...f, [key]: val })) }

  async function handleSave() {
    if (!form.nom) return
    setSaving(true)
    const payload = {
      nom: form.nom,
      proprietaire: form.proprietaire,
      responsable: form.responsable,
      quantite: parseInt(form.quantite_depart) || 1,
      quantite_depart: parseInt(form.quantite_depart) || 1,
      etat_depart: form.etat_depart,
      statut: 'En stock',
    }
    if (editId) {
      await supabase.from('materiel_logistique').update(payload).eq('id', editId)
    } else {
      await supabase.from('materiel_logistique').insert([payload])
    }
    setSaving(false)
    setShowForm(false)
    setEditId(null)
    setForm(EMPTY_FORM)
    fetchMateriel()
  }

  async function handleRetour() {
    if (!retourItem) return
    setSaving(true)
    await supabase.from('materiel_logistique').update({
      quantite_retour: parseInt(retourForm.quantite_retour) || 0,
      etat_retour: retourForm.etat_retour,
      quantite_casse: parseInt(retourForm.quantite_casse) || 0,
      quantite_vole: parseInt(retourForm.quantite_vole) || 0,
      quantite_perdu: parseInt(retourForm.quantite_perdu) || 0,
      incident: retourForm.incident,
      statut: 'Retourné',
      checkout: true,
    }).eq('id', retourItem.id)
    setSaving(false)
    setShowRetour(false)
    setRetourItem(null)
    fetchMateriel()
  }

  async function handleSignalerIncident() {
    if (!incidentItem) return
    setSaving(true)
    const updates = {}
    if (incidentForm.type === 'cassé') updates.quantite_casse = (incidentItem.quantite_casse || 0) + parseInt(incidentForm.quantite)
    if (incidentForm.type === 'volé') updates.quantite_vole = (incidentItem.quantite_vole || 0) + parseInt(incidentForm.quantite)
    if (incidentForm.type === 'perdu') updates.quantite_perdu = (incidentItem.quantite_perdu || 0) + parseInt(incidentForm.quantite)
    const ancienIncident = incidentItem.incident ? incidentItem.incident + '\n' : ''
    updates.incident = ancienIncident + `[${incidentForm.type.toUpperCase()}] x${incidentForm.quantite} — ${incidentForm.detail}`
    await supabase.from('materiel_logistique').update(updates).eq('id', incidentItem.id)
    setSaving(false)
    setShowIncident(false)
    setIncidentItem(null)
    setIncidentForm({ type: 'cassé', quantite: 1, detail: '' })
    fetchMateriel()
  }

  async function supprimerMateriel(id) {
    if (!window.confirm('Supprimer cet équipement ?')) return
    await supabase.from('materiel_logistique').delete().eq('id', id)
    fetchMateriel()
  }

  function openRetour(m) {
    setRetourItem(m)
    setRetourForm({
      quantite_retour: m.quantite_depart || m.quantite || 0,
      etat_retour: m.etat_retour || 'Bon',
      quantite_casse: m.quantite_casse || 0,
      quantite_vole: m.quantite_vole || 0,
      quantite_perdu: m.quantite_perdu || 0,
      incident: m.incident || '',
    })
    setShowRetour(true)
  }

  function openIncident(m) {
    setIncidentItem(m)
    setIncidentForm({ type: 'cassé', quantite: 1, detail: '' })
    setShowIncident(true)
  }

  // Stats
  const totalEquip = materiel.length
  const totalDepart = materiel.reduce((s, m) => s + (m.quantite_depart || m.quantite || 0), 0)
  const totalRetour = materiel.reduce((s, m) => s + (m.quantite_retour || 0), 0)
  const totalIncidents = materiel.reduce((s, m) => s + (m.quantite_casse || 0) + (m.quantite_vole || 0) + (m.quantite_perdu || 0), 0)

  const filtres = materiel.filter(m =>
    m.nom.toLowerCase().includes(recherche.toLowerCase()) ||
    (m.responsable && m.responsable.toLowerCase().includes(recherche.toLowerCase())) ||
    (m.proprietaire && m.proprietaire.toLowerCase().includes(recherche.toLowerCase()))
  )

  const avecIncidents = materiel.filter(m => (m.quantite_casse || 0) + (m.quantite_vole || 0) + (m.quantite_perdu || 0) > 0)
  const retournes = materiel.filter(m => m.checkout)
  const nonRetournes = materiel.filter(m => !m.checkout)

  const inputStyle = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400"
  const labelStyle = "block text-xs text-gray-500 mb-1"

  return (
    <AdminLayout>
      <div className="mb-5 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-medium text-gray-800">Logistique</h1>
          <p className="text-sm text-gray-400 mt-0.5">{totalEquip} équipement(s) · {totalDepart} unité(s)</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => exportPDF(materiel)}
            style={{ background: '#A32D2D', color: '#fff', border: 'none', borderRadius: 10, padding: '7px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            PDF
          </button>
          <button onClick={() => exportExcel(materiel)}
            style={{ background: '#3B6D11', color: '#fff', border: 'none', borderRadius: 10, padding: '7px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Excel
          </button>
          <button onClick={() => { showForm && !editId ? setShowForm(false) : (setShowForm(true), setEditId(null), setForm(EMPTY_FORM)) }}
            className="bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-xl flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showForm && !editId ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"} />
            </svg>
            {showForm && !editId ? 'Fermer' : 'Ajouter'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div style={{ background: '#E1F5EE', borderRadius: 12, padding: '12px 14px' }}>
          <p style={{ fontSize: 22, fontWeight: 600, color: '#085041' }}>{totalDepart}</p>
          <p style={{ fontSize: 11, color: '#0F6E56' }}>Unités au départ</p>
        </div>
        <div style={{ background: '#E6F1FB', borderRadius: 12, padding: '12px 14px' }}>
          <p style={{ fontSize: 22, fontWeight: 600, color: '#185FA5' }}>{totalRetour}</p>
          <p style={{ fontSize: 11, color: '#185FA5' }}>Unités au retour</p>
        </div>
        <div style={{ background: totalIncidents > 0 ? '#FCEBEB' : '#F1EFE8', borderRadius: 12, padding: '12px 14px' }}>
          <p style={{ fontSize: 22, fontWeight: 600, color: totalIncidents > 0 ? '#A32D2D' : '#5F5E5A' }}>{totalIncidents}</p>
          <p style={{ fontSize: 11, color: totalIncidents > 0 ? '#993C1D' : '#888780' }}>
            {totalIncidents > 0 ? 'Incidents signalés' : 'Aucun incident'}
          </p>
        </div>
        <div style={{ background: nonRetournes.length > 0 ? '#FAEEDA' : '#F1EFE8', borderRadius: 12, padding: '12px 14px' }}>
          <p style={{ fontSize: 22, fontWeight: 600, color: nonRetournes.length > 0 ? '#854F0B' : '#5F5E5A' }}>{nonRetournes.length}</p>
          <p style={{ fontSize: 11, color: nonRetournes.length > 0 ? '#854F0B' : '#888780' }}>Non retournés</p>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-2 mb-4">
        {[
          { key: 'inventaire', label: 'Inventaire' },
          { key: 'incidents', label: `Incidents${avecIncidents.length > 0 ? ` (${avecIncidents.length})` : ''}` },
          { key: 'bilan', label: 'Bilan retour' },
        ].map(o => (
          <button key={o.key} onClick={() => setOnglet(o.key)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              border: `0.5px solid ${onglet === o.key ? '#085041' : '#e5e5e0'}`,
              background: onglet === o.key ? '#085041' : '#fff',
              color: onglet === o.key ? '#fff' : '#666',
            }}>
            {o.label}
          </button>
        ))}
      </div>

      {/* Formulaire ajout */}
      {showForm && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-5">
          <h2 className="text-sm font-medium text-gray-700 mb-4">
            {editId ? "Modifier l'équipement" : 'Nouvel équipement'}
          </h2>
          <div className="mb-3">
            <label className={labelStyle}>Nom de l'équipement *</label>
            <input type="text" value={form.nom} onChange={e => setF('nom', e.target.value)}
              placeholder="Ex : Micro sans fil, Baffle, Câble HDMI..."
              className={inputStyle} />
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className={labelStyle}>Quantité au départ</label>
              <input type="number" min="1" value={form.quantite_depart}
                onChange={e => setF('quantite_depart', e.target.value)} className={inputStyle} />
            </div>
            <div>
              <label className={labelStyle}>État au départ</label>
              <select value={form.etat_depart} onChange={e => setF('etat_depart', e.target.value)}
                className={inputStyle}>
                {ETATS.map(e => <option key={e}>{e}</option>)}
              </select>
            </div>
          </div>
          <div className="mb-3">
            <label className={labelStyle}>Propriétaire</label>
            <input type="text" value={form.proprietaire} onChange={e => setF('proprietaire', e.target.value)}
              placeholder="Ex : Navigateurs CI, Emprunté..." className={inputStyle} />
          </div>
          <div className="mb-4">
            <label className={labelStyle}>Responsable</label>
            <input type="text" value={form.responsable} onChange={e => setF('responsable', e.target.value)}
              placeholder="Ex : AKRE ALPHONSE" className={inputStyle} />
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setShowForm(false); setEditId(null) }}
              className="flex-1 bg-gray-100 text-gray-600 text-sm font-medium py-3 rounded-xl">Annuler</button>
            <button onClick={handleSave} disabled={saving || !form.nom}
              className="flex-1 bg-emerald-700 text-white text-sm font-medium py-3 rounded-xl disabled:opacity-60">
              {saving ? 'Enregistrement...' : editId ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </div>
      )}

      {/* Recherche */}
      <input type="text" value={recherche} onChange={e => setRecherche(e.target.value)}
        placeholder="Rechercher un équipement..."
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-4 bg-white outline-none focus:border-emerald-400" />

      {loading && <p className="text-sm text-gray-400 text-center py-8">Chargement...</p>}

      {/* ONGLET INVENTAIRE */}
      {onglet === 'inventaire' && (
        <div className="space-y-2">
          {filtres.map(m => {
            const ec = ETAT_CONFIG[m.etat_depart] || ETAT_CONFIG['Bon']
            const aIncident = (m.quantite_casse || 0) + (m.quantite_vole || 0) + (m.quantite_perdu || 0) > 0
            return (
              <div key={m.id} style={{ background: '#fff', borderRadius: 14, border: `0.5px solid ${aIncident ? '#F09595' : '#e5e5e0'}`, padding: '12px 14px' }}>
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>{m.nom}</p>
                      {aIncident && <span style={{ fontSize: 9, background: '#FCEBEB', color: '#A32D2D', borderRadius: 20, padding: '1px 6px', fontWeight: 500 }}>Incident</span>}
                    </div>

                    {/* Départ */}
                    <div style={{ background: '#f8f8f6', borderRadius: 8, padding: '8px 10px', marginBottom: 6 }}>
                      <p style={{ fontSize: 9, fontWeight: 600, color: '#085041', marginBottom: 4, letterSpacing: '0.05em' }}>DÉPART</p>
                      <div className="flex gap-4">
                        <span style={{ fontSize: 11, color: '#333' }}>Qté : <strong>{m.quantite_depart || m.quantite || 0}</strong></span>
                        <span style={{ fontSize: 11 }}>État : <span style={{ fontSize: 10, background: ec.bg, color: ec.color, borderRadius: 20, padding: '1px 6px', fontWeight: 500 }}>{m.etat_depart || 'Bon'}</span></span>
                      </div>
                      {m.responsable && <p style={{ fontSize: 10, color: '#888', marginTop: 3 }}>Resp : {m.responsable}</p>}
                      {m.proprietaire && <p style={{ fontSize: 10, color: '#888' }}>Proprio : {m.proprietaire}</p>}
                    </div>

                    {/* Retour si renseigné */}
                    {m.checkout && (
                      <div style={{ background: '#E1F5EE', borderRadius: 8, padding: '8px 10px', marginBottom: 6 }}>
                        <p style={{ fontSize: 9, fontWeight: 600, color: '#085041', marginBottom: 4, letterSpacing: '0.05em' }}>RETOUR</p>
                        <div className="flex gap-4 flex-wrap">
                          <span style={{ fontSize: 11, color: '#333' }}>Qté : <strong>{m.quantite_retour || 0}</strong></span>
                          <span style={{ fontSize: 11 }}>État : <span style={{ fontSize: 10, background: ETAT_CONFIG[m.etat_retour]?.bg || '#E1F5EE', color: ETAT_CONFIG[m.etat_retour]?.color || '#085041', borderRadius: 20, padding: '1px 6px', fontWeight: 500 }}>{m.etat_retour || 'Bon'}</span></span>
                        </div>
                        {(m.quantite_casse > 0 || m.quantite_vole > 0 || m.quantite_perdu > 0) && (
                          <div className="flex gap-3 mt-2 flex-wrap">
                            {m.quantite_casse > 0 && <span style={{ fontSize: 10, color: '#A32D2D' }}>Cassé : {m.quantite_casse}</span>}
                            {m.quantite_vole > 0 && <span style={{ fontSize: 10, color: '#854F0B' }}>Volé : {m.quantite_vole}</span>}
                            {m.quantite_perdu > 0 && <span style={{ fontSize: 10, color: '#534AB7' }}>Perdu : {m.quantite_perdu}</span>}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Boutons actions */}
                    <div className="flex gap-2 flex-wrap mt-1">
                      {!m.checkout && (
                        <>
                          <button onClick={() => openIncident(m)}
                            style={{ fontSize: 10, padding: '4px 8px', borderRadius: 8, border: '0.5px solid #F09595', background: '#FCEBEB', color: '#A32D2D', cursor: 'pointer' }}>
                            Signaler incident
                          </button>
                          <button onClick={() => openRetour(m)}
                            style={{ fontSize: 10, padding: '4px 8px', borderRadius: 8, border: '0.5px solid #085041', background: '#E1F5EE', color: '#085041', cursor: 'pointer' }}>
                            Enregistrer retour
                          </button>
                        </>
                      )}
                      {m.checkout && (
                        <span style={{ fontSize: 10, color: '#085041', background: '#E1F5EE', borderRadius: 20, padding: '2px 8px' }}>✓ Retourné</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => { setForm({ nom: m.nom, proprietaire: m.proprietaire || '', responsable: m.responsable || '', quantite_depart: m.quantite_depart || m.quantite || 1, etat_depart: m.etat_depart || 'Bon' }); setEditId(m.id); setShowForm(true) }}
                      style={{ width: 30, height: 30, borderRadius: 8, background: '#E1F5EE', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg style={{ width: 13, height: 13, color: '#085041' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button onClick={() => supprimerMateriel(m.id)}
                      style={{ width: 30, height: 30, borderRadius: 8, background: '#FCEBEB', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg style={{ width: 13, height: 13, color: '#A32D2D' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ONGLET INCIDENTS */}
      {onglet === 'incidents' && (
        <div className="space-y-2">
          {avecIncidents.length === 0 && (
            <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #e5e5e0', padding: 24, textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: '#888' }}>Aucun incident signalé.</p>
            </div>
          )}
          {avecIncidents.map(m => (
            <div key={m.id} style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #F09595', padding: '12px 14px' }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a', marginBottom: 8 }}>{m.nom}</p>
              <div className="flex gap-4 flex-wrap mb-3">
                {(m.quantite_casse || 0) > 0 && (
                  <div style={{ background: '#FCEBEB', borderRadius: 8, padding: '6px 10px' }}>
                    <p style={{ fontSize: 9, color: '#A32D2D', marginBottom: 2 }}>CASSÉ</p>
                    <p style={{ fontSize: 16, fontWeight: 600, color: '#A32D2D' }}>{m.quantite_casse}</p>
                  </div>
                )}
                {(m.quantite_vole || 0) > 0 && (
                  <div style={{ background: '#FAEEDA', borderRadius: 8, padding: '6px 10px' }}>
                    <p style={{ fontSize: 9, color: '#854F0B', marginBottom: 2 }}>VOLÉ</p>
                    <p style={{ fontSize: 16, fontWeight: 600, color: '#854F0B' }}>{m.quantite_vole}</p>
                  </div>
                )}
                {(m.quantite_perdu || 0) > 0 && (
                  <div style={{ background: '#EEEDFE', borderRadius: 8, padding: '6px 10px' }}>
                    <p style={{ fontSize: 9, color: '#534AB7', marginBottom: 2 }}>PERDU</p>
                    <p style={{ fontSize: 16, fontWeight: 600, color: '#534AB7' }}>{m.quantite_perdu}</p>
                  </div>
                )}
              </div>
              {m.incident && (
                <div style={{ background: '#f8f8f6', borderRadius: 8, padding: '8px 10px' }}>
                  <p style={{ fontSize: 10, color: '#666', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{m.incident}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ONGLET BILAN */}
      {onglet === 'bilan' && (
        <div className="space-y-2">
          {materiel.map(m => {
            const qteDepart = m.quantite_depart || m.quantite || 0
            const qteRetour = m.quantite_retour || 0
            const diff = qteDepart - qteRetour
            return (
              <div key={m.id} style={{ background: '#fff', borderRadius: 14, border: `0.5px solid ${diff > 0 ? '#F09595' : '#e5e5e0'}`, padding: '12px 14px' }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a', marginBottom: 8 }}>{m.nom}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  <div style={{ textAlign: 'center', padding: '8px', background: '#E1F5EE', borderRadius: 8 }}>
                    <p style={{ fontSize: 18, fontWeight: 600, color: '#085041' }}>{qteDepart}</p>
                    <p style={{ fontSize: 9, color: '#0F6E56' }}>Parti</p>
                  </div>
                  <div style={{ textAlign: 'center', padding: '8px', background: m.checkout ? '#E6F1FB' : '#f8f8f6', borderRadius: 8 }}>
                    <p style={{ fontSize: 18, fontWeight: 600, color: m.checkout ? '#185FA5' : '#888' }}>{qteRetour}</p>
                    <p style={{ fontSize: 9, color: m.checkout ? '#185FA5' : '#888' }}>Retourné</p>
                  </div>
                  <div style={{ textAlign: 'center', padding: '8px', background: diff > 0 ? '#FCEBEB' : '#E1F5EE', borderRadius: 8 }}>
                    <p style={{ fontSize: 18, fontWeight: 600, color: diff > 0 ? '#A32D2D' : '#085041' }}>{diff}</p>
                    <p style={{ fontSize: 9, color: diff > 0 ? '#993C1D' : '#085041' }}>{diff > 0 ? 'Manque' : 'OK'}</p>
                  </div>
                </div>
                {!m.checkout && (
                  <button onClick={() => openRetour(m)}
                    style={{ marginTop: 8, width: '100%', fontSize: 11, padding: '7px', borderRadius: 8, border: '0.5px solid #085041', background: '#E1F5EE', color: '#085041', cursor: 'pointer' }}>
                    Enregistrer le retour
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* MODAL RETOUR */}
      {showRetour && retourItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={() => setShowRetour(false)}>
          <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 480, padding: '20px 16px 32px' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 36, height: 3, background: '#e0e0e0', borderRadius: 2, margin: '0 auto 16px' }} />
            <p style={{ fontSize: 15, fontWeight: 500, color: '#1a1a1a', marginBottom: 4 }}>Retour — {retourItem.nom}</p>
            <p style={{ fontSize: 11, color: '#888', marginBottom: 16 }}>Parti : {retourItem.quantite_depart || retourItem.quantite || 0} unité(s)</p>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className={labelStyle}>Quantité retournée</label>
                <input type="number" min="0" value={retourForm.quantite_retour}
                  onChange={e => setR('quantite_retour', e.target.value)}
                  className={inputStyle} />
              </div>
              <div>
                <label className={labelStyle}>État au retour</label>
                <select value={retourForm.etat_retour} onChange={e => setR('etat_retour', e.target.value)} className={inputStyle}>
                  {ETATS.map(e => <option key={e}>{e}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              <div>
                <label className={labelStyle} style={{ color: '#A32D2D' }}>Cassé</label>
                <input type="number" min="0" value={retourForm.quantite_casse}
                  onChange={e => setR('quantite_casse', e.target.value)} className={inputStyle} />
              </div>
              <div>
                <label className={labelStyle} style={{ color: '#854F0B' }}>Volé</label>
                <input type="number" min="0" value={retourForm.quantite_vole}
                  onChange={e => setR('quantite_vole', e.target.value)} className={inputStyle} />
              </div>
              <div>
                <label className={labelStyle} style={{ color: '#534AB7' }}>Perdu</label>
                <input type="number" min="0" value={retourForm.quantite_perdu}
                  onChange={e => setR('quantite_perdu', e.target.value)} className={inputStyle} />
              </div>
            </div>

            <div className="mb-4">
              <label className={labelStyle}>Observation</label>
              <textarea value={retourForm.incident} onChange={e => setR('incident', e.target.value)}
                placeholder="Ex : 1 micro tombé en panne lors de la soirée du 25 août..."
                rows={3} className={inputStyle + " resize-none"} />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowRetour(false)}
                className="flex-1 bg-gray-100 text-gray-600 text-sm font-medium py-3 rounded-xl">Annuler</button>
              <button onClick={handleRetour} disabled={saving}
                className="flex-1 bg-emerald-700 text-white text-sm font-medium py-3 rounded-xl disabled:opacity-60">
                {saving ? 'Enregistrement...' : 'Confirmer le retour'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL INCIDENT */}
      {showIncident && incidentItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={() => setShowIncident(false)}>
          <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 480, padding: '20px 16px 32px' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 36, height: 3, background: '#e0e0e0', borderRadius: 2, margin: '0 auto 16px' }} />
            <p style={{ fontSize: 15, fontWeight: 500, color: '#1a1a1a', marginBottom: 16 }}>Signaler un incident — {incidentItem.nom}</p>

            <div className="mb-3">
              <label className={labelStyle}>Type d'incident</label>
              <div className="grid grid-cols-3 gap-2">
                {[{ key: 'cassé', color: '#A32D2D', bg: '#FCEBEB' }, { key: 'volé', color: '#854F0B', bg: '#FAEEDA' }, { key: 'perdu', color: '#534AB7', bg: '#EEEDFE' }].map(t => (
                  <button key={t.key} onClick={() => setI('type', t.key)}
                    style={{ padding: '8px', borderRadius: 10, border: `0.5px solid ${incidentForm.type === t.key ? t.color : '#e5e5e0'}`, background: incidentForm.type === t.key ? t.bg : '#fff', color: t.color, fontSize: 12, fontWeight: incidentForm.type === t.key ? 600 : 400, cursor: 'pointer', textTransform: 'capitalize' }}>
                    {t.key}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-3">
              <label className={labelStyle}>Quantité concernée</label>
              <input type="number" min="1" value={incidentForm.quantite}
                onChange={e => setI('quantite', e.target.value)} className={inputStyle} />
            </div>

            <div className="mb-4">
              <label className={labelStyle}>Description</label>
              <textarea value={incidentForm.detail} onChange={e => setI('detail', e.target.value)}
                placeholder="Ex : Tombé lors du transport, câble sectionné..."
                rows={3} className={inputStyle + " resize-none"} />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowIncident(false)}
                className="flex-1 bg-gray-100 text-gray-600 text-sm font-medium py-3 rounded-xl">Annuler</button>
              <button onClick={handleSignalerIncident} disabled={saving}
                style={{ flex: 1, background: '#A32D2D', color: '#fff', border: 'none', borderRadius: 12, padding: '12px', fontSize: 13, fontWeight: 500, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Enregistrement...' : 'Signaler'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
