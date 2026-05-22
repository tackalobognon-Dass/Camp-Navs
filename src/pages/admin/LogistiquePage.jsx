import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/admin/AdminLayout'

const CATEGORIES = ['Son & Musique', 'Éclairage', 'Transport', 'Cuisine', 'Sport & Loisirs', 'Bureau & Admin', 'Médical', 'Autre']
const ETATS = ['Bon', 'Moyen', 'Mauvais']
const STATUTS = ['En stock', 'Transporté', 'Sur place', 'Retourné']

const STATUT_CONFIG = {
  'En stock':   { bg: '#E1F5EE', color: '#085041', dot: '#085041' },
  'Transporté': { bg: '#E6F1FB', color: '#185FA5', dot: '#185FA5' },
  'Sur place':  { bg: '#FAEEDA', color: '#854F0B', dot: '#854F0B' },
  'Retourné':   { bg: '#F1EFE8', color: '#5F5E5A', dot: '#888780' },
}

const EMPTY_FORM = {
  nom: '', categorie: 'Autre', proprietaire: '', responsable: '',
  quantite_depart: 1, etat_depart: 'Bon',
  date_depart: '', date_retour: '',
}

const EMPTY_RETOUR = {
  etat_retour: 'Bon', quantite_casse: 0,
  quantite_vole: 0, quantite_perdu: 0, incident: '',
}

