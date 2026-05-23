import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/admin/AdminLayout'

const TYPES_RECETTE = [
  { key: 'frais_participation', label: 'Frais de participation', color: '#085041', bg: '#E1F5EE' },
  { key: 'don_financier', label: 'Don financier', color: '#185FA5', bg: '#E6F1FB' },
  { key: 'don_nature', label: 'Don en nature', color: '#534AB7', bg: '#EEEDFE' },
  { key: 'subvention', label: 'Subvention ministère', color: '#854F0B', bg: '#FAEEDA' },
  { key: 'autre', label: 'Autre', color: '#5F5E5A', bg: '#F1EFE8' },
]

function getTypeRecette(key) {
  return TYPES_RECETTE.find(t => t.key === key) || TYPES_RECETTE[4]
}

function exportExcelTresorerie(recettes, commissions, depenses) {
  const now = new Date().toLocaleDateString('fr-FR')
  const totalRecettes = recettes.reduce((s, r) => s + (r.montant || r.valeur_estimee || 0), 0)
  const totalDepenses = depenses.reduce((s, d) => s + (d.montant || 0), 0)
  const solde = totalRecettes - totalDepenses

  const lignes = [
    ['RAPPORT FINANCIER — CAMP-NAVS 2026'],
    [`Exporté le ${now}`], [],
    ['=== RECETTES ==='],
    ['Type', 'Description', 'Donateur', 'Montant (FCFA)', 'Date'],
    ...recettes.map(r => [
      getTypeRecette(r.type).label, r.description || '', r.donateur || '',
      r.montant || r.valeur_estimee || 0,
      new Date(r.date_reception).toLocaleDateString('fr-FR'),
    ]),
    [], ['Total recettes', '', '', totalRecettes], [],
    ['=== COMMISSIONS & DÉPENSES ==='],
    ['Commission', 'Budget prévu', 'Montant alloué', 'Total dépensé', 'Solde restant'],
    ...commissions.map(c => {
      const totalDep = depenses.filter(d => d.commission_id === c.id).reduce((s, d) => s + d.montant, 0)
      return [c.nom_commission, c.budget_previsionnel || 0, c.montant_alloue || 0, totalDep, (c.montant_alloue || 0) - totalDep]
    }),
    [], [],
    ['=== DÉTAIL DES DÉPENSES ==='],
    ['Commission', 'Description', 'Montant (FCFA)', 'Date'],
    ...depenses.map(d => [d.nom_commission, d.description, d.montant, new Date(d.date_depense).toLocaleDateString('fr-FR')]),
    [], [],
    ['=== RÉSUMÉ ==='],
    ['Total recettes', `${totalRecettes.toLocaleString()} FCFA`],
    ['Total dépenses', `${totalDepenses.toLocaleString()} FCFA`],
    ['Solde disponible', `${solde.toLocaleString()} FCFA`],
  ]

  const csv = '\uFEFF' + lignes.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Tresorerie_CampNavs2026_${now.replace(/\//g, '-')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function exportPDFTresorerie(recettes, commissions, depenses) {
  const now = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const totalRecettes = recettes.reduce((s, r) => s + (r.montant || r.valeur_estimee || 0), 0)
  const totalDepenses = depenses.reduce((s, d) => s + (d.montant || 0), 0)
  const solde = totalRecettes - totalDepenses

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<title>Rapport Trésorerie — Camp-Navs 2026</title>
<style>
  body{font-family:Arial,sans-serif;font-size:12px;color:#1a1a1a;margin:30px}
  h1{font-size:20px;color:#085041;margin-bottom:4px}
  h2{font-size:14px;color:#085041;margin:24px 0 10px;border-bottom:2px solid #085041;padding-bottom:4px}
  .subtitle{font-size:12px;color:#666;margin-bottom:20px}
  .resume{display:flex;gap:16px;margin-bottom:20px;flex-wrap:wrap}
  .stat{background:#E1F5EE;border-radius:8px;padding:10px 14px;min-width:130px}
  .stat .num{font-size:18px;font-weight:bold;color:#085041}
  .stat .lbl{font-size:10px;color:#0F6E56}
  .stat.danger{background:#FCEBEB} .stat.danger .num{color:#A32D2D} .stat.danger .lbl{color:#993C1D}
  .stat.blue{background:#E6F1FB} .stat.blue .num{color:#185FA5} .stat.blue .lbl{color:#185FA5}
  .stat.warn{background:#FAEEDA} .stat.warn .num{color:#854F0B} .stat.warn .lbl{color:#854F0B}
  table{width:100%;border-collapse:collapse;margin-bottom:16px}
  th{background:#085041;color:#fff;padding:7px 10px;text-align:left;font-size:11px}
  td{padding:6px 10px;border-bottom:0.5px solid #e5e5e0;font-size:11px}
  tr:nth-child(even) td{background:#f8f8f6}
  .footer{margin-top:30px;font-size:10px;color:#888;text-align:center;border-top:0.5px solid #e5e5e0;padding-top:10px}
</style></head><body>
<h1>Rapport Trésorerie — Camp-Navs 2026</h1>
<p class="subtitle">La Sablière · Bingerville · 23–29 août 2026 · Généré le ${now}</p>
<div class="resume">
  <div class="stat blue"><div class="num">${totalRecettes.toLocaleString()} FCFA</div><div class="lbl">Total recettes</div></div>
  <div class="stat danger"><div class="num">${totalDepenses.toLocaleString()} FCFA</div><div class="lbl">Total dépenses</div></div>
  <div class="stat ${solde >= 0 ? '' : 'danger'}"><div class="num">${solde.toLocaleString()} FCFA</div><div class="lbl">Solde disponible</div></div>
</div>
<h2>Recettes</h2>
<table><tr><th>Type</th><th>Description</th><th>Donateur</th><th>Montant (FCFA)</th><th>Date</th></tr>
${recettes.map(r => `<tr><td>${getTypeRecette(r.type).label}</td><td>${r.description || '-'}</td><td>${r.donateur || '-'}</td><td><strong>${(r.montant || r.valeur_estimee || 0).toLocaleString()}</strong></td><td>${new Date(r.date_reception).toLocaleDateString('fr-FR')}</td></tr>`).join('')}
<tr><td colspan="3"><strong>TOTAL</strong></td><td><strong>${totalRecettes.toLocaleString()} FCFA</strong></td><td></td></tr></table>
<h2>Commissions & Affectations</h2>
<table><tr><th>Commission</th><th>Budget prévu</th><th>Montant alloué</th><th>Dépensé</th><th>Solde</th></tr>
${commissions.map(c => {
  const totalDep = depenses.filter(d => d.commission_id === c.id).reduce((s, d) => s + d.montant, 0)
  const soldeC = (c.montant_alloue || 0) - totalDep
  return `<tr><td><strong>${c.nom_commission}</strong></td><td>${(c.budget_previsionnel || 0).toLocaleString()}</td><td>${(c.montant_alloue || 0).toLocaleString()}</td><td>${totalDep.toLocaleString()}</td><td style="color:${soldeC < 0 ? '#A32D2D' : '#085041'}">${soldeC.toLocaleString()}</td></tr>`
}).join('')}</table>
<h2>Détail des dépenses</h2>
<table><tr><th>Commission</th><th>Description</th><th>Montant (FCFA)</th><th>Date</th></tr>
${depenses.map(d => `<tr><td>${d.nom_commission}</td><td>${d.description}</td><td>${d.montant.toLocaleString()}</td><td>${new Date(d.date_depense).toLocaleDateString('fr-FR')}</td></tr>`).join('')}
<tr><td colspan="2"><strong>TOTAL</strong></td><td><strong>${totalDepenses.toLocaleString()} FCFA</strong></td><td></td></tr></table>
<div class="footer">Camp-Navs 2026 · Mission Évangélique des Navigateurs — Côte d'Ivoire · ${now}</div>
</body></html>`

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank')
  if (win) setTimeout(() => win.print(), 800)
  URL.revokeObjectURL(url)
}

export default function TresoreriePage() {
  const [onglet, setOnglet] = useState('tableau_bord')
  const [recettes, setRecettes] = useState([])
  const [commissions, setCommissions] = useState([])
  const [depenses, setDepenses] = useState([])
  const [budgetGlobal, setBudgetGlobal] = useState(0)
  const [budgetGlobalId, setBudgetGlobalId] = useState(null)
  const [editBudget, setEditBudget] = useState(false)
  const [budgetForm, setBudgetForm] = useState('')
  const [loading, setLoading] = useState(true)

  // Forms
  const [showRecette, setShowRecette] = useState(false)
  const [showCommission, setShowCommission] = useState(false)
  const [showDepense, setShowDepense] = useState(false)
  const [showAllouer, setShowAllouer] = useState(null)

  const [recetteForm, setRecetteForm] = useState({ type: 'don_financier', description: '', montant: '', valeur_estimee: '', donateur: '', date_reception: new Date().toISOString().split('T')[0] })
  const [commissionForm, setCommissionForm] = useState({ nom_commission: '', budget_previsionnel: '' })
  const [depenseForm, setDepenseForm] = useState({ commission_id: '', description: '', montant: '', date_depense: new Date().toISOString().split('T')[0], justificatif: '' })
  const [allouerMontant, setAllouerMontant] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const [{ data: r }, { data: c }, { data: d }, { data: bg }] = await Promise.all([
      supabase.from('recettes').select('*').order('date_reception', { ascending: false }),
      supabase.from('budget_commissions').select('*').order('nom_commission'),
      supabase.from('depenses').select('*').order('date_depense', { ascending: false }),
      supabase.from('budget_global').select('*').limit(1),
    ])
    setRecettes(r || [])
    setCommissions(c || [])
    setDepenses(d || [])
    if (bg && bg.length > 0) {
      setBudgetGlobal(bg[0].montant || 0)
      setBudgetGlobalId(bg[0].id)
      setBudgetForm(bg[0].montant || 0)
    }
    setLoading(false)
  }

  async function saveBudgetGlobal() {
    setSaving(true)
    if (budgetGlobalId) {
      await supabase.from('budget_global').update({ montant: parseInt(budgetForm) || 0, updated_at: new Date().toISOString() }).eq('id', budgetGlobalId)
    } else {
      await supabase.from('budget_global').insert([{ montant: parseInt(budgetForm) || 0 }])
    }
    setSaving(false)
    setEditBudget(false)
    fetchData()
  }

  async function saveRecette() {
    if (!recetteForm.montant && !recetteForm.valeur_estimee) return
    setSaving(true)
    await supabase.from('recettes').insert([{
      type: recetteForm.type,
      description: recetteForm.description,
      montant: parseInt(recetteForm.montant) || 0,
      valeur_estimee: parseInt(recetteForm.valeur_estimee) || 0,
      donateur: recetteForm.donateur,
      date_reception: recetteForm.date_reception,
    }])
    setSaving(false)
    setShowRecette(false)
    setRecetteForm({ type: 'don_financier', description: '', montant: '', valeur_estimee: '', donateur: '', date_reception: new Date().toISOString().split('T')[0] })
    fetchData()
  }

  async function saveCommission() {
    if (!commissionForm.nom_commission) return
    setSaving(true)
    await supabase.from('budget_commissions').insert([{
      nom_commission: commissionForm.nom_commission,
      budget_previsionnel: parseInt(commissionForm.budget_previsionnel) || 0,
      montant_alloue: 0,
    }])
    setSaving(false)
    setShowCommission(false)
    setCommissionForm({ nom_commission: '', budget_previsionnel: '' })
    fetchData()
  }

  async function saveDepense() {
    if (!depenseForm.commission_id || !depenseForm.description || !depenseForm.montant) return
    setSaving(true)
    const comm = commissions.find(c => c.id === depenseForm.commission_id)
    await supabase.from('depenses').insert([{
      commission_id: depenseForm.commission_id,
      nom_commission: comm?.nom_commission || '',
      description: depenseForm.description,
      montant: parseInt(depenseForm.montant) || 0,
      date_depense: depenseForm.date_depense,
      justificatif: depenseForm.justificatif,
    }])
    setSaving(false)
    setShowDepense(false)
    setDepenseForm({ commission_id: '', description: '', montant: '', date_depense: new Date().toISOString().split('T')[0], justificatif: '' })
    fetchData()
  }

  async function saveAllouer(commissionId) {
    if (!allouerMontant) return
    setSaving(true)
    await supabase.from('budget_commissions').update({ montant_alloue: parseInt(allouerMontant) }).eq('id', commissionId)
    setSaving(false)
    setShowAllouer(null)
    setAllouerMontant('')
    fetchData()
  }

  async function supprimerRecette(id) {
    if (!window.confirm('Supprimer cette recette ?')) return
    await supabase.from('recettes').delete().eq('id', id)
    fetchData()
  }

  async function supprimerDepense(id) {
    if (!window.confirm('Supprimer cette dépense ?')) return
    await supabase.from('depenses').delete().eq('id', id)
    fetchData()
  }

  async function supprimerCommission(id) {
    if (!window.confirm('Supprimer cette commission ?')) return
    await supabase.from('budget_commissions').delete().eq('id', id)
    fetchData()
  }

  // Stats globales
  const totalRecettes = recettes.reduce((s, r) => s + (r.montant || r.valeur_estimee || 0), 0)
  const totalDepenses = depenses.reduce((s, d) => s + (d.montant || 0), 0)
  const soldeGlobal = totalRecettes - totalDepenses
  const totalAlloue = commissions.reduce((s, c) => s + (c.montant_alloue || 0), 0)
  const soldeNonAlloue = totalRecettes - totalAlloue

  const inputStyle = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400"
  const labelStyle = "block text-xs text-gray-500 mb-1"

  return (
    <AdminLayout>
      <div className="mb-5 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-medium text-gray-800">Trésorerie</h1>
          <p className="text-sm text-gray-400 mt-0.5">Camp-Navs 2026</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => exportPDFTresorerie(recettes, commissions, depenses)}
            style={{ background: 'transparent', color: '#6B7280', border: '0.5px solid #D1D5DB', borderRadius: 8, padding: '7px 12px', fontSize: 11, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg style={{ width: 13, height: 13 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            PDF
          </button>
          <button onClick={() => exportExcelTresorerie(recettes, commissions, depenses)}
            style={{ background: 'transparent', color: '#6B7280', border: '0.5px solid #D1D5DB', borderRadius: 8, padding: '7px 12px', fontSize: 11, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg style={{ width: 13, height: 13 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Excel
          </button>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {[
          { key: 'tableau_bord', label: 'Tableau de bord' },
          { key: 'recettes', label: 'Recettes' },
          { key: 'commissions', label: 'Commissions' },
          { key: 'depenses', label: 'Dépenses' },
        ].map(o => (
          <button key={o.key} onClick={() => setOnglet(o.key)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ border: `0.5px solid ${onglet === o.key ? '#085041' : '#e5e5e0'}`, background: onglet === o.key ? '#085041' : '#fff', color: onglet === o.key ? '#fff' : '#666' }}>
            {o.label}
          </button>
        ))}
      </div>

      {/* TABLEAU DE BORD */}
      {onglet === 'tableau_bord' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Budget global */}
          <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #F3F4F6', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.06em', margin: 0 }}>BUDGET GLOBAL</p>
              <button onClick={() => { setEditBudget(!editBudget); setBudgetForm(budgetGlobal) }}
                style={{ fontSize: 11, color: '#054035', background: 'transparent', border: '0.5px solid #054035', borderRadius: 6, padding: '3px 10px', cursor: 'pointer' }}>
                {editBudget ? 'Annuler' : 'Modifier'}
              </button>
            </div>
            {editBudget ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="number" value={budgetForm} onChange={e => setBudgetForm(e.target.value)}
                  placeholder="Montant FCFA"
                  style={{ flex: 1, border: '0.5px solid #D1D5DB', borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none' }} />
                <button onClick={saveBudgetGlobal} disabled={saving}
                  style={{ background: '#054035', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  {saving ? '...' : 'OK'}
                </button>
              </div>
            ) : (
              <>
                <p style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>
                  {budgetGlobal > 0 ? `${budgetGlobal.toLocaleString()} FCFA` : <span style={{ fontSize: 14, color: '#9CA3AF', fontWeight: 400 }}>Non défini</span>}
                </p>
                {budgetGlobal > 0 && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: totalRecettes >= budgetGlobal ? '#059669' : '#D97706' }}>
                        {Math.round((totalRecettes / budgetGlobal) * 100)}% collecté
                      </span>
                      <span style={{ fontSize: 11, color: '#6B7280' }}>
                        Reste : {Math.max(budgetGlobal - totalRecettes, 0).toLocaleString()} FCFA
                      </span>
                    </div>
                    <div style={{ background: '#F3F4F6', borderRadius: 8, height: 8 }}>
                      <div style={{
                        height: 8, borderRadius: 8,
                        width: `${Math.min((totalRecettes / budgetGlobal) * 100, 100)}%`,
                        background: totalRecettes >= budgetGlobal ? '#059669' : totalRecettes / budgetGlobal >= 0.6 ? '#0EA5E9' : '#F59E0B',
                        transition: 'width .4s ease',
                      }} />
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              {
                label: 'Recettes totales', val: totalRecettes,
                icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
                iconBg: '#ECFDF5', iconColor: '#059669', valColor: '#059669',
              },
              {
                label: 'Dépenses totales', val: totalDepenses,
                icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13 17H5m0 0v-8m0 8l8-8 4 4 6-6" /></svg>,
                iconBg: '#FEF2F2', iconColor: '#DC2626', valColor: '#DC2626',
              },
              {
                label: 'Solde disponible', val: soldeGlobal,
                icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
                iconBg: soldeGlobal >= 0 ? '#EFF6FF' : '#FEF2F2',
                iconColor: soldeGlobal >= 0 ? '#2563EB' : '#DC2626',
                valColor: soldeGlobal >= 0 ? '#2563EB' : '#DC2626',
              },
              {
                label: 'Non alloué', val: soldeNonAlloue,
                icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
                iconBg: '#FFFBEB', iconColor: '#D97706', valColor: '#D97706',
              },
            ].map(k => (
              <div key={k.label} style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #F3F4F6', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: '14px' }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: k.iconBg, color: k.iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                  {k.icon}
                </div>
                <p style={{ fontSize: 11, color: '#6B7280', margin: '0 0 4px', textAlign: 'left' }}>{k.label}</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: k.valColor, margin: 0, textAlign: 'left' }}>{k.val.toLocaleString()}</p>
                <p style={{ fontSize: 9, color: '#9CA3AF', margin: '2px 0 0' }}>FCFA</p>
              </div>
            ))}
          </div>

          {/* Recettes par source */}
          {recettes.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #F3F4F6', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: '14px 16px' }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.06em', marginBottom: 12 }}>RECETTES PAR SOURCE</p>
              {TYPES_RECETTE.map(t => {
                const montant = recettes.filter(r => r.type === t.key).reduce((s, r) => s + (r.montant || r.valeur_estimee || 0), 0)
                const pct = totalRecettes > 0 ? (montant / totalRecettes) * 100 : 0
                if (montant === 0) return null
                return (
                  <div key={t.key} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 12, color: '#374151' }}>{t.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{montant.toLocaleString()} FCFA</span>
                    </div>
                    <div style={{ background: '#F3F4F6', borderRadius: 8, height: 5 }}>
                      <div style={{ background: '#054035', borderRadius: 8, height: 5, width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Commissions avec jauges modernes */}
          {commissions.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #F3F4F6', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: '14px 16px' }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.06em', marginBottom: 12 }}>COMMISSIONS</p>
              {commissions.map((c, i) => {
                const totalDep = depenses.filter(d => d.commission_id === c.id).reduce((s, d) => s + d.montant, 0)
                const alloue = c.montant_alloue || 0
                const solde = alloue - totalDep
                const pct = alloue > 0 ? Math.min((totalDep / alloue) * 100, 100) : 0
                const enAlerte = solde < 0
                const couleurJauge = enAlerte ? '#EF4444' : pct > 80 ? '#F59E0B' : '#0EA5E9'
                return (
                  <div key={c.id} style={{ marginBottom: i < commissions.length - 1 ? 14 : 0, paddingBottom: i < commissions.length - 1 ? 14 : 0, borderBottom: i < commissions.length - 1 ? '0.5px solid #F9FAFB' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{c.nom_commission}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: enAlerte ? '#DC2626' : '#059669' }}>
                        {enAlerte ? '−' : '+'}{Math.abs(solde).toLocaleString()} FCFA
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 10, color: '#9CA3AF' }}>Alloué : {alloue.toLocaleString()}</span>
                      <span style={{ fontSize: 10, color: enAlerte ? '#DC2626' : '#6B7280' }}>Dépensé : {totalDep.toLocaleString()}</span>
                    </div>
                    <div style={{ background: '#F3F4F6', borderRadius: 8, height: 6 }}>
                      <div style={{ background: couleurJauge, borderRadius: 8, height: 6, width: `${pct}%`, transition: 'width .3s' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

        </div>
      )}

            {/* RECETTES */}
      {onglet === 'recettes' && (
        <>
          <button onClick={() => setShowRecette(!showRecette)}
            className="w-full mb-4 bg-emerald-700 text-white text-sm font-medium py-3 rounded-xl flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showRecette ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"} /></svg>
            {showRecette ? 'Fermer' : 'Ajouter une recette'}
          </button>

          {showRecette && (
            <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-5">
              <h2 className="text-sm font-medium text-gray-700 mb-4">Nouvelle recette</h2>
              <div className="mb-3">
                <label className={labelStyle}>Type de recette</label>
                <select value={recetteForm.type} onChange={e => setRecetteForm(f => ({ ...f, type: e.target.value }))} className={inputStyle}>
                  {TYPES_RECETTE.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                </select>
              </div>
              <div className="mb-3">
                <label className={labelStyle}>Description</label>
                <input type="text" value={recetteForm.description} onChange={e => setRecetteForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Ex : Don de l'église XYZ" className={inputStyle} />
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                {recetteForm.type === 'don_nature' ? (
                  <div>
                    <label className={labelStyle}>Valeur estimée (FCFA)</label>
                    <input type="number" value={recetteForm.valeur_estimee} onChange={e => setRecetteForm(f => ({ ...f, valeur_estimee: e.target.value }))} className={inputStyle} />
                  </div>
                ) : (
                  <div>
                    <label className={labelStyle}>Montant (FCFA)</label>
                    <input type="number" value={recetteForm.montant} onChange={e => setRecetteForm(f => ({ ...f, montant: e.target.value }))} className={inputStyle} />
                  </div>
                )}
                <div>
                  <label className={labelStyle}>Date</label>
                  <input type="date" value={recetteForm.date_reception} onChange={e => setRecetteForm(f => ({ ...f, date_reception: e.target.value }))} className={inputStyle} />
                </div>
              </div>
              <div className="mb-4">
                <label className={labelStyle}>Donateur / Source</label>
                <input type="text" value={recetteForm.donateur} onChange={e => setRecetteForm(f => ({ ...f, donateur: e.target.value }))}
                  placeholder="Ex : M. KOUASSI, Église Bethel..." className={inputStyle} />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowRecette(false)} className="flex-1 bg-gray-100 text-gray-600 text-sm font-medium py-3 rounded-xl">Annuler</button>
                <button onClick={saveRecette} disabled={saving} className="flex-1 bg-emerald-700 text-white text-sm font-medium py-3 rounded-xl disabled:opacity-60">
                  {saving ? 'Enregistrement...' : 'Ajouter'}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {recettes.map(r => {
              const t = getTypeRecette(r.type)
              return (
                <div key={r.id} style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #e5e5e0', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg style={{ width: 18, height: 18, color: t.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: 12, fontWeight: 500, color: '#1a1a1a' }}>{r.description || t.label}</p>
                    <p style={{ fontSize: 10, color: '#888' }}>{r.donateur ? `${r.donateur} · ` : ''}{new Date(r.date_reception).toLocaleDateString('fr-FR')}</p>
                    <p style={{ fontSize: 12, fontWeight: 600, color: t.color }}>{(r.montant || r.valeur_estimee || 0).toLocaleString()} FCFA</p>
                  </div>
                  <button onClick={() => supprimerRecette(r.id)} style={{ width: 30, height: 30, borderRadius: 8, background: '#FCEBEB', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg style={{ width: 13, height: 13, color: '#A32D2D' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* COMMISSIONS */}
      {onglet === 'commissions' && (
        <>
          <button onClick={() => setShowCommission(!showCommission)}
            className="w-full mb-4 bg-emerald-700 text-white text-sm font-medium py-3 rounded-xl flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showCommission ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"} /></svg>
            {showCommission ? 'Fermer' : 'Ajouter une commission'}
          </button>

          {showCommission && (
            <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-5">
              <h2 className="text-sm font-medium text-gray-700 mb-4">Nouvelle commission</h2>
              <div className="mb-3">
                <label className={labelStyle}>Nom de la commission *</label>
                <input type="text" value={commissionForm.nom_commission} onChange={e => setCommissionForm(f => ({ ...f, nom_commission: e.target.value }))}
                  placeholder="Ex : Logistique, Restauration, Santé..." className={inputStyle} />
              </div>
              <div className="mb-4">
                <label className={labelStyle}>Budget prévisionnel (FCFA)</label>
                <input type="number" value={commissionForm.budget_previsionnel} onChange={e => setCommissionForm(f => ({ ...f, budget_previsionnel: e.target.value }))} className={inputStyle} />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowCommission(false)} className="flex-1 bg-gray-100 text-gray-600 text-sm font-medium py-3 rounded-xl">Annuler</button>
                <button onClick={saveCommission} disabled={saving} className="flex-1 bg-emerald-700 text-white text-sm font-medium py-3 rounded-xl disabled:opacity-60">
                  {saving ? 'Enregistrement...' : 'Ajouter'}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {commissions.map(c => {
              const totalDep = depenses.filter(d => d.commission_id === c.id).reduce((s, d) => s + d.montant, 0)
              const alloue = c.montant_alloue || 0
              const solde = alloue - totalDep
              return (
                <div key={c.id} style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #e5e5e0', padding: '12px 14px' }}>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <p style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>{c.nom_commission}</p>
                    <button onClick={() => supprimerCommission(c.id)} style={{ width: 28, height: 28, borderRadius: 7, background: '#FCEBEB', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg style={{ width: 12, height: 12, color: '#A32D2D' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div style={{ textAlign: 'center', background: '#f8f8f6', borderRadius: 8, padding: '6px' }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: '#333' }}>{(c.budget_previsionnel || 0).toLocaleString()}</p>
                      <p style={{ fontSize: 9, color: '#888' }}>Prévu</p>
                    </div>
                    <div style={{ textAlign: 'center', background: '#E1F5EE', borderRadius: 8, padding: '6px' }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: '#085041' }}>{alloue.toLocaleString()}</p>
                      <p style={{ fontSize: 9, color: '#085041' }}>Alloué</p>
                    </div>
                    <div style={{ textAlign: 'center', background: solde < 0 ? '#FCEBEB' : '#E6F1FB', borderRadius: 8, padding: '6px' }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: solde < 0 ? '#A32D2D' : '#185FA5' }}>{solde.toLocaleString()}</p>
                      <p style={{ fontSize: 9, color: solde < 0 ? '#993C1D' : '#185FA5' }}>Solde</p>
                    </div>
                  </div>

                  {showAllouer === c.id ? (
                    <div className="flex gap-2">
                      <input type="number" value={allouerMontant} onChange={e => setAllouerMontant(e.target.value)}
                        placeholder="Montant à allouer (FCFA)"
                        style={{ flex: 1, border: '0.5px solid #e5e5e0', borderRadius: 10, padding: '7px 10px', fontSize: 12, outline: 'none' }} />
                      <button onClick={() => saveAllouer(c.id)}
                        style={{ background: '#085041', color: '#fff', border: 'none', borderRadius: 10, padding: '7px 12px', fontSize: 12, cursor: 'pointer' }}>OK</button>
                      <button onClick={() => setShowAllouer(null)}
                        style={{ background: '#f5f5f3', color: '#666', border: 'none', borderRadius: 10, padding: '7px 12px', fontSize: 12, cursor: 'pointer' }}>✕</button>
                    </div>
                  ) : (
                    <button onClick={() => { setShowAllouer(c.id); setAllouerMontant(alloue || '') }}
                      style={{ width: '100%', background: '#E1F5EE', color: '#085041', border: 'none', borderRadius: 10, padding: '8px', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                      Modifier le montant alloué
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* DÉPENSES */}
      {onglet === 'depenses' && (
        <>
          <button onClick={() => setShowDepense(!showDepense)}
            className="w-full mb-4 bg-emerald-700 text-white text-sm font-medium py-3 rounded-xl flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showDepense ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"} /></svg>
            {showDepense ? 'Fermer' : 'Ajouter une dépense'}
          </button>

          {showDepense && (
            <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-5">
              <h2 className="text-sm font-medium text-gray-700 mb-4">Nouvelle dépense</h2>
              <div className="mb-3">
                <label className={labelStyle}>Commission *</label>
                <select value={depenseForm.commission_id} onChange={e => setDepenseForm(f => ({ ...f, commission_id: e.target.value }))} className={inputStyle}>
                  <option value="">Sélectionner une commission</option>
                  {commissions.map(c => <option key={c.id} value={c.id}>{c.nom_commission}</option>)}
                </select>
              </div>
              <div className="mb-3">
                <label className={labelStyle}>Description *</label>
                <input type="text" value={depenseForm.description} onChange={e => setDepenseForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Ex : Achat vivres marché" className={inputStyle} />
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className={labelStyle}>Montant (FCFA) *</label>
                  <input type="number" value={depenseForm.montant} onChange={e => setDepenseForm(f => ({ ...f, montant: e.target.value }))} className={inputStyle} />
                </div>
                <div>
                  <label className={labelStyle}>Date</label>
                  <input type="date" value={depenseForm.date_depense} onChange={e => setDepenseForm(f => ({ ...f, date_depense: e.target.value }))} className={inputStyle} />
                </div>
              </div>
              <div className="mb-4">
                <label className={labelStyle}>Justificatif / Référence</label>
                <input type="text" value={depenseForm.justificatif} onChange={e => setDepenseForm(f => ({ ...f, justificatif: e.target.value }))}
                  placeholder="Ex : Reçu n°001, facture marché..." className={inputStyle} />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowDepense(false)} className="flex-1 bg-gray-100 text-gray-600 text-sm font-medium py-3 rounded-xl">Annuler</button>
                <button onClick={saveDepense} disabled={saving} className="flex-1 bg-emerald-700 text-white text-sm font-medium py-3 rounded-xl disabled:opacity-60">
                  {saving ? 'Enregistrement...' : 'Ajouter'}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {depenses.map(d => (
              <div key={d.id} style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #e5e5e0', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FCEBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg style={{ width: 18, height: 18, color: '#A32D2D' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: 12, fontWeight: 500, color: '#1a1a1a' }}>{d.description}</p>
                  <p style={{ fontSize: 10, color: '#888' }}>{d.nom_commission} · {new Date(d.date_depense).toLocaleDateString('fr-FR')}</p>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#A32D2D' }}>{d.montant.toLocaleString()} FCFA</p>
                </div>
                <button onClick={() => supprimerDepense(d.id)} style={{ width: 30, height: 30, borderRadius: 8, background: '#FCEBEB', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg style={{ width: 13, height: 13, color: '#A32D2D' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </AdminLayout>
  )
}
