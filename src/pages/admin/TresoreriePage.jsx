import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/admin/AdminLayout'

const VERT = '#1B3B2B'
const VERT_CLAIR = '#E8F5E8'

const TYPES_RECETTE = [
  { key: 'frais_participation', label: 'Frais de participation', color: '#065F46', bg: '#ECFDF5' },
  { key: 'don_financier',       label: 'Don financier',         color: '#1D4ED8', bg: '#EFF6FF' },
  { key: 'don_nature',          label: 'Don en nature',         color: '#6D28D9', bg: '#F5F3FF' },
  { key: 'subvention',          label: 'Subvention',            color: '#92400E', bg: '#FFFBEB' },
  { key: 'autre',               label: 'Autre',                 color: '#475569', bg: '#F8FAFC' },
]

function getTypeRecette(key) {
  return TYPES_RECETTE.find(t => t.key === key) || TYPES_RECETTE[4]
}

function exportExcelTresorerie(recettes, commissions, depenses) {
  const now = new Date().toLocaleDateString('fr-FR')
  const totalRecettes = recettes.reduce((s, r) => s + (r.montant || r.valeur_estimee || 0), 0)
  const totalDepenses = depenses.reduce((s, d) => s + (d.montant || 0), 0)
  const lignes = [
    ['RAPPORT FINANCIER — CAMP-NAVS 2026'], [`Exporté le ${now}`], [],
    ['=== RECETTES ==='], ['Type', 'Description', 'Donateur', 'Montant', 'Date'],
    ...recettes.map(r => [getTypeRecette(r.type).label, r.description || '', r.donateur || '', r.montant || r.valeur_estimee || 0, new Date(r.date_reception).toLocaleDateString('fr-FR')]),
    [], ['Total recettes', '', '', totalRecettes], [],
    ['=== COMMISSIONS ==='], ['Commission', 'Budget prévu', 'Alloué', 'Dépensé', 'Solde'],
    ...commissions.map(c => { const d = depenses.filter(x => x.commission_id === c.id).reduce((s, x) => s + x.montant, 0); return [c.nom_commission, c.budget_previsionnel || 0, c.montant_alloue || 0, d, (c.montant_alloue || 0) - d] }),
    [], ['=== RÉSUMÉ ==='], ['Total recettes', `${totalRecettes.toLocaleString()} FCFA`], ['Total dépenses', `${totalDepenses.toLocaleString()} FCFA`], ['Solde', `${(totalRecettes - totalDepenses).toLocaleString()} FCFA`],
  ]
  const csv = '\uFEFF' + lignes.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = `Tresorerie_CampNavs2026_${now.replace(/\//g, '-')}.csv`; a.click()
  URL.revokeObjectURL(url)
}