function exportExcel(materiel, responsableGeneral) {
  const now = new Date().toLocaleDateString('fr-FR')
  const lignes = [
    ['BILAN LOGISTIQUE — CAMP-NAVS 2026'],
    [`Responsable général : ${responsableGeneral || '-'}`],
    [`Exporté le ${now}`], [],
    ['=== INVENTAIRE ==='],
    ['Équipement', 'Catégorie', 'Propriétaire', 'Responsable', 'Qté départ', 'État départ', 'Date départ', 'Qté retour', 'État retour', 'Date retour', 'Cassé', 'Volé', 'Perdu', 'Manquant', 'Observation'],
    ...materiel.map(m => {
      const qd = m.quantite_depart || m.quantite || 0
      const qr = qd - (m.quantite_vole || 0) - (m.quantite_perdu || 0)
      const manquant = (m.quantite_vole || 0) + (m.quantite_perdu || 0)
      return [m.nom, m.categorie || 'Autre', m.proprietaire || '', m.responsable || '',
        qd, m.etat_depart || 'Bon', m.date_depart || '-',
        m.checkout ? qr : '-', m.checkout ? (m.etat_retour || 'Bon') : '-', m.date_retour || '-',
        m.quantite_casse || 0, m.quantite_vole || 0, m.quantite_perdu || 0,
        manquant, m.incident || '']
    }),
    [], ['=== INCIDENTS ==='],
    ['Équipement', 'Cassé', 'Volé', 'Perdu', 'Description'],
    ...materiel.filter(m => (m.quantite_casse || 0) + (m.quantite_vole || 0) + (m.quantite_perdu || 0) > 0)
      .map(m => [m.nom, m.quantite_casse || 0, m.quantite_vole || 0, m.quantite_perdu || 0, m.incident || '']),
    [], ['=== BILAN ==='],
    ['Équipement', 'Parti', 'Retourné', 'Cassés', 'Volés', 'Perdus', 'Manquant'],
    ...materiel.map(m => {
      const qd = m.quantite_depart || m.quantite || 0
      const qr = qd - (m.quantite_vole || 0) - (m.quantite_perdu || 0)
      return [m.nom, qd, m.checkout ? qr : '-', m.quantite_casse || 0, m.quantite_vole || 0, m.quantite_perdu || 0, (m.quantite_vole || 0) + (m.quantite_perdu || 0)]
    }),
  ]
  const csv = '\uFEFF' + lignes.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Bilan_Logistique_CampNavs2026_${now.replace(/\//g, '-')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function exportPDF(materiel, responsableGeneral) {
  const now = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const totalDepart = materiel.reduce((s, m) => s + (m.quantite_depart || m.quantite || 0), 0)
  const totalVole = materiel.reduce((s, m) => s + (m.quantite_vole || 0), 0)
  const totalPerdu = materiel.reduce((s, m) => s + (m.quantite_perdu || 0), 0)
  const totalCasse = materiel.reduce((s, m) => s + (m.quantite_casse || 0), 0)
  const avecIncidents = materiel.filter(m => (m.quantite_casse || 0) + (m.quantite_vole || 0) + (m.quantite_perdu || 0) > 0)

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<title>Bilan Logistique — Camp-Navs 2026</title>
<style>
  body{font-family:Arial,sans-serif;font-size:12px;color:#1a1a1a;margin:30px}
  h1{font-size:20px;color:#085041;margin-bottom:4px}
  h2{font-size:14px;color:#085041;margin:24px 0 10px;border-bottom:2px solid #085041;padding-bottom:4px}
  .subtitle{font-size:12px;color:#666;margin-bottom:6px}
  .resume{display:flex;gap:16px;margin-bottom:20px;flex-wrap:wrap}
  .stat{background:#E1F5EE;border-radius:8px;padding:10px 14px;min-width:100px}
  .stat .num{font-size:20px;font-weight:bold;color:#085041}
  .stat .lbl{font-size:10px;color:#0F6E56}
  .stat.danger{background:#FCEBEB}.stat.danger .num{color:#A32D2D}.stat.danger .lbl{color:#993C1D}
  .stat.warn{background:#FAEEDA}.stat.warn .num{color:#854F0B}.stat.warn .lbl{color:#854F0B}
  table{width:100%;border-collapse:collapse;margin-bottom:16px}
  th{background:#085041;color:#fff;padding:7px 10px;text-align:left;font-size:11px}
  td{padding:6px 10px;border-bottom:0.5px solid #e5e5e0;font-size:11px}
  tr:nth-child(even) td{background:#f8f8f6}
  .badge{padding:2px 8px;border-radius:20px;font-size:10px;font-weight:bold}
  .ok{background:#E1F5EE;color:#085041}.warn{background:#FAEEDA;color:#854F0B}.danger{background:#FCEBEB;color:#A32D2D}
  .footer{margin-top:30px;font-size:10px;color:#888;text-align:center;border-top:0.5px solid #e5e5e0;padding-top:10px}
</style></head><body>
<h1>Bilan Logistique — Camp-Navs 2026</h1>
<p class="subtitle">La Sablière · Bingerville · 23–29 août 2026</p>
<p class="subtitle">Responsable général : <strong>${responsableGeneral || '-'}</strong></p>
<p class="subtitle">Généré le ${now}</p>
<div class="resume">
  <div class="stat"><div class="num">${materiel.length}</div><div class="lbl">Équipements</div></div>
  <div class="stat"><div class="num">${totalDepart}</div><div class="lbl">Unités au départ</div></div>
  <div class="stat ${totalCasse > 0 ? 'warn' : ''}"><div class="num">${totalCasse}</div><div class="lbl">Cassés</div></div>
  <div class="stat ${totalVole > 0 ? 'danger' : ''}"><div class="num">${totalVole}</div><div class="lbl">Volés</div></div>
  <div class="stat ${totalPerdu > 0 ? 'danger' : ''}"><div class="num">${totalPerdu}</div><div class="lbl">Perdus</div></div>
</div>
<h2>Inventaire complet</h2>
<table><tr><th>Équipement</th><th>Catégorie</th><th>Resp.</th><th>Qté départ</th><th>État départ</th><th>Qté retour</th><th>État retour</th><th>Manquant</th></tr>
${materiel.map(m => {
  const qd = m.quantite_depart || m.quantite || 0
  const qr = qd - (m.quantite_vole || 0) - (m.quantite_perdu || 0)
  const manquant = (m.quantite_vole || 0) + (m.quantite_perdu || 0)
  return `<tr><td><strong>${m.nom}</strong></td><td>${m.categorie || 'Autre'}</td><td>${m.responsable || '-'}</td>
    <td>${qd}</td><td><span class="badge ok">${m.etat_depart || 'Bon'}</span></td>
    <td>${m.checkout ? qr : '-'}</td>
    <td>${m.checkout ? `<span class="badge ${m.etat_retour === 'Mauvais' ? 'danger' : m.etat_retour === 'Moyen' ? 'warn' : 'ok'}">${m.etat_retour || 'Bon'}</span>` : '-'}</td>
    <td>${manquant > 0 ? `<span class="badge danger">${manquant}</span>` : '<span class="badge ok">0</span>'}</td></tr>`
}).join('')}
</table>
${avecIncidents.length > 0 ? `<h2>Incidents</h2>
<table><tr><th>Équipement</th><th>Cassé</th><th>Volé</th><th>Perdu</th><th>Description</th></tr>
${avecIncidents.map(m => `<tr><td><strong>${m.nom}</strong></td>
  <td>${(m.quantite_casse||0)>0?`<span class="badge warn">${m.quantite_casse}</span>`:'0'}</td>
  <td>${(m.quantite_vole||0)>0?`<span class="badge danger">${m.quantite_vole}</span>`:'0'}</td>
  <td>${(m.quantite_perdu||0)>0?`<span class="badge danger">${m.quantite_perdu}</span>`:'0'}</td>
  <td>${m.incident||'-'}</td></tr>`).join('')}
</table>` : ''}
<div class="footer">Camp-Navs 2026 · Mission Évangélique des Navigateurs — Côte d'Ivoire · ${now}</div>
</body></html>`

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank')
  if (win) setTimeout(() => win.print(), 800)
  URL.revokeObjectURL(url)
}

export default function LogistiquePage() {
  const [materiel, setMateriel] = useState([])
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
  const menuRef = useRef(null)

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOuvert(null)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function fetchData() {
    const [{ data: m }, { data: cfg }] = await Promise.all([
      supabase.from('materiel_logistique').select('*').order('nom'),
      supabase.from('config_logistique').select('*').limit(1),
    ])
    setMateriel(m || [])
    if (cfg && cfg.length > 0) {
      setResponsableGeneral(cfg[0].responsable_general || '')
      setResponsableForm(cfg[0].responsable_general || '')
      setConfigId(cfg[0].id)
    }
    setLoading(false)
  }

  function setF(k, v) { setForm(f => ({ ...f, [k]: v })) }
  function setR(k, v) { setRetourForm(f => ({ ...f, [k]: v })) }
  function setI(k, v) { setIncidentForm(f => ({ ...f, [k]: v })) }

  async function handleSave() {
    if (!form.nom) return
    setSaving(true)
    const payload = {
      nom: form.nom, categorie: form.categorie,
      proprietaire: form.proprietaire, responsable: form.responsable,
      quantite: parseInt(form.quantite_depart) || 1,
      quantite_depart: parseInt(form.quantite_depart) || 1,
      etat_depart: form.etat_depart, statut: 'En stock',
      date_depart: form.date_depart || null,
      date_retour: form.date_retour || null,
    }
    if (editId) {
      await supabase.from('materiel_logistique').update(payload).eq('id', editId)
    } else {
      await supabase.from('materiel_logistique').insert([{ ...payload, checkin: false, checkout: false }])
    }
    setSaving(false)
    setShowForm(false)
    setEditId(null)
    setForm(EMPTY_FORM)
    fetchData()
  }

  async function saveResponsable() {
    setSaving(true)
    if (configId) {
      await supabase.from('config_logistique').update({ responsable_general: responsableForm, updated_at: new Date().toISOString() }).eq('id', configId)
    }
    setResponsableGeneral(responsableForm)
    setEditResponsable(false)
    setSaving(false)
  }

  async function handleRetour() {
    if (!retourItem) return
    setSaving(true)
    const qd = retourItem.quantite_depart || retourItem.quantite || 0
    const qr = qd - (parseInt(retourForm.quantite_vole) || 0) - (parseInt(retourForm.quantite_perdu) || 0)
    await supabase.from('materiel_logistique').update({
      quantite_retour: qr,
      etat_retour: retourForm.etat_retour,
      quantite_casse: parseInt(retourForm.quantite_casse) || 0,
      quantite_vole: parseInt(retourForm.quantite_vole) || 0,
      quantite_perdu: parseInt(retourForm.quantite_perdu) || 0,
      incident: retourForm.incident,
      statut: 'Retourné', checkout: true,
      date_retour: new Date().toISOString().split('T')[0],
    }).eq('id', retourItem.id)
    setSaving(false)
    setShowRetour(false)
    setRetourItem(null)
    fetchData()
  }

  async function handleSignalerIncident() {
    if (!incidentItem) return
    setSaving(true)
    const updates = {}
    const qte = parseInt(incidentForm.quantite) || 1
    if (incidentForm.type === 'cassé') updates.quantite_casse = (incidentItem.quantite_casse || 0) + qte
    if (incidentForm.type === 'volé') updates.quantite_vole = (incidentItem.quantite_vole || 0) + qte
    if (incidentForm.type === 'perdu') updates.quantite_perdu = (incidentItem.quantite_perdu || 0) + qte
    const ancien = incidentItem.incident ? incidentItem.incident + '\n' : ''
    updates.incident = ancien + `[${incidentForm.type.toUpperCase()}] x${qte} — ${incidentForm.detail}`
    await supabase.from('materiel_logistique').update(updates).eq('id', incidentItem.id)
    setSaving(false)
    setShowIncident(false)
    setIncidentItem(null)
    setIncidentForm({ type: 'cassé', quantite: 1, detail: '' })
    fetchData()
  }

  async function supprimerMateriel(id) {
    if (!window.confirm('Supprimer cet équipement ?')) return
    await supabase.from('materiel_logistique').delete().eq('id', id)
    setMenuOuvert(null)
    fetchData()
  }

  function openRetour(m) {
    setRetourItem(m)
    setRetourForm({
      etat_retour: m.etat_retour || 'Bon',
      quantite_casse: m.quantite_casse || 0,
      quantite_vole: m.quantite_vole || 0,
      quantite_perdu: m.quantite_perdu || 0,
      incident: m.incident || '',
    })
    setShowRetour(true)
    setMenuOuvert(null)
  }

  function openEdit(m) {
    setForm({
      nom: m.nom, categorie: m.categorie || 'Autre',
      proprietaire: m.proprietaire || '', responsable: m.responsable || '',
      quantite_depart: m.quantite_depart || m.quantite || 1,
      etat_depart: m.etat_depart || 'Bon',
      date_depart: m.date_depart || '', date_retour: m.date_retour || '',
    })
    setEditId(m.id)
    setShowForm(true)
    setMenuOuvert(null)
  }

  // Stats
  const totalEquip = materiel.length
  const totalDepart = materiel.reduce((s, m) => s + (m.quantite_depart || m.quantite || 0), 0)
  const totalVole = materiel.reduce((s, m) => s + (m.quantite_vole || 0), 0)
  const totalPerdu = materiel.reduce((s, m) => s + (m.quantite_perdu || 0), 0)
  const totalCasse = materiel.reduce((s, m) => s + (m.quantite_casse || 0), 0)
  const nonRetournes = materiel.filter(m => !m.checkout).length
  const avecIncidents = materiel.filter(m => (m.quantite_casse || 0) + (m.quantite_vole || 0) + (m.quantite_perdu || 0) > 0)

  const filtres = materiel
    .filter(m => filtreCategorie === 'toutes' || m.categorie === filtreCategorie)
    .filter(m => m.nom.toLowerCase().includes(recherche.toLowerCase()) || (m.responsable && m.responsable.toLowerCase().includes(recherche.toLowerCase())))

  const inputStyle = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400"

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-medium text-gray-800">Logistique</h1>
          <p className="text-sm text-gray-400 mt-0.5">{totalEquip} équipement(s) · {totalDepart} unité(s)</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportPDF(materiel, responsableGeneral)}
            style={{ background: '#A32D2D', color: '#fff', border: 'none', borderRadius: 10, padding: '7px 12px', fontSize: 11, fontWeight: 500, cursor: 'pointer' }}>PDF</button>
          <button onClick={() => exportExcel(materiel, responsableGeneral)}
            style={{ background: '#3B6D11', color: '#fff', border: 'none', borderRadius: 10, padding: '7px 12px', fontSize: 11, fontWeight: 500, cursor: 'pointer' }}>Excel</button>
          <button onClick={() => { showForm && !editId ? setShowForm(false) : (setShowForm(true), setEditId(null), setForm(EMPTY_FORM)) }}
            className="bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-xl flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showForm && !editId ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"} />
            </svg>
            {showForm && !editId ? 'Fermer' : 'Ajouter'}
          </button>
        </div>
      </div>

      {/* Responsable général */}
      <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #e5e5e0', padding: '12px 14px', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 9, color: '#085041', fontWeight: 600, letterSpacing: '0.05em', marginBottom: 3 }}>RESPONSABLE GÉNÉRAL</p>
            {editResponsable ? (
              <div className="flex gap-2 mt-1">
                <input type="text" value={responsableForm} onChange={e => setResponsableForm(e.target.value)}
                  placeholder="Nom du responsable"
                  style={{ flex: 1, border: '0.5px solid #e5e5e0', borderRadius: 8, padding: '5px 10px', fontSize: 13, outline: 'none' }} />
                <button onClick={saveResponsable}
                  style={{ background: '#085041', color: '#fff', border: 'none', borderRadius: 8, padding: '5px 12px', fontSize: 12, cursor: 'pointer' }}>
                  {saving ? '...' : 'OK'}
                </button>
              </div>
            ) : (
              <p style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a' }}>
                {responsableGeneral || <span style={{ color: '#aaa', fontWeight: 400, fontSize: 12 }}>Non défini</span>}
              </p>
            )}
          </div>
          {!editResponsable && (
            <button onClick={() => { setEditResponsable(true); setResponsableForm(responsableGeneral) }}
              style={{ fontSize: 11, color: '#085041', background: '#E1F5EE', border: 'none', borderRadius: 8, padding: '5px 10px', cursor: 'pointer' }}>
              Modifier
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div style={{ background: '#E1F5EE', borderRadius: 12, padding: '12px 14px' }}>
          <p style={{ fontSize: 20, fontWeight: 600, color: '#085041' }}>{totalDepart}</p>
          <p style={{ fontSize: 11, color: '#0F6E56' }}>Unités au départ</p>
        </div>
        <div style={{ background: nonRetournes > 0 ? '#FAEEDA' : '#F1EFE8', borderRadius: 12, padding: '12px 14px' }}>
          <p style={{ fontSize: 20, fontWeight: 600, color: nonRetournes > 0 ? '#854F0B' : '#5F5E5A' }}>{nonRetournes}</p>
          <p style={{ fontSize: 11, color: nonRetournes > 0 ? '#854F0B' : '#888' }}>Non retournés</p>
        </div>
        <div style={{ background: totalCasse > 0 ? '#FAEEDA' : '#F1EFE8', borderRadius: 12, padding: '12px 14px' }}>
          <p style={{ fontSize: 20, fontWeight: 600, color: totalCasse > 0 ? '#854F0B' : '#5F5E5A' }}>{totalCasse}</p>
          <p style={{ fontSize: 11, color: totalCasse > 0 ? '#854F0B' : '#888' }}>Cassés</p>
        </div>
        <div style={{ background: (totalVole + totalPerdu) > 0 ? '#FCEBEB' : '#F1EFE8', borderRadius: 12, padding: '12px 14px' }}>
          <p style={{ fontSize: 20, fontWeight: 600, color: (totalVole + totalPerdu) > 0 ? '#A32D2D' : '#5F5E5A' }}>{totalVole + totalPerdu}</p>
          <p style={{ fontSize: 11, color: (totalVole + totalPerdu) > 0 ? '#993C1D' : '#888' }}>Volés + Perdus</p>
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
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ border: `0.5px solid ${onglet === o.key ? '#085041' : '#e5e5e0'}`, background: onglet === o.key ? '#085041' : '#fff', color: onglet === o.key ? '#fff' : '#666' }}>
            {o.label}
          </button>
        ))}
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-4">
          <h2 className="text-sm font-medium text-gray-700 mb-4">{editId ? "Modifier l'équipement" : 'Nouvel équipement'}</h2>
          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-1">Nom *</label>
            <input type="text" value={form.nom} onChange={e => setF('nom', e.target.value)}
              placeholder="Ex : Micro sans fil, Baffle..." className={inputStyle} />
          </div>
          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-1">Catégorie</label>
            <select value={form.categorie} onChange={e => setF('categorie', e.target.value)} className={inputStyle}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Quantité au départ</label>
              <input type="number" min="1" value={form.quantite_depart} onChange={e => setF('quantite_depart', e.target.value)} className={inputStyle} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">État au départ</label>
              <select value={form.etat_depart} onChange={e => setF('etat_depart', e.target.value)} className={inputStyle}>
                {ETATS.map(e => <option key={e}>{e}</option>)}
              </select>
            </div>
          </div>
          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-1">Propriétaire</label>
            <input type="text" value={form.proprietaire} onChange={e => setF('proprietaire', e.target.value)}
              placeholder="Ex : Navigateurs CI, Emprunté..." className={inputStyle} />
          </div>
          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-1">Responsable</label>
            <input type="text" value={form.responsable} onChange={e => setF('responsable', e.target.value)}
              placeholder="Ex : AKRE ALPHONSE" className={inputStyle} />
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Date de départ prévue</label>
              <input type="date" value={form.date_depart} onChange={e => setF('date_depart', e.target.value)} className={inputStyle} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Date de retour prévue</label>
              <input type="date" value={form.date_retour} onChange={e => setF('date_retour', e.target.value)} className={inputStyle} />
            </div>
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

      {/* Filtres catégorie */}
      {onglet === 'inventaire' && (
        <>
          <div className="flex gap-2 overflow-x-auto mb-3 pb-1" style={{ scrollbarWidth: 'none' }}>
            {['toutes', ...CATEGORIES].map(c => (
              <button key={c} onClick={() => setFiltreCategorie(c)}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium"
                style={{ border: `0.5px solid ${filtreCategorie === c ? '#085041' : '#e5e5e0'}`, background: filtreCategorie === c ? '#085041' : '#fff', color: filtreCategorie === c ? '#fff' : '#666' }}>
                {c === 'toutes' ? 'Toutes' : c}
              </button>
            ))}
          </div>
          <input type="text" value={recherche} onChange={e => setRecherche(e.target.value)}
            placeholder="Rechercher un équipement..."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-4 bg-white outline-none focus:border-emerald-400" />
        </>
      )}

      {loading && <p className="text-sm text-gray-400 text-center py-8">Chargement...</p>}

      {/* INVENTAIRE */}
      {onglet === 'inventaire' && (
        <div className="space-y-2" ref={menuRef}>
          {filtres.length === 0 && !loading && (
            <div className="bg-white border border-gray-100 rounded-xl p-6 text-center">
              <p className="text-sm text-gray-400">Aucun équipement trouvé.</p>
            </div>
          )}
          {filtres.map(m => {
            const sc = STATUT_CONFIG[m.statut] || STATUT_CONFIG['En stock']
            const aIncident = (m.quantite_casse || 0) + (m.quantite_vole || 0) + (m.quantite_perdu || 0) > 0
            const qd = m.quantite_depart || m.quantite || 0
            const qr = qd - (m.quantite_vole || 0) - (m.quantite_perdu || 0)
            return (
              <div key={m.id} style={{ background: '#fff', borderRadius: 14, border: `0.5px solid ${aIncident ? '#F09595' : '#e5e5e0'}`, padding: '12px 14px' }}>
                <div className="flex items-start gap-3">
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: sc.dot, flexShrink: 0, marginTop: 6 }} />
                  <div className="flex-1 min-w-0">
                    {/* Nom + badges */}
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>{m.nom}</p>
                      {m.categorie && <span style={{ fontSize: 9, background: '#f5f5f3', color: '#666', borderRadius: 20, padding: '1px 6px' }}>{m.categorie}</span>}
                      <span style={{ fontSize: 9, background: sc.bg, color: sc.color, borderRadius: 20, padding: '1px 6px', fontWeight: 500 }}>{m.statut}</span>
                      {aIncident && <span style={{ fontSize: 9, background: '#FCEBEB', color: '#A32D2D', borderRadius: 20, padding: '1px 6px', fontWeight: 500 }}>Incident</span>}
                    </div>
                    {/* Infos */}
                    <div className="flex gap-3 flex-wrap mb-1">
                      <span style={{ fontSize: 10, color: '#888' }}>Qté départ : {qd}</span>
                      {m.checkout && <span style={{ fontSize: 10, color: '#085041' }}>Retourné : {qr}</span>}
                      {m.responsable && <span style={{ fontSize: 10, color: '#888' }}>Resp : {m.responsable}</span>}
                    </div>
                    {/* État retour */}
                    {m.checkout && (
                      <div style={{ background: '#f8f8f6', borderRadius: 8, padding: '6px 10px', marginBottom: 6 }}>
                        <div className="flex gap-4 flex-wrap">
                          <span style={{ fontSize: 10, color: '#085041' }}>Retourné : {qr} ({m.etat_retour})</span>
                          {(m.quantite_casse || 0) > 0 && <span style={{ fontSize: 10, color: '#854F0B' }}>Cassé : {m.quantite_casse}</span>}
                          {(m.quantite_vole || 0) > 0 && <span style={{ fontSize: 10, color: '#A32D2D' }}>Volé : {m.quantite_vole}</span>}
                          {(m.quantite_perdu || 0) > 0 && <span style={{ fontSize: 10, color: '#534AB7' }}>Perdu : {m.quantite_perdu}</span>}
                        </div>
                        {m.incident && <p style={{ fontSize: 10, color: '#666', marginTop: 3, fontStyle: 'italic', whiteSpace: 'pre-line' }}>{m.incident}</p>}
                      </div>
                    )}
                    {/* Boutons action */}
                    {!m.checkout && (
                      <div className="flex gap-2 mt-1">
                        <button onClick={(e) => { e.stopPropagation(); setIncidentItem(m); setIncidentForm({ type: 'cassé', quantite: 1, detail: '' }); setShowIncident(true) }}
                          style={{ fontSize: 10, padding: '4px 8px', borderRadius: 8, border: '0.5px solid #F09595', background: '#FCEBEB', color: '#A32D2D', cursor: 'pointer' }}>
                          Signaler incident
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); openRetour(m) }}
                          style={{ fontSize: 10, padding: '4px 8px', borderRadius: 8, border: '0.5px solid #085041', background: '#E1F5EE', color: '#085041', cursor: 'pointer' }}>
                          Enregistrer retour
                        </button>
                      </div>
                    )}
                    {m.checkout && <span style={{ fontSize: 10, color: '#085041', background: '#E1F5EE', borderRadius: 20, padding: '2px 8px', display: 'inline-block', marginTop: 4 }}>✓ Retourné</span>}
                  </div>

                  {/* Menu ... */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <button onClick={() => setMenuOuvert(menuOuvert === m.id ? null : m.id)}
                      style={{ width: 30, height: 30, borderRadius: 8, background: '#f5f5f3', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#666' }}>
                      ···
                    </button>
                    {menuOuvert === m.id && (
                      <div style={{ position: 'absolute', right: 0, top: 34, background: '#fff', borderRadius: 12, border: '0.5px solid #e5e5e0', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', zIndex: 20, minWidth: 130, overflow: 'hidden' }}>
                        <button onClick={() => openEdit(m)}
                          style={{ width: '100%', padding: '10px 14px', fontSize: 12, color: '#1a1a1a', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          Modifier
                        </button>
                        <div style={{ height: '0.5px', background: '#f0f0ee' }} />
                        <button onClick={() => supprimerMateriel(m.id)}
                          style={{ width: '100%', padding: '10px 14px', fontSize: 12, color: '#A32D2D', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          Supprimer
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* INCIDENTS */}
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
              <div className="flex gap-3 flex-wrap mb-2">
                {(m.quantite_casse || 0) > 0 && <div style={{ background: '#FAEEDA', borderRadius: 8, padding: '6px 12px', textAlign: 'center' }}><p style={{ fontSize: 16, fontWeight: 600, color: '#854F0B' }}>{m.quantite_casse}</p><p style={{ fontSize: 9, color: '#854F0B' }}>CASSÉ</p></div>}
                {(m.quantite_vole || 0) > 0 && <div style={{ background: '#FCEBEB', borderRadius: 8, padding: '6px 12px', textAlign: 'center' }}><p style={{ fontSize: 16, fontWeight: 600, color: '#A32D2D' }}>{m.quantite_vole}</p><p style={{ fontSize: 9, color: '#A32D2D' }}>VOLÉ</p></div>}
                {(m.quantite_perdu || 0) > 0 && <div style={{ background: '#EEEDFE', borderRadius: 8, padding: '6px 12px', textAlign: 'center' }}><p style={{ fontSize: 16, fontWeight: 600, color: '#534AB7' }}>{m.quantite_perdu}</p><p style={{ fontSize: 9, color: '#534AB7' }}>PERDU</p></div>}
              </div>
              {m.incident && <div style={{ background: '#f8f8f6', borderRadius: 8, padding: '8px 10px' }}><p style={{ fontSize: 10, color: '#666', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{m.incident}</p></div>}
            </div>
          ))}
        </div>
      )}

      {/* BILAN */}
      {onglet === 'bilan' && (
        <div className="space-y-2">
          {materiel.map(m => {
            const qd = m.quantite_depart || m.quantite || 0
            const qr = qd - (m.quantite_vole || 0) - (m.quantite_perdu || 0)
            const manquant = (m.quantite_vole || 0) + (m.quantite_perdu || 0)
            const casse = m.quantite_casse || 0
            return (
              <div key={m.id} style={{ background: '#fff', borderRadius: 14, border: `0.5px solid ${manquant > 0 ? '#F09595' : '#e5e5e0'}`, padding: '12px 14px' }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a', marginBottom: 8 }}>{m.nom}</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
                  <div style={{ textAlign: 'center', background: '#E1F5EE', borderRadius: 8, padding: '7px 4px' }}>
                    <p style={{ fontSize: 16, fontWeight: 600, color: '#085041' }}>{qd}</p>
                    <p style={{ fontSize: 8, color: '#085041' }}>Parti</p>
                  </div>
                  <div style={{ textAlign: 'center', background: m.checkout ? '#E6F1FB' : '#f8f8f6', borderRadius: 8, padding: '7px 4px' }}>
                    <p style={{ fontSize: 16, fontWeight: 600, color: m.checkout ? '#185FA5' : '#aaa' }}>{m.checkout ? qr : '-'}</p>
                    <p style={{ fontSize: 8, color: m.checkout ? '#185FA5' : '#aaa' }}>Retourné</p>
                  </div>
                  <div style={{ textAlign: 'center', background: casse > 0 ? '#FAEEDA' : '#f8f8f6', borderRadius: 8, padding: '7px 4px' }}>
                    <p style={{ fontSize: 16, fontWeight: 600, color: casse > 0 ? '#854F0B' : '#aaa' }}>{casse}</p>
                    <p style={{ fontSize: 8, color: casse > 0 ? '#854F0B' : '#aaa' }}>Cassés</p>
                  </div>
                  <div style={{ textAlign: 'center', background: manquant > 0 ? '#FCEBEB' : '#E1F5EE', borderRadius: 8, padding: '7px 4px' }}>
                    <p style={{ fontSize: 16, fontWeight: 600, color: manquant > 0 ? '#A32D2D' : '#085041' }}>{manquant}</p>
                    <p style={{ fontSize: 8, color: manquant > 0 ? '#993C1D' : '#085041' }}>Manquant</p>
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
            <p style={{ fontSize: 11, color: '#888', marginBottom: 16 }}>
              Parti : {retourItem.quantite_depart || retourItem.quantite || 0} unité(s)
            </p>

            <div className="mb-3">
              <label className="block text-xs text-gray-500 mb-1">État au retour</label>
              <select value={retourForm.etat_retour} onChange={e => setR('etat_retour', e.target.value)} className={inputStyle}>
                {ETATS.map(e => <option key={e}>{e}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-2">
              <div>
                <label className="block text-xs mb-1" style={{ color: '#854F0B' }}>Cassés</label>
                <input type="number" min="0" value={retourForm.quantite_casse} onChange={e => setR('quantite_casse', e.target.value)} className={inputStyle} />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: '#A32D2D' }}>Volés</label>
                <input type="number" min="0" value={retourForm.quantite_vole} onChange={e => setR('quantite_vole', e.target.value)} className={inputStyle} />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: '#534AB7' }}>Perdus</label>
                <input type="number" min="0" value={retourForm.quantite_perdu} onChange={e => setR('quantite_perdu', e.target.value)} className={inputStyle} />
              </div>
            </div>

            {/* Calcul automatique */}
            <div style={{ background: '#E1F5EE', borderRadius: 10, padding: '8px 12px', marginBottom: 12 }}>
              <p style={{ fontSize: 11, color: '#085041' }}>
                Quantité retournée calculée : <strong>
                  {Math.max(0, (retourItem.quantite_depart || retourItem.quantite || 0) - (parseInt(retourForm.quantite_vole) || 0) - (parseInt(retourForm.quantite_perdu) || 0))}
                </strong> unité(s)
                {(parseInt(retourForm.quantite_casse) || 0) > 0 && <span style={{ color: '#854F0B' }}> dont {retourForm.quantite_casse} cassé(s)</span>}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1">Observation</label>
              <textarea value={retourForm.incident} onChange={e => setR('incident', e.target.value)}
                placeholder="Ex : 1 micro tombé en panne le 25 août..."
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
              <label className="block text-xs text-gray-500 mb-1">Type d'incident</label>
              <div className="grid grid-cols-3 gap-2">
                {[{ key: 'cassé', color: '#854F0B', bg: '#FAEEDA' }, { key: 'volé', color: '#A32D2D', bg: '#FCEBEB' }, { key: 'perdu', color: '#534AB7', bg: '#EEEDFE' }].map(t => (
                  <button key={t.key} onClick={() => setI('type', t.key)}
                    style={{ padding: '8px', borderRadius: 10, border: `0.5px solid ${incidentForm.type === t.key ? t.color : '#e5e5e0'}`, background: incidentForm.type === t.key ? t.bg : '#fff', color: t.color, fontSize: 12, fontWeight: incidentForm.type === t.key ? 600 : 400, cursor: 'pointer', textTransform: 'capitalize' }}>
                    {t.key}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-3">
              <label className="block text-xs text-gray-500 mb-1">Quantité concernée</label>
              <input type="number" min="1" value={incidentForm.quantite} onChange={e => setI('quantite', e.target.value)} className={inputStyle} />
            </div>
            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1">Description</label>
              <textarea value={incidentForm.detail} onChange={e => setI('detail', e.target.value)}
                placeholder="Ex : Tombé lors du transport..." rows={3} className={inputStyle + " resize-none"} />
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
