import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/admin/AdminLayout'

const VERT = '#1B3B2B'
const VERT_CLAIR = '#E8F5E8'

const CATEGORIES = ['Son & Musique', 'Éclairage', 'Transport', 'Cuisine', 'Sport & Loisirs', 'Bureau & Admin', 'Médical', 'Autre']
const ETATS = ['Bon', 'Moyen', 'Mauvais']
const STATUTS = ['En stock', 'Transporté', 'Sur place', 'Retourné']

const STATUT_CONFIG = {
  'En stock':   { bg: '#DCFCE7', color: '#166534', dot: '#166534' },
  'Transporté': { bg: '#DBEAFE', color: '#1E40AF', dot: '#1E40AF' },
  'Sur place':  { bg: '#FEF9C3', color: '#854D0E', dot: '#854D0E' },
  'Retourné':   { bg: '#F1F5F9', color: '#475569', dot: '#94A3B8' },
}

const EMPTY_FORM = { nom: '', categorie: 'Autre', proprietaire: '', responsable: '', quantite_depart: 1, etat_depart: 'Bon', date_depart: '', date_retour: '' }
const EMPTY_RETOUR = { etat_retour: 'Bon', quantite_casse: 0, quantite_vole: 0, quantite_perdu: 0, incident: '' }

function exportExcel(materiel, responsableGeneral) {
  const now = new Date().toLocaleDateString('fr-FR')
  const lignes = [
    ['BILAN LOGISTIQUE — CAMP-NAVS 2026'], [`Responsable : ${responsableGeneral || '-'}`], [`Exporté le ${now}`], [],
    ['Équipement', 'Catégorie', 'Responsable', 'Qté départ', 'État départ', 'Qté retour', 'Cassé', 'Volé', 'Perdu', 'Manquant'],
    ...materiel.map(m => { const qd = m.quantite_depart || m.quantite || 0; const qr = qd - (m.quantite_vole || 0) - (m.quantite_perdu || 0); return [m.nom, m.categorie || '', m.responsable || '', qd, m.etat_depart || 'Bon', m.checkout ? qr : '-', m.quantite_casse || 0, m.quantite_vole || 0, m.quantite_perdu || 0, (m.quantite_vole || 0) + (m.quantite_perdu || 0)] })
  ]
  const csv = '\uFEFF' + lignes.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = `Logistique_CampNavs2026_${now.replace(/\//g, '-')}.csv`; a.click()
  URL.revokeObjectURL(url)
}