function exportPDFTresorerie(recettes, commissions, depenses) {
  const now = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const totalRecettes = recettes.reduce((s, r) => s + (r.montant || r.valeur_estimee || 0), 0)
  const totalDepenses = depenses.reduce((s, d) => s + (d.montant || 0), 0)
  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Rapport Trésorerie</title>
<style>body{font-family:Arial,sans-serif;font-size:12px;color:#1a1a1a;margin:30px}h1{font-size:20px;color:#1B3B2B}h2{font-size:14px;color:#1B3B2B;border-bottom:2px solid #1B3B2B;padding-bottom:4px;margin:20px 0 10px}table{width:100%;border-collapse:collapse;margin-bottom:16px}th{background:#1B3B2B;color:#fff;padding:7px 10px;text-align:left;font-size:11px}td{padding:6px 10px;border-bottom:0.5px solid #e5e5e0;font-size:11px}.footer{margin-top:30px;font-size:10px;color:#888;text-align:center}</style>
</head><body>
<h1>Rapport Trésorerie — Camp-Navs 2026</h1><p style="color:#666;font-size:11px">Généré le ${now}</p>
<h2>Recettes</h2><table><tr><th>Type</th><th>Description</th><th>Donateur</th><th>Montant (FCFA)</th><th>Date</th></tr>
${recettes.map(r => `<tr><td>${getTypeRecette(r.type).label}</td><td>${r.description || '-'}</td><td>${r.donateur || '-'}</td><td><b>${(r.montant || r.valeur_estimee || 0).toLocaleString()}</b></td><td>${new Date(r.date_reception).toLocaleDateString('fr-FR')}</td></tr>`).join('')}
<tr><td colspan="3"><b>TOTAL</b></td><td><b>${totalRecettes.toLocaleString()} FCFA</b></td><td></td></tr></table>
<h2>Résumé</h2><p>Total recettes : <b>${totalRecettes.toLocaleString()} FCFA</b></p><p>Total dépenses : <b>${totalDepenses.toLocaleString()} FCFA</b></p><p>Solde : <b>${(totalRecettes - totalDepenses).toLocaleString()} FCFA</b></p>
<div class="footer">Camp-Navs 2026 · Mission Évangélique des Navigateurs — CI · ${now}</div>
</body></html>`
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank')
  if (win) setTimeout(() => win.print(), 800)
  URL.revokeObjectURL(url)
}

const inputStyle = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400"
const labelStyle = "block text-xs text-gray-500 mb-1"

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

  // Formulaires — rendus conditionnellement (amélioration 4)
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

  // Amélioration 3 : limit(50) sur chaque requête
  async function fetchData() {
    const [{ data: r }, { data: c }, { data: d }, { data: bg }] = await Promise.all([
      supabase.from('recettes').select('*').order('date_reception', { ascending: false }).limit(50),
      supabase.from('budget_commissions').select('*').order('nom_commission').limit(50),
      supabase.from('depenses').select('*').order('date_depense', { ascending: false }).limit(50),
      supabase.from('budget_global').select('*').limit(1),
    ])
    setRecettes(r || [])
    setCommissions(c || [])
    setDepenses(d || [])
    if (bg && bg.length > 0) { setBudgetGlobal(bg[0].montant || 0); setBudgetGlobalId(bg[0].id); setBudgetForm(bg[0].montant || 0) }
    setLoading(false)
  }

  // Amélioration 2 : useMemo pour les calculs
  const totalRecettes   = useMemo(() => recettes.reduce((s, r) => s + (r.montant || r.valeur_estimee || 0), 0), [recettes])
  const totalDepenses   = useMemo(() => depenses.reduce((s, d) => s + (d.montant || 0), 0), [depenses])
  const soldeGlobal     = useMemo(() => totalRecettes - totalDepenses, [totalRecettes, totalDepenses])
  const totalAlloue     = useMemo(() => commissions.reduce((s, c) => s + (c.montant_alloue || 0), 0), [commissions])
  const soldeNonAlloue  = useMemo(() => totalRecettes - totalAlloue, [totalRecettes, totalAlloue])
  const pctCollecte     = useMemo(() => budgetGlobal > 0 ? Math.round((totalRecettes / budgetGlobal) * 100) : 0, [totalRecettes, budgetGlobal])

  // Amélioration 1 : mise à jour locale sans re-fetch

  async function saveBudgetGlobal() {
    setSaving(true)
    const montant = parseInt(budgetForm) || 0
    if (budgetGlobalId) await supabase.from('budget_global').update({ montant }).eq('id', budgetGlobalId)
    else { const { data } = await supabase.from('budget_global').insert([{ montant }]).select().single(); if (data) setBudgetGlobalId(data.id) }
    setBudgetGlobal(montant)
    setSaving(false); setEditBudget(false)
  }

  async function saveRecette() {
    if (!recetteForm.montant && !recetteForm.valeur_estimee) return
    setSaving(true)
    const payload = { type: recetteForm.type, description: recetteForm.description, montant: parseInt(recetteForm.montant) || 0, valeur_estimee: parseInt(recetteForm.valeur_estimee) || 0, donateur: recetteForm.donateur, date_reception: recetteForm.date_reception }
    const { data: newR } = await supabase.from('recettes').insert([payload]).select().single()
    if (newR) setRecettes(prev => [newR, ...prev])
    setSaving(false); setShowRecette(false)
    setRecetteForm({ type: 'don_financier', description: '', montant: '', valeur_estimee: '', donateur: '', date_reception: new Date().toISOString().split('T')[0] })
  }

  async function saveCommission() {
    if (!commissionForm.nom_commission) return
    setSaving(true)
    const payload = { nom_commission: commissionForm.nom_commission, budget_previsionnel: parseInt(commissionForm.budget_previsionnel) || 0, montant_alloue: 0 }
    const { data: newC } = await supabase.from('budget_commissions').insert([payload]).select().single()
    if (newC) setCommissions(prev => [...prev, newC].sort((a, b) => a.nom_commission.localeCompare(b.nom_commission)))
    setSaving(false); setShowCommission(false); setCommissionForm({ nom_commission: '', budget_previsionnel: '' })
  }

  async function saveDepense() {
    if (!depenseForm.commission_id || !depenseForm.description || !depenseForm.montant) return
    setSaving(true)
    const comm = commissions.find(c => c.id === depenseForm.commission_id)
    const payload = { commission_id: depenseForm.commission_id, nom_commission: comm?.nom_commission || '', description: depenseForm.description, montant: parseInt(depenseForm.montant) || 0, date_depense: depenseForm.date_depense, justificatif: depenseForm.justificatif }
    const { data: newD } = await supabase.from('depenses').insert([payload]).select().single()
    if (newD) setDepenses(prev => [newD, ...prev])
    setSaving(false); setShowDepense(false)
    setDepenseForm({ commission_id: '', description: '', montant: '', date_depense: new Date().toISOString().split('T')[0], justificatif: '' })
  }

  async function saveAllouer(commissionId) {
    if (!allouerMontant) return
    setSaving(true)
    const montant = parseInt(allouerMontant)
    await supabase.from('budget_commissions').update({ montant_alloue: montant }).eq('id', commissionId)
    setCommissions(prev => prev.map(c => c.id === commissionId ? { ...c, montant_alloue: montant } : c))
    setSaving(false); setShowAllouer(null); setAllouerMontant('')
  }

  async function supprimerRecette(id) {
    if (!window.confirm('Supprimer ?')) return
    await supabase.from('recettes').delete().eq('id', id)
    setRecettes(prev => prev.filter(r => r.id !== id))
  }

  async function supprimerDepense(id) {
    if (!window.confirm('Supprimer ?')) return
    await supabase.from('depenses').delete().eq('id', id)
    setDepenses(prev => prev.filter(d => d.id !== id))
  }

  async function supprimerCommission(id) {
    if (!window.confirm('Supprimer ?')) return
    await supabase.from('budget_commissions').delete().eq('id', id)
    setCommissions(prev => prev.filter(c => c.id !== id))
  }

  const chipStyle = (active) => ({
    flexShrink: 0, padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
    cursor: 'pointer', border: `1px solid ${active ? VERT : '#E2E8F0'}`,
    background: active ? VERT : '#fff', color: active ? '#fff' : '#64748B',
  })

  return (
    <AdminLayout>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1E293B', margin: 0 }}>Trésorerie</h1>
          <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 0' }}>Camp-Navs 2026</p>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button type="button" onClick={() => exportPDFTresorerie(recettes, commissions, depenses)}
            style={{ background: 'transparent', color: '#64748B', border: '1px solid #E2E8F0', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            PDF
          </button>
          <button type="button" onClick={() => exportExcelTresorerie(recettes, commissions, depenses)}
            style={{ background: 'transparent', color: '#64748B', border: '1px solid #E2E8F0', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
            Excel
          </button>
        </div>
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {[{ key: 'tableau_bord', label: 'Tableau de bord' }, { key: 'recettes', label: 'Recettes' }, { key: 'commissions', label: 'Commissions' }, { key: 'depenses', label: 'Dépenses' }].map(o => (
          <button key={o.key} type="button" onClick={() => setOnglet(o.key)} style={chipStyle(onglet === o.key)}>{o.label}</button>
        ))}
      </div>

      {/* ── TABLEAU DE BORD ── */}
      {onglet === 'tableau_bord' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #F1F5F9', padding: '10px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: editBudget ? 8 : 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em' }}>BUDGET GLOBAL</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>{budgetGlobal > 0 ? `${budgetGlobal.toLocaleString()} FCFA` : '—'}</span>
              </div>
              <button type="button" onClick={() => { setEditBudget(!editBudget); setBudgetForm(budgetGlobal) }}
                style={{ fontSize: 11, color: VERT, background: 'transparent', border: `1px solid ${VERT}`, borderRadius: 6, padding: '3px 10px', cursor: 'pointer' }}>
                {editBudget ? 'Annuler' : 'Modifier'}
              </button>
            </div>
            {editBudget && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input type="number" value={budgetForm} onChange={e => setBudgetForm(e.target.value)} placeholder="Montant FCFA"
                  style={{ flex: 1, border: '1px solid #E2E8F0', borderRadius: 8, padding: '7px 12px', fontSize: 13, outline: 'none', color: '#1E293B' }} />
                <button type="button" onClick={saveBudgetGlobal} disabled={saving}
                  style={{ background: VERT, color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  {saving ? '...' : 'OK'}
                </button>
              </div>
            )}
            {budgetGlobal > 0 && !editBudget && (
              <>
                <div style={{ background: '#F1F5F9', borderRadius: 4, height: 4, marginBottom: 4 }}>
                  <div style={{ background: VERT, borderRadius: 4, height: 4, width: `${Math.min(pctCollecte, 100)}%`, transition: 'width .4s' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 10, color: '#64748B' }}>{pctCollecte}% collecté</span>
                  <span style={{ fontSize: 10, color: '#94A3B8' }}>Reste : {Math.max(budgetGlobal - totalRecettes, 0).toLocaleString()} FCFA</span>
                </div>
              </>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { label: 'Recettes totales',  val: totalRecettes,  color: '#065F46', border: '#6EE7B7', prefix: '+' },
              { label: 'Dépenses totales',  val: totalDepenses,  color: '#DC2626', border: '#FCA5A5', prefix: '-' },
              { label: 'Solde disponible',  val: soldeGlobal,    color: soldeGlobal >= 0 ? '#1D4ED8' : '#DC2626', border: soldeGlobal >= 0 ? '#93C5FD' : '#FCA5A5', prefix: '' },
              { label: 'Non alloué',        val: soldeNonAlloue, color: '#92400E', border: '#FCD34D', prefix: '' },
            ].map(k => (
              <div key={k.label} style={{ background: '#fff', borderRadius: 10, border: `1px solid ${k.border}`, padding: '10px 12px' }}>
                <p style={{ fontSize: 10, color: '#94A3B8', margin: '0 0 4px', fontWeight: 500 }}>{k.label}</p>
                <p style={{ fontSize: 15, fontWeight: 700, color: k.color, margin: 0 }}>{k.prefix}{k.val.toLocaleString()}</p>
                <p style={{ fontSize: 9, color: '#CBD5E1', margin: '1px 0 0' }}>FCFA</p>
              </div>
            ))}
          </div>

          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #F1F5F9', padding: '10px 14px' }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', margin: '0 0 8px', textTransform: 'uppercase' }}>Recettes par source</p>
            {TYPES_RECETTE.map(t => {
              const montant = recettes.filter(r => r.type === t.key).reduce((s, r) => s + (r.montant || r.valeur_estimee || 0), 0)
              if (montant === 0) return null
              return (
                <div key={t.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #F8FAFC' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: VERT }} />
                    <span style={{ fontSize: 12, color: '#1E293B' }}>{t.label}</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#065F46' }}>{montant.toLocaleString()} FCFA</span>
                </div>
              )
            })}
            {totalRecettes === 0 && <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>Aucune recette enregistrée.</p>}
          </div>

          {commissions.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #F1F5F9', padding: '10px 14px' }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', margin: '0 0 8px', textTransform: 'uppercase' }}>Commissions</p>
              {commissions.map((c, i) => {
                const totalDep = depenses.filter(d => d.commission_id === c.id).reduce((s, d) => s + d.montant, 0)
                const alloue = c.montant_alloue || 0
                const solde = alloue - totalDep
                return (
                  <div key={c.id} style={{ padding: '7px 0', borderBottom: i < commissions.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{c.nom_commission}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: solde >= 0 ? '#065F46' : '#DC2626' }}>{solde >= 0 ? '+' : ''}{solde.toLocaleString()} FCFA</span>
                    </div>
                    <p style={{ fontSize: 10, color: '#94A3B8', margin: '2px 0 0' }}>Alloué : {alloue.toLocaleString()} | Dépensé : {totalDep.toLocaleString()}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── RECETTES ── */}
      {onglet === 'recettes' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', margin: 0 }}>ENCAISSEMENTS ({recettes.length})</p>
            <button type="button" onClick={() => setShowRecette(!showRecette)}
              style={{ width: 30, height: 30, borderRadius: '50%', background: showRecette ? '#FEF2F2' : VERT, color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 300 }}>
              {showRecette ? '×' : '+'}
            </button>
          </div>
          {showRecette && (
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: '14px', marginBottom: 12 }}>
              <div style={{ marginBottom: 10 }}><label className={labelStyle}>Type</label>
                <select value={recetteForm.type} onChange={e => setRecetteForm(f => ({ ...f, type: e.target.value }))} className={inputStyle}>
                  {TYPES_RECETTE.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 10 }}><label className={labelStyle}>Description</label>
                <input type="text" value={recetteForm.description} onChange={e => setRecetteForm(f => ({ ...f, description: e.target.value }))} placeholder="Ex : Don de l'église XYZ" className={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                <div><label className={labelStyle}>{recetteForm.type === 'don_nature' ? 'Valeur estimée' : 'Montant (FCFA)'}</label>
                  <input type="number" value={recetteForm.type === 'don_nature' ? recetteForm.valeur_estimee : recetteForm.montant}
                    onChange={e => setRecetteForm(f => recetteForm.type === 'don_nature' ? { ...f, valeur_estimee: e.target.value } : { ...f, montant: e.target.value })} className={inputStyle} />
                </div>
                <div><label className={labelStyle}>Date</label>
                  <input type="date" value={recetteForm.date_reception} onChange={e => setRecetteForm(f => ({ ...f, date_reception: e.target.value }))} className={inputStyle} />
                </div>
              </div>
              <div style={{ marginBottom: 12 }}><label className={labelStyle}>Donateur / Source</label>
                <input type="text" value={recetteForm.donateur} onChange={e => setRecetteForm(f => ({ ...f, donateur: e.target.value }))} placeholder="Ex : M. KOUASSI" className={inputStyle} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => setShowRecette(false)} style={{ flex: 1, background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 10, padding: '10px', fontSize: 13, cursor: 'pointer' }}>Annuler</button>
                <button type="button" onClick={saveRecette} disabled={saving} style={{ flex: 1, background: VERT, color: '#fff', border: 'none', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? '...' : 'Ajouter'}</button>
              </div>
            </div>
          )}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            {recettes.length === 0 && <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '20px', margin: 0 }}>Aucune recette enregistrée.</p>}
            {recettes.map((r, i) => {
              const t = getTypeRecette(r.type)
              return (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: i < recettes.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#065F46" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 1v8m0 0v1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: '#1E293B', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description || t.label}</p>
                    <p style={{ fontSize: 11, color: '#94A3B8', margin: 0 }}>{new Date(r.date_reception).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#065F46', margin: 0 }}>{(r.montant || r.valeur_estimee || 0).toLocaleString()}</p>
                    <button type="button" onClick={() => supprimerRecette(r.id)} style={{ width: 26, height: 26, borderRadius: 8, background: '#FEF2F2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="#DC2626" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ── COMMISSIONS ── */}
      {onglet === 'commissions' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', margin: 0 }}>PÔLES ({commissions.length})</p>
            <button type="button" onClick={() => setShowCommission(!showCommission)}
              style={{ width: 30, height: 30, borderRadius: '50%', background: showCommission ? '#FEF2F2' : VERT, color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 300 }}>
              {showCommission ? '×' : '+'}
            </button>
          </div>
          {showCommission && (
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: '14px', marginBottom: 12 }}>
              <div style={{ marginBottom: 10 }}><label className={labelStyle}>Nom *</label>
                <input type="text" value={commissionForm.nom_commission} onChange={e => setCommissionForm(f => ({ ...f, nom_commission: e.target.value }))} placeholder="Ex : Logistique..." className={inputStyle} />
              </div>
              <div style={{ marginBottom: 12 }}><label className={labelStyle}>Budget prévisionnel (FCFA)</label>
                <input type="number" value={commissionForm.budget_previsionnel} onChange={e => setCommissionForm(f => ({ ...f, budget_previsionnel: e.target.value }))} className={inputStyle} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => setShowCommission(false)} style={{ flex: 1, background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 10, padding: '10px', fontSize: 13, cursor: 'pointer' }}>Annuler</button>
                <button type="button" onClick={saveCommission} disabled={saving} style={{ flex: 1, background: VERT, color: '#fff', border: 'none', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? '...' : 'Ajouter'}</button>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {commissions.map(c => {
              const totalDep = depenses.filter(d => d.commission_id === c.id).reduce((s, d) => s + d.montant, 0)
              const alloue = c.montant_alloue || 0
              const solde = alloue - totalDep
              return (
                <div key={c.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: '10px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', margin: 0 }}>{c.nom_commission}</p>
                    <button type="button" onClick={() => supprimerCommission(c.id)} style={{ width: 24, height: 24, borderRadius: 6, background: '#FEF2F2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="#DC2626" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>Prévu : <strong style={{ color: '#475569' }}>{(c.budget_previsionnel || 0).toLocaleString()}</strong></span>
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>Alloué : <strong style={{ color: VERT }}>{alloue.toLocaleString()}</strong></span>
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>Solde : <strong style={{ color: solde < 0 ? '#DC2626' : '#1D4ED8' }}>{solde.toLocaleString()}</strong></span>
                  </div>
                  {showAllouer === c.id ? (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input type="number" value={allouerMontant} onChange={e => setAllouerMontant(e.target.value)} placeholder="Montant à allouer"
                        style={{ flex: 1, border: '1px solid #E2E8F0', borderRadius: 8, padding: '6px 10px', fontSize: 12, outline: 'none', color: '#1E293B' }} />
                      <button type="button" onClick={() => saveAllouer(c.id)} style={{ background: VERT, color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>OK</button>
                      <button type="button" onClick={() => setShowAllouer(null)} style={{ background: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: 'pointer' }}>✕</button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => { setShowAllouer(c.id); setAllouerMontant(alloue || '') }}
                      style={{ background: 'transparent', color: VERT, border: `1px solid ${VERT}`, borderRadius: 8, padding: '5px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                      Modifier l'allocation
                    </button>
                  )}
                </div>
              )
            })}
            {commissions.length === 0 && <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '20px', margin: 0 }}>Aucune commission créée.</p>}
          </div>
        </>
      )}

      {/* ── DÉPENSES ── */}
      {onglet === 'depenses' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', margin: 0 }}>DÉCAISSEMENTS ({depenses.length})</p>
            <button type="button" onClick={() => setShowDepense(!showDepense)}
              style={{ width: 30, height: 30, borderRadius: '50%', background: showDepense ? '#FEF2F2' : VERT, color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 300 }}>
              {showDepense ? '×' : '+'}
            </button>
          </div>
          {showDepense && (
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: '14px', marginBottom: 12 }}>
              <div style={{ marginBottom: 10 }}><label className={labelStyle}>Commission *</label>
                <select value={depenseForm.commission_id} onChange={e => setDepenseForm(f => ({ ...f, commission_id: e.target.value }))} className={inputStyle}>
                  <option value="">Sélectionner</option>
                  {commissions.map(c => <option key={c.id} value={c.id}>{c.nom_commission}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 10 }}><label className={labelStyle}>Description *</label>
                <input type="text" value={depenseForm.description} onChange={e => setDepenseForm(f => ({ ...f, description: e.target.value }))} placeholder="Ex : Achat vivres" className={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                <div><label className={labelStyle}>Montant (FCFA) *</label>
                  <input type="number" value={depenseForm.montant} onChange={e => setDepenseForm(f => ({ ...f, montant: e.target.value }))} className={inputStyle} />
                </div>
                <div><label className={labelStyle}>Date</label>
                  <input type="date" value={depenseForm.date_depense} onChange={e => setDepenseForm(f => ({ ...f, date_depense: e.target.value }))} className={inputStyle} />
                </div>
              </div>
              <div style={{ marginBottom: 12 }}><label className={labelStyle}>Justificatif</label>
                <input type="text" value={depenseForm.justificatif} onChange={e => setDepenseForm(f => ({ ...f, justificatif: e.target.value }))} placeholder="Ex : Reçu n°001" className={inputStyle} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => setShowDepense(false)} style={{ flex: 1, background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 10, padding: '10px', fontSize: 13, cursor: 'pointer' }}>Annuler</button>
                <button type="button" onClick={saveDepense} disabled={saving} style={{ flex: 1, background: VERT, color: '#fff', border: 'none', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? '...' : 'Ajouter'}</button>
              </div>
            </div>
          )}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            {depenses.length === 0 && <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '20px', margin: 0 }}>Aucune dépense enregistrée.</p>}
            {depenses.map((d, i) => (
              <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: i < depenses.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#DC2626" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: '#1E293B', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.description}</p>
                  <p style={{ fontSize: 11, color: '#94A3B8', margin: 0 }}>{d.nom_commission} · {new Date(d.date_depense).toLocaleDateString('fr-FR')}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#DC2626', margin: 0 }}>{d.montant.toLocaleString()}</p>
                  <button type="button" onClick={() => supprimerDepense(d.id)} style={{ width: 26, height: 26, borderRadius: 8, background: '#FEF2F2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="#DC2626" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </AdminLayout>
  )
}