function exportPDF(materiel, responsableGeneral) {
  const now = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const totalDepart = materiel.reduce((s, m) => s + (m.quantite_depart || m.quantite || 0), 0)
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Bilan Logistique</title>
<style>body{font-family:Arial,sans-serif;font-size:11px;padding:20px}h1{font-size:16px;color:#1B3B2B}table{width:100%;border-collapse:collapse}th{background:#1B3B2B;color:#fff;padding:5px 7px;font-size:9px}td{padding:5px 7px;border-bottom:0.5px solid #e5e5e0;font-size:9px}</style>
</head><body><h1>Bilan Logistique — Camp-Navs 2026</h1><p style="color:#666;font-size:10px">Responsable : ${responsableGeneral || '-'} · ${now} · ${totalDepart} unités au départ</p>
<table><tr><th>Équipement</th><th>Catégorie</th><th>Responsable</th><th>Qté départ</th><th>Retourné</th><th>Manquant</th></tr>
${materiel.map(m => { const qd = m.quantite_depart || m.quantite || 0; const qr = qd - (m.quantite_vole || 0) - (m.quantite_perdu || 0); const mq = (m.quantite_vole || 0) + (m.quantite_perdu || 0); return `<tr><td><b>${m.nom}</b></td><td>${m.categorie || ''}</td><td>${m.responsable || '-'}</td><td>${qd}</td><td>${m.checkout ? qr : '-'}</td><td style="color:${mq > 0 ? '#DC2626' : '#065F46'}">${mq > 0 ? mq : '✓'}</td></tr>` }).join('')}
</table></body></html>`
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank')
  if (win) setTimeout(() => win.print(), 800)
  URL.revokeObjectURL(url)
}

const inputStyle = { width: '100%', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', background: '#fff', color: '#1E293B' }
const labelStyle = { display: 'block', fontSize: 11, color: '#64748B', marginBottom: 4, fontWeight: 500 }

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
    function handleClick(e) { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOuvert(null) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function fetchData() {
    const [{ data: m }, { data: cfg }] = await Promise.all([
      supabase.from('materiel_logistique').select('*').order('nom'),
      supabase.from('config_logistique').select('*').limit(1),
    ])
    setMateriel(m || [])
    if (cfg && cfg.length > 0) { setResponsableGeneral(cfg[0].responsable_general || ''); setResponsableForm(cfg[0].responsable_general || ''); setConfigId(cfg[0].id) }
    setLoading(false)
  }

  function setF(k, v) { setForm(f => ({ ...f, [k]: v })) }
  function setR(k, v) { setRetourForm(f => ({ ...f, [k]: v })) }
  function setI(k, v) { setIncidentForm(f => ({ ...f, [k]: v })) }

  async function handleSave() {
    if (!form.nom) return
    setSaving(true)
    const payload = { nom: form.nom, categorie: form.categorie, proprietaire: form.proprietaire, responsable: form.responsable, quantite: parseInt(form.quantite_depart) || 1, quantite_depart: parseInt(form.quantite_depart) || 1, etat_depart: form.etat_depart, statut: 'En stock', date_depart: form.date_depart || null, date_retour: form.date_retour || null }
    if (editId) await supabase.from('materiel_logistique').update(payload).eq('id', editId)
    else await supabase.from('materiel_logistique').insert([{ ...payload, checkin: false, checkout: false }])
    setSaving(false); setShowForm(false); setEditId(null); setForm(EMPTY_FORM); fetchData()
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
    const qr = qd - (parseInt(retourForm.quantite_vole) || 0) - (parseInt(retourForm.quantite_perdu) || 0)
    await supabase.from('materiel_logistique').update({ quantite_retour: qr, etat_retour: retourForm.etat_retour, quantite_casse: parseInt(retourForm.quantite_casse) || 0, quantite_vole: parseInt(retourForm.quantite_vole) || 0, quantite_perdu: parseInt(retourForm.quantite_perdu) || 0, incident: retourForm.incident, statut: 'Retourné', checkout: true, date_retour: new Date().toISOString().split('T')[0] }).eq('id', retourItem.id)
    setSaving(false); setShowRetour(false); setRetourItem(null); fetchData()
  }

  async function handleSignalerIncident() {
    if (!incidentItem) return
    setSaving(true)
    const updates = {}
    const qte = parseInt(incidentForm.quantite) || 1
    if (incidentForm.type === 'cassé') updates.quantite_casse = (incidentItem.quantite_casse || 0) + qte
    if (incidentForm.type === 'volé') updates.quantite_vole = (incidentItem.quantite_vole || 0) + qte
    if (incidentForm.type === 'perdu') updates.quantite_perdu = (incidentItem.quantite_perdu || 0) + qte
    updates.incident = (incidentItem.incident ? incidentItem.incident + '\n' : '') + `[${incidentForm.type.toUpperCase()}] x${qte} — ${incidentForm.detail}`
    await supabase.from('materiel_logistique').update(updates).eq('id', incidentItem.id)
    setSaving(false); setShowIncident(false); setIncidentItem(null); setIncidentForm({ type: 'cassé', quantite: 1, detail: '' }); fetchData()
  }

  async function supprimerMateriel(id) { if (!window.confirm('Supprimer ?')) return; await supabase.from('materiel_logistique').delete().eq('id', id); setMenuOuvert(null); fetchData() }

  function openRetour(m) { setRetourItem(m); setRetourForm({ etat_retour: m.etat_retour || 'Bon', quantite_casse: m.quantite_casse || 0, quantite_vole: m.quantite_vole || 0, quantite_perdu: m.quantite_perdu || 0, incident: m.incident || '' }); setShowRetour(true); setMenuOuvert(null) }
  function openEdit(m) { setForm({ nom: m.nom, categorie: m.categorie || 'Autre', proprietaire: m.proprietaire || '', responsable: m.responsable || '', quantite_depart: m.quantite_depart || m.quantite || 1, etat_depart: m.etat_depart || 'Bon', date_depart: m.date_depart || '', date_retour: m.date_retour || '' }); setEditId(m.id); setShowForm(true); setMenuOuvert(null) }

  const totalEquip = materiel.length
  const totalDepart = materiel.reduce((s, m) => s + (m.quantite_depart || m.quantite || 0), 0)
  const totalVole = materiel.reduce((s, m) => s + (m.quantite_vole || 0), 0)
  const totalPerdu = materiel.reduce((s, m) => s + (m.quantite_perdu || 0), 0)
  const totalCasse = materiel.reduce((s, m) => s + (m.quantite_casse || 0), 0)
  const nonRetournes = materiel.filter(m => !m.checkout).length
  const avecIncidents = materiel.filter(m => (m.quantite_casse || 0) + (m.quantite_vole || 0) + (m.quantite_perdu || 0) > 0)
  const filtres = materiel.filter(m => filtreCategorie === 'toutes' || m.categorie === filtreCategorie).filter(m => m.nom.toLowerCase().includes(recherche.toLowerCase()) || (m.responsable && m.responsable.toLowerCase().includes(recherche.toLowerCase())))

  const chipStyle = (active) => ({ flexShrink: 0, padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 500, cursor: 'pointer', border: `1px solid ${active ? VERT : '#E2E8F0'}`, background: active ? VERT : '#fff', color: active ? '#fff' : '#64748B' })

  return (
    <AdminLayout>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1E293B', margin: 0 }}>Logistique</h1>
          <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 0' }}>{totalEquip} équipement(s) · {totalDepart} unité(s)</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button type="button" onClick={() => exportPDF(materiel, responsableGeneral)}
            style={{ width: 30, height: 30, borderRadius: 8, background: '#FEF2F2', border: '1px solid #FCA5A5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#DC2626" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          </button>
          <button type="button" onClick={() => exportExcel(materiel, responsableGeneral)}
            style={{ width: 30, height: 30, borderRadius: 8, background: VERT_CLAIR, border: `1px solid ${VERT}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke={VERT} strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          </button>
          <button type="button" onClick={() => { showForm && !editId ? setShowForm(false) : (setShowForm(true), setEditId(null), setForm(EMPTY_FORM)) }}
            style={{ width: 32, height: 32, borderRadius: '50%', background: showForm && !editId ? '#FEF2F2' : VERT, color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 300 }}>
            {showForm && !editId ? '×' : '+'}
          </button>
        </div>
      </div>

      {/* Responsable général */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: '10px 14px', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', margin: '0 0 3px' }}>RESPONSABLE GÉNÉRAL</p>
            {editResponsable ? (
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <input type="text" value={responsableForm} onChange={e => setResponsableForm(e.target.value)} placeholder="Nom du responsable"
                  style={{ ...inputStyle, padding: '6px 10px' }} />
                <button type="button" onClick={saveResponsable} style={{ background: VERT, color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, cursor: 'pointer' }}>
                  {saving ? '...' : 'OK'}
                </button>
              </div>
            ) : (
              <p style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', margin: 0 }}>
                {responsableGeneral || <span style={{ color: '#94A3B8', fontWeight: 400, fontSize: 12 }}>Non défini</span>}
              </p>
            )}
          </div>
          {!editResponsable && (
            <button type="button" onClick={() => { setEditResponsable(true); setResponsableForm(responsableGeneral) }}
              style={{ fontSize: 11, color: VERT, background: VERT_CLAIR, border: 'none', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontWeight: 600, flexShrink: 0 }}>
              Modifier
            </button>
          )}
        </div>
      </div>

      {/* KPI compact */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginBottom: 12 }}>
        {[
          { val: totalDepart, label: 'Départ', bg: '#ECFDF5', color: '#065F46', border: '#6EE7B7' },
          { val: nonRetournes, label: 'En cours', bg: nonRetournes > 0 ? '#FFFBEB' : '#F8FAFC', color: nonRetournes > 0 ? '#92400E' : '#94A3B8', border: nonRetournes > 0 ? '#FCD34D' : '#E2E8F0' },
          { val: totalCasse, label: 'Cassés', bg: totalCasse > 0 ? '#FFFBEB' : '#F8FAFC', color: totalCasse > 0 ? '#92400E' : '#94A3B8', border: totalCasse > 0 ? '#FCD34D' : '#E2E8F0' },
          { val: totalVole + totalPerdu, label: 'Manquants', bg: (totalVole + totalPerdu) > 0 ? '#FEF2F2' : '#F8FAFC', color: (totalVole + totalPerdu) > 0 ? '#991B1B' : '#94A3B8', border: (totalVole + totalPerdu) > 0 ? '#FCA5A5' : '#E2E8F0' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 10, border: `1px solid ${s.border}`, padding: '8px 6px', textAlign: 'center' }}>
            <p style={{ fontSize: 20, fontWeight: 700, color: s.color, margin: '0 0 2px', lineHeight: 1 }}>{s.val}</p>
            <p style={{ fontSize: 9, color: '#94A3B8', margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {[{ key: 'inventaire', label: 'Inventaire' }, { key: 'incidents', label: `Incidents${avecIncidents.length > 0 ? ` (${avecIncidents.length})` : ''}` }, { key: 'bilan', label: 'Bilan retour' }].map(o => (
          <button key={o.key} type="button" onClick={() => setOnglet(o.key)} style={chipStyle(onglet === o.key)}>{o.label}</button>
        ))}
      </div>

      {/* Formulaire */}
      {showForm && (
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: '14px', marginBottom: 12 }}>
          <div style={{ marginBottom: 8 }}><label style={labelStyle}>Nom *</label><input type="text" value={form.nom} onChange={e => setF('nom', e.target.value)} placeholder="Ex : Micro sans fil, Baffle..." style={inputStyle} /></div>
          <div style={{ marginBottom: 8 }}><label style={labelStyle}>Catégorie</label><select value={form.categorie} onChange={e => setF('categorie', e.target.value)} style={inputStyle}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <div><label style={labelStyle}>Quantité</label><input type="number" min="1" value={form.quantite_depart} onChange={e => setF('quantite_depart', e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>État départ</label><select value={form.etat_depart} onChange={e => setF('etat_depart', e.target.value)} style={inputStyle}>{ETATS.map(e => <option key={e}>{e}</option>)}</select></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <div><label style={labelStyle}>Propriétaire</label><input type="text" value={form.proprietaire} onChange={e => setF('proprietaire', e.target.value)} placeholder="Ex : Navigateurs CI" style={inputStyle} /></div>
            <div><label style={labelStyle}>Responsable</label><input type="text" value={form.responsable} onChange={e => setF('responsable', e.target.value)} placeholder="Ex : AKRE ALPHONSE" style={inputStyle} /></div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => { setShowForm(false); setEditId(null) }} style={{ flex: 1, background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 10, padding: '10px', fontSize: 13, cursor: 'pointer' }}>Annuler</button>
            <button type="button" onClick={handleSave} disabled={saving || !form.nom} style={{ flex: 1, background: VERT, color: '#fff', border: 'none', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving || !form.nom ? 0.7 : 1 }}>{saving ? '...' : editId ? 'Modifier' : 'Ajouter'}</button>
          </div>
        </div>
      )}

      {/* Filtres inventaire */}
      {onglet === 'inventaire' && (
        <>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {['toutes', ...CATEGORIES].map(c => (
              <button key={c} type="button" onClick={() => setFiltreCategorie(c)} style={chipStyle(filtreCategorie === c)}>{c === 'toutes' ? 'Toutes' : c}</button>
            ))}
          </div>
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="#94A3B8" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input type="text" value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Rechercher un équipement..."
              style={{ ...inputStyle, paddingLeft: 34 }} />
          </div>
        </>
      )}

      {loading && <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '16px 0' }}>Chargement...</p>}

      {/* ── INVENTAIRE ── */}
      {onglet === 'inventaire' && (
        <div ref={menuRef} style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          {filtres.length === 0 && !loading && <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '20px', margin: 0 }}>Aucun équipement.</p>}
          {filtres.map((m, i) => {
            const sc = STATUT_CONFIG[m.statut] || STATUT_CONFIG['En stock']
            const aIncident = (m.quantite_casse || 0) + (m.quantite_vole || 0) + (m.quantite_perdu || 0) > 0
            const qd = m.quantite_depart || m.quantite || 0
            const qr = qd - (m.quantite_vole || 0) - (m.quantite_perdu || 0)
            return (
              <div key={m.id} style={{ padding: '10px 14px', borderBottom: i < filtres.length - 1 ? '1px solid #F1F5F9' : 'none', borderLeft: aIncident ? '3px solid #FCA5A5' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Nom + badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', margin: 0 }}>{m.nom}</p>
                      <span style={{ fontSize: 9, fontWeight: 600, background: sc.bg, color: sc.color, borderRadius: 20, padding: '2px 7px' }}>{m.statut}</span>
                      {m.categorie && <span style={{ fontSize: 9, background: '#F1F5F9', color: '#64748B', borderRadius: 20, padding: '2px 7px' }}>{m.categorie}</span>}
                      {aIncident && <span style={{ fontSize: 9, fontWeight: 700, background: '#FEF2F2', color: '#DC2626', borderRadius: 20, padding: '2px 7px' }}>Incident</span>}
                    </div>
                    {/* Infos ligne */}
                    <p style={{ fontSize: 11, color: '#94A3B8', margin: '0 0 4px' }}>
                      Qté : {qd}{m.checkout ? ` · Retourné : ${qr}` : ''}{m.responsable ? ` · ${m.responsable}` : ''}
                    </p>
                    {/* Retour details */}
                    {m.checkout && aIncident && (
                      <p style={{ fontSize: 11, color: '#DC2626', margin: '0 0 4px' }}>
                        {(m.quantite_casse || 0) > 0 ? `Cassé : ${m.quantite_casse} ` : ''}{(m.quantite_vole || 0) > 0 ? `Volé : ${m.quantite_vole} ` : ''}{(m.quantite_perdu || 0) > 0 ? `Perdu : ${m.quantite_perdu}` : ''}
                      </p>
                    )}
                    {/* Boutons actions */}
                    {!m.checkout && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                        <button type="button" onClick={() => { setIncidentItem(m); setIncidentForm({ type: 'cassé', quantite: 1, detail: '' }); setShowIncident(true) }}
                          style={{ fontSize: 10, padding: '4px 8px', borderRadius: 6, border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', fontWeight: 500 }}>
                          Incident
                        </button>
                        <button type="button" onClick={() => openRetour(m)}
                          style={{ fontSize: 10, padding: '4px 8px', borderRadius: 6, border: `1px solid ${VERT}`, background: VERT_CLAIR, color: VERT, cursor: 'pointer', fontWeight: 500 }}>
                          Retour
                        </button>
                      </div>
                    )}
                    {m.checkout && <span style={{ fontSize: 10, fontWeight: 600, background: VERT_CLAIR, color: VERT, borderRadius: 20, padding: '2px 8px', marginTop: 4, display: 'inline-block' }}>✓ Retourné</span>}
                  </div>
                  {/* Menu ... */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <button type="button" onClick={() => setMenuOuvert(menuOuvert === m.id ? null : m.id)}
                      style={{ width: 26, height: 26, borderRadius: 7, background: '#F8FAFC', border: '1px solid #E2E8F0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#94A3B8' }}>···</button>
                    {menuOuvert === m.id && (
                      <div style={{ position: 'absolute', right: 0, top: 30, background: '#fff', borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', zIndex: 20, minWidth: 130, overflow: 'hidden' }}>
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
      )}

      {/* ── INCIDENTS ── */}
      {onglet === 'incidents' && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          {avecIncidents.length === 0 && <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '20px', margin: 0 }}>Aucun incident signalé.</p>}
          {avecIncidents.map((m, i) => (
            <div key={m.id} style={{ padding: '10px 14px', borderBottom: i < avecIncidents.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', margin: '0 0 6px' }}>{m.nom}</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: m.incident ? 6 : 0 }}>
                {(m.quantite_casse || 0) > 0 && <span style={{ fontSize: 11, background: '#FFFBEB', color: '#92400E', borderRadius: 20, padding: '2px 10px', fontWeight: 600 }}>Cassé : {m.quantite_casse}</span>}
                {(m.quantite_vole || 0) > 0 && <span style={{ fontSize: 11, background: '#FEF2F2', color: '#991B1B', borderRadius: 20, padding: '2px 10px', fontWeight: 600 }}>Volé : {m.quantite_vole}</span>}
                {(m.quantite_perdu || 0) > 0 && <span style={{ fontSize: 11, background: '#F5F3FF', color: '#6D28D9', borderRadius: 20, padding: '2px 10px', fontWeight: 600 }}>Perdu : {m.quantite_perdu}</span>}
              </div>
              {m.incident && <p style={{ fontSize: 11, color: '#64748B', margin: 0, lineHeight: 1.5, whiteSpace: 'pre-line' }}>{m.incident}</p>}
            </div>
          ))}
        </div>
      )}

      {/* ── BILAN ── */}
      {onglet === 'bilan' && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          {materiel.map((m, i) => {
            const qd = m.quantite_depart || m.quantite || 0
            const qr = qd - (m.quantite_vole || 0) - (m.quantite_perdu || 0)
            const manquant = (m.quantite_vole || 0) + (m.quantite_perdu || 0)
            const casse = m.quantite_casse || 0
            return (
              <div key={m.id} style={{ padding: '10px 14px', borderBottom: i < materiel.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', margin: '0 0 8px' }}>{m.nom}</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginBottom: m.checkout ? 0 : 8 }}>
                  {[
                    { val: qd, label: 'Parti', color: '#065F46', bg: '#ECFDF5', border: '#6EE7B7' },
                    { val: m.checkout ? qr : '-', label: 'Retour', color: m.checkout ? '#1D4ED8' : '#94A3B8', bg: m.checkout ? '#EFF6FF' : '#F8FAFC', border: m.checkout ? '#93C5FD' : '#E2E8F0' },
                    { val: casse, label: 'Cassés', color: casse > 0 ? '#92400E' : '#94A3B8', bg: casse > 0 ? '#FFFBEB' : '#F8FAFC', border: casse > 0 ? '#FCD34D' : '#E2E8F0' },
                    { val: manquant, label: 'Manquant', color: manquant > 0 ? '#991B1B' : '#065F46', bg: manquant > 0 ? '#FEF2F2' : '#ECFDF5', border: manquant > 0 ? '#FCA5A5' : '#6EE7B7' },
                  ].map(s => (
                    <div key={s.label} style={{ textAlign: 'center', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 8, padding: '6px 4px' }}>
                      <p style={{ fontSize: 16, fontWeight: 700, color: s.color, margin: '0 0 2px', lineHeight: 1 }}>{s.val}</p>
                      <p style={{ fontSize: 8, color: s.color, margin: 0, opacity: 0.7 }}>{s.label}</p>
                    </div>
                  ))}
                </div>
                {!m.checkout && (
                  <button type="button" onClick={() => openRetour(m)} style={{ width: '100%', fontSize: 11, padding: '7px', borderRadius: 8, border: `1px solid ${VERT}`, background: VERT_CLAIR, color: VERT, cursor: 'pointer', fontWeight: 600 }}>
                    Enregistrer le retour
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── MODAL RETOUR ── */}
      {showRetour && retourItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setShowRetour(false)}>
          <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 480, padding: '16px 16px 28px' }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 36, height: 3, background: '#E2E8F0', borderRadius: 2, margin: '0 auto 16px' }} />
            <p style={{ fontSize: 15, fontWeight: 700, color: '#1E293B', margin: '0 0 3px' }}>Retour — {retourItem.nom}</p>
            <p style={{ fontSize: 11, color: '#94A3B8', margin: '0 0 14px' }}>Parti : {retourItem.quantite_depart || retourItem.quantite || 0} unité(s)</p>
            <div style={{ marginBottom: 10 }}><label style={labelStyle}>État au retour</label><select value={retourForm.etat_retour} onChange={e => setR('etat_retour', e.target.value)} style={inputStyle}>{ETATS.map(e => <option key={e}>{e}</option>)}</select></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
              <div><label style={{ ...labelStyle, color: '#92400E' }}>Cassés</label><input type="number" min="0" value={retourForm.quantite_casse} onChange={e => setR('quantite_casse', e.target.value)} style={inputStyle} /></div>
              <div><label style={{ ...labelStyle, color: '#991B1B' }}>Volés</label><input type="number" min="0" value={retourForm.quantite_vole} onChange={e => setR('quantite_vole', e.target.value)} style={inputStyle} /></div>
              <div><label style={{ ...labelStyle, color: '#6D28D9' }}>Perdus</label><input type="number" min="0" value={retourForm.quantite_perdu} onChange={e => setR('quantite_perdu', e.target.value)} style={inputStyle} /></div>
            </div>
            <div style={{ background: VERT_CLAIR, borderRadius: 8, padding: '8px 12px', marginBottom: 10 }}>
              <p style={{ fontSize: 11, color: VERT, margin: 0 }}>Quantité retournée : <strong>{Math.max(0, (retourItem.quantite_depart || retourItem.quantite || 0) - (parseInt(retourForm.quantite_vole) || 0) - (parseInt(retourForm.quantite_perdu) || 0))}</strong></p>
            </div>
            <div style={{ marginBottom: 14 }}><label style={labelStyle}>Observation</label><textarea value={retourForm.incident} onChange={e => setR('incident', e.target.value)} placeholder="Détails..." rows={2} style={{ ...inputStyle, resize: 'none' }} /></div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setShowRetour(false)} style={{ flex: 1, background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 10, padding: '11px', fontSize: 13, cursor: 'pointer' }}>Annuler</button>
              <button type="button" onClick={handleRetour} disabled={saving} style={{ flex: 1, background: VERT, color: '#fff', border: 'none', borderRadius: 10, padding: '11px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? '...' : 'Confirmer'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL INCIDENT ── */}
      {showIncident && incidentItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setShowIncident(false)}>
          <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 480, padding: '16px 16px 28px' }} onClick={e => e.stopPropagation()}>
            <div style={{ width: 36, height: 3, background: '#E2E8F0', borderRadius: 2, margin: '0 auto 16px' }} />
            <p style={{ fontSize: 15, fontWeight: 700, color: '#1E293B', margin: '0 0 14px' }}>Incident — {incidentItem.nom}</p>
            <div style={{ marginBottom: 10 }}>
              <label style={labelStyle}>Type</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[{ key: 'cassé', color: '#92400E', bg: '#FFFBEB', border: '#FCD34D' }, { key: 'volé', color: '#991B1B', bg: '#FEF2F2', border: '#FCA5A5' }, { key: 'perdu', color: '#6D28D9', bg: '#F5F3FF', border: '#DDD6FE' }].map(t => (
                  <button key={t.key} type="button" onClick={() => setI('type', t.key)}
                    style={{ flex: 1, padding: '8px', borderRadius: 10, border: `1px solid ${incidentForm.type === t.key ? t.border : '#E2E8F0'}`, background: incidentForm.type === t.key ? t.bg : '#fff', color: t.color, fontSize: 12, fontWeight: incidentForm.type === t.key ? 700 : 400, cursor: 'pointer', textTransform: 'capitalize' }}>
                    {t.key}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 10 }}><label style={labelStyle}>Quantité</label><input type="number" min="1" value={incidentForm.quantite} onChange={e => setI('quantite', e.target.value)} style={inputStyle} /></div>
            <div style={{ marginBottom: 14 }}><label style={labelStyle}>Description</label><textarea value={incidentForm.detail} onChange={e => setI('detail', e.target.value)} placeholder="Ex : Tombé lors du transport..." rows={2} style={{ ...inputStyle, resize: 'none' }} /></div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setShowIncident(false)} style={{ flex: 1, background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 10, padding: '11px', fontSize: 13, cursor: 'pointer' }}>Annuler</button>
              <button type="button" onClick={handleSignalerIncident} disabled={saving} style={{ flex: 1, background: '#DC2626', color: '#fff', border: 'none', borderRadius: 10, padding: '11px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? '...' : 'Signaler'}</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
