import { useEffect, useState, useMemo, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'
import AdminLayout from '../../../components/admin/AdminLayout'
import {
  VERT, VERT_CLAIR, LIMIT,
  fmt, getTypeRecette, estAujourdhui, montantRecetteEffectif, commStats,
  EMPTY_R, EMPTY_D, EMPTY_DN, EMPTY_C,
} from './utils'
import { exportPDFTresorerie } from './exportPDF'
import { exportExcelTresorerie } from './exportExcel'
import FormRecette    from './FormRecette'
import FormDepense    from './FormDepense'
import FormDonNature  from './FormDonNature'
import FormCommission from './FormCommission'
import OngletTableauBord  from './onglets/OngletTableauBord'
import OngletRecettes     from './onglets/OngletRecettes'
import OngletDonsNature   from './onglets/OngletDonsNature'
import OngletCommissions  from './onglets/OngletCommissions'
import OngletDepenses     from './onglets/OngletDepenses'
import OngletHistorique   from './onglets/OngletHistorique'

export default function TresoreriePage() {
  // ── Données ──
  const [recettes,    setRecettes]    = useState([])
  const [commissions, setCommissions] = useState([])
  const [depenses,    setDepenses]    = useState([])
  const [donsNature,  setDonsNature]  = useState([])
  const [budgetGlobal,    setBudgetGlobal]    = useState(0)
  const [budgetGlobalId,  setBudgetGlobalId]  = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)

  // ── Navigation ──
  const [onglet, setOnglet] = useState('tableau_bord')

  // ── Formulaires visibles ──
  const [showRecette,    setShowRecette]    = useState(false)
  const [showCommission, setShowCommission] = useState(false)
  const [showDepense,    setShowDepense]    = useState(false)
  const [showDonNature,  setShowDonNature]  = useState(false)

  // ── Données formulaires (stables = pas de perte de focus) ──
  const [recetteForm,    setRecetteForm]    = useState(EMPTY_R)
  const [commissionForm, setCommissionForm] = useState(EMPTY_C)
  const [depenseForm,    setDepenseForm]    = useState(EMPTY_D)
  const [donNatureForm,  setDonNatureForm]  = useState(EMPTY_DN)

  // ── Pagination ──
  const [pageR, setPageR] = useState(0)
  const [pageD, setPageD] = useState(0)
  const [hasMoreR, setHasMoreR] = useState(false)
  const [hasMoreD, setHasMoreD] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  // ── Filtres ──
  const [filtreDateR,  setFiltreDateR]  = useState('tout')
  const [filtreDateD,  setFiltreDateD]  = useState('tout')
  const [vueDepenses,  setVueDepenses]  = useState('liste')

  // ── Toast ──
  const [toast, setToast] = useState('')
  const showToast = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }, [])

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const [
      { data: r, count: rc },
      { data: c },
      { data: d, count: dc },
      { data: bg },
    ] = await Promise.all([
      supabase.from('recettes').select('*', { count: 'exact' }).order('date_reception', { ascending: false }).range(0, LIMIT - 1),
      supabase.from('budget_commissions').select('*').order('nom_commission').limit(LIMIT),
      supabase.from('depenses').select('*', { count: 'exact' }).order('date_depense', { ascending: false }).range(0, LIMIT - 1),
      supabase.from('budget_global').select('*').limit(1),
    ])
    setRecettes(r || [])
    setCommissions(c || [])
    setDepenses(d || [])

    // Requête séparée pour dons_nature avec gestion d'erreur explicite
    const { data: dn, error: dnErr } = await supabase
      .from('dons_nature').select('*').order('created_at', { ascending: false })
    if (dnErr) console.error('dons_nature fetch error:', dnErr)
    setDonsNature(dn || [])
    setHasMoreR((rc || 0) > LIMIT)
    setHasMoreD((dc || 0) > LIMIT)
    if (bg && bg.length > 0) {
      setBudgetGlobal(bg[0].montant || 0)
      setBudgetGlobalId(bg[0].id)
    }
    setLoading(false)
  }

  // ── Calculs ──
  const totalRecettes = useMemo(
    () => recettes.reduce((s, r) => s + montantRecetteEffectif(r), 0),
    [recettes]
  )
  const totalDepenses  = useMemo(() => depenses.reduce((s, d) => s + (d.montant || 0), 0), [depenses])
  const soldeGlobal    = useMemo(() => totalRecettes - totalDepenses, [totalRecettes, totalDepenses])
  const totalAlloue    = useMemo(() => commissions.reduce((s, c) => s + (c.montant_alloue || 0), 0), [commissions])
  const soldeNonAlloue = useMemo(() => totalRecettes - totalAlloue, [totalRecettes, totalAlloue])
  const pctCollecte    = useMemo(() => budgetGlobal > 0 ? Math.round((totalRecettes / budgetGlobal) * 100) : 0, [totalRecettes, budgetGlobal])

  const historique = useMemo(() => {
    const r = recettes.map(r => ({
      ...r, _type: 'recette', _date: r.date_reception,
      _montant: r.montant || 0,
      _label: r.description || getTypeRecette(r.type).label,
      _sub: r.donateur || '',
    }))
    const d = depenses.map(d => ({
      ...d, _type: 'depense', _date: d.date_depense,
      _montant: d.montant || 0, _label: d.description, _sub: d.nom_commission || '',
    }))
    return [...r, ...d].sort((a, b) => new Date(b._date) - new Date(a._date))
  }, [recettes, depenses])

  const caisseJour = useMemo(
    () => historique.filter(tx => estAujourdhui(tx._date)),
    [historique]
  )

  const depassements = useMemo(
    () => commissions.filter(c => {
      const { dep, alloue } = commStats(c, depenses)
      return dep > alloue && alloue > 0
    }),
    [commissions, depenses]
  )

  const subventionEnAttente = useMemo(
    () => recettes
      .filter(r => r.type === 'subvention' && r.statut_recette === 'demandée')
      .reduce((s, r) => s + (r.montant || 0), 0),
    [recettes]
  )

  // ── Pagination ──
  async function chargerPlusR() {
    setLoadingMore(true)
    const next = pageR + 1
    const { data } = await supabase.from('recettes').select('*')
      .order('date_reception', { ascending: false })
      .range(next * LIMIT, next * LIMIT + LIMIT - 1)
    setRecettes(prev => [...prev, ...(data || [])])
    setPageR(next)
    setHasMoreR((data || []).length === LIMIT)
    setLoadingMore(false)
  }

  async function chargerPlusD() {
    setLoadingMore(true)
    const next = pageD + 1
    const { data } = await supabase.from('depenses').select('*')
      .order('date_depense', { ascending: false })
      .range(next * LIMIT, next * LIMIT + LIMIT - 1)
    setDepenses(prev => [...prev, ...(data || [])])
    setPageD(next)
    setHasMoreD((data || []).length === LIMIT)
    setLoadingMore(false)
  }

  // ── CRUD Recettes ──
  async function saveRecette() {
    const montant = recetteForm.type === 'vente_tshirt' && recetteForm.quantite && recetteForm.prix_unitaire
      ? parseInt(recetteForm.quantite) * parseInt(recetteForm.prix_unitaire)
      : parseInt(recetteForm.montant) || 0
    if (!montant) return
    setSaving(true)
    const payload = {
      type: recetteForm.type, description: recetteForm.description, montant,
      donateur: recetteForm.donateur, date_reception: recetteForm.date_reception,
      statut_recette: recetteForm.statut_recette || null,
      quantite: recetteForm.quantite ? parseInt(recetteForm.quantite) : null,
      prix_unitaire: recetteForm.prix_unitaire ? parseInt(recetteForm.prix_unitaire) : null,
    }
    if (recetteForm._editId) {
      const { data: upd } = await supabase.from('recettes').update(payload).eq('id', recetteForm._editId).select().single()
      if (upd) setRecettes(prev => prev.map(r => r.id === recetteForm._editId ? upd : r))
      showToast('Recette modifiée ✓')
    } else {
      const { data: newR } = await supabase.from('recettes').insert([payload]).select().single()
      if (newR) setRecettes(prev => [newR, ...prev])
      showToast('Recette ajoutée ✓')
    }
    setSaving(false); setShowRecette(false); setRecetteForm(EMPTY_R)
  }

  async function supprimerRecette(id) {
    if (!window.confirm('Supprimer cette recette ?')) return
    await supabase.from('recettes').delete().eq('id', id)
    setRecettes(prev => prev.filter(r => r.id !== id))
    showToast('Recette supprimée')
  }

  // ── CRUD Dépenses ──
  async function saveDepense() {
    if (!depenseForm.commission_id || !depenseForm.description || !depenseForm.montant) return
    setSaving(true)
    const comm = commissions.find(c => c.id === depenseForm.commission_id)
    const payload = {
      commission_id: depenseForm.commission_id,
      nom_commission: comm?.nom_commission || '',
      description: depenseForm.description,
      montant: parseInt(depenseForm.montant) || 0,
      date_depense: depenseForm.date_depense,
      justificatif: depenseForm.justificatif,
    }
    if (depenseForm._editId) {
      const { data: upd } = await supabase.from('depenses').update(payload).eq('id', depenseForm._editId).select().single()
      if (upd) setDepenses(prev => prev.map(d => d.id === depenseForm._editId ? upd : d))
      showToast('Dépense modifiée ✓')
    } else {
      const { data: newD } = await supabase.from('depenses').insert([payload]).select().single()
      if (newD) setDepenses(prev => [newD, ...prev])
      showToast('Dépense enregistrée ✓')
    }
    setSaving(false); setShowDepense(false); setDepenseForm(EMPTY_D)
  }

  async function supprimerDepense(id) {
    if (!window.confirm('Supprimer cette dépense ?')) return
    await supabase.from('depenses').delete().eq('id', id)
    setDepenses(prev => prev.filter(d => d.id !== id))
    showToast('Dépense supprimée')
  }

  // ── CRUD Dons nature ──
  async function saveDonNature() {
    if (!donNatureForm.designation || !donNatureForm.quantite) return
    setSaving(true)
    const payload = {
      designation: donNatureForm.designation,
      quantite: parseFloat(donNatureForm.quantite),
      unite: donNatureForm.unite,
      valeur_estimee: parseInt(donNatureForm.valeur_estimee) || 0,
      donateur: donNatureForm.donateur,
      type_donateur: donNatureForm.type_donateur,
      commission_id: donNatureForm.commission_id || null,
      statut: donNatureForm.statut,
      date_reception: donNatureForm.date_reception,
    }
    if (donNatureForm._editId) {
      await supabase.from('dons_nature').update(payload).eq('id', donNatureForm._editId)
      showToast('Don modifié ✓')
    } else {
      await supabase.from('dons_nature').insert([payload])
      showToast('Don enregistré ✓')
    }
    const { data: dn } = await supabase.from('dons_nature').select('*').order('created_at', { ascending: false })
    setDonsNature(dn || [])
    setSaving(false); setShowDonNature(false); setDonNatureForm(EMPTY_DN)
  }

  async function supprimerDonNature(id) {
    if (!window.confirm('Supprimer ce don ?')) return
    await supabase.from('dons_nature').delete().eq('id', id)
    const { data: dn } = await supabase.from('dons_nature').select('*').order('created_at', { ascending: false })
    setDonsNature(dn || [])
    showToast('Don supprimé')
  }

  // ── CRUD Commissions ──
  async function saveCommission() {
    if (!commissionForm.nom_commission) return
    setSaving(true)
    const { data: newC } = await supabase.from('budget_commissions').insert([{
      nom_commission: commissionForm.nom_commission,
      budget_previsionnel: parseInt(commissionForm.budget_previsionnel) || 0,
      montant_alloue: 0,
    }]).select().single()
    if (newC) setCommissions(prev => [...prev, newC].sort((a, b) => a.nom_commission.localeCompare(b.nom_commission)))
    setSaving(false); setShowCommission(false); setCommissionForm(EMPTY_C)
    showToast('Commission créée ✓')
  }

  async function saveAllouer(commissionId, montant) {
    await supabase.from('budget_commissions').update({ montant_alloue: montant }).eq('id', commissionId)
    setCommissions(prev => prev.map(c => c.id === commissionId ? { ...c, montant_alloue: montant } : c))
    showToast('Allocation mise à jour ✓')
  }

  async function supprimerCommission(id) {
    if (!window.confirm('Supprimer cette commission ?')) return
    await supabase.from('budget_commissions').delete().eq('id', id)
    setCommissions(prev => prev.filter(c => c.id !== id))
    showToast('Commission supprimée')
  }

  async function saveBudgetGlobal(montant) {
    setSaving(true)
    if (budgetGlobalId) {
      await supabase.from('budget_global').update({ montant }).eq('id', budgetGlobalId)
    } else {
      const { data } = await supabase.from('budget_global').insert([{ montant }]).select().single()
      if (data) setBudgetGlobalId(data.id)
    }
    setBudgetGlobal(montant)
    setSaving(false)
    showToast('Budget mis à jour ✓')
  }

  // ── Helpers onChange stables ──
  const onChangeRecette    = useCallback((k, v) => setRecetteForm(f    => ({ ...f, [k]: v })), [])
  const onChangeDepense    = useCallback((k, v) => setDepenseForm(f    => ({ ...f, [k]: v })), [])
  const onChangeDonNature  = useCallback((k, v) => setDonNatureForm(f  => ({ ...f, [k]: v })), [])
  const onChangeCommission = useCallback((k, v) => setCommissionForm(f => ({ ...f, [k]: v })), [])

  const chipS = (a) => ({
    flexShrink: 0, padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
    cursor: 'pointer', border: `1px solid ${a ? VERT : '#E2E8F0'}`,
    background: a ? VERT : '#fff', color: a ? '#fff' : '#64748B',
  })

  return (
    <AdminLayout>
      {/* Toast */}
      {toast !== '' && (
        <div style={{ position: 'fixed', bottom: 84, left: '50%', transform: 'translateX(-50%)', background: VERT, color: '#fff', borderRadius: 12, padding: '10px 22px', fontSize: 13, fontWeight: 600, zIndex: 200, boxShadow: '0 4px 20px rgba(0,0,0,0.2)', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
          {toast}
        </div>
      )}

      {/* Conteneur absolu plein écran dans main */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#F8FAFC', overflow: 'hidden' }}>

      {/* ── HEADER FIXE ── */}
      <div style={{ flexShrink: 0, background: '#F8FAFC', padding: '14px 14px 8px', borderBottom: '1px solid #F1F5F9' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1E293B', margin: 0 }}>Trésorerie</h1>
            <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 0' }}>Camp-Navs 2026</p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" onClick={() => exportPDFTresorerie(recettes, commissions, depenses, donsNature, budgetGlobal)}
              style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              PDF
            </button>
            <button type="button" onClick={() => exportExcelTresorerie(recettes, commissions, depenses)}
              style={{ background: VERT_CLAIR, color: VERT, border: `1px solid ${VERT}`, borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              Excel
            </button>
          </div>
        </div>

        {/* Onglets */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {[
            { key: 'tableau_bord', label: 'Tableau de bord' },
            { key: 'recettes',     label: `Recettes (${recettes.length})` },
            { key: 'dons_nature',  label: `Dons nature (${donsNature.length})` },
            { key: 'commissions',  label: 'Commissions' },
            { key: 'depenses',     label: `Dépenses (${depenses.length})` },
            { key: 'historique',   label: 'Historique' },
          ].map(o => (
            <button key={o.key} type="button" onClick={() => setOnglet(o.key)} style={chipS(onglet === o.key)}>
              {o.label}
            </button>
          ))}
        </div>
      </div>{/* fin header fixe */}

      {/* Zone scrollable */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '12px 14px 14px' }}>

      {loading && <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '30px 0' }}>Chargement...</p>}

      {!loading && (
        <>
          {onglet === 'tableau_bord' && (
            <OngletTableauBord
              recettes={recettes} commissions={commissions} depenses={depenses} donsNature={donsNature}
              budgetGlobal={budgetGlobal} budgetGlobalId={budgetGlobalId}
              totalRecettes={totalRecettes} totalDepenses={totalDepenses} soldeGlobal={soldeGlobal}
              totalAlloue={totalAlloue} soldeNonAlloue={soldeNonAlloue} pctCollecte={pctCollecte}
              depassements={depassements} caisseJour={caisseJour}
              onSaveBudget={saveBudgetGlobal} saving={saving}
              onNavigate={setOnglet}
              subventionEnAttente={subventionEnAttente}
            />
          )}

          {onglet === 'recettes' && (
            <OngletRecettes
              recettes={recettes}
              showForm={showRecette}
              onToggleForm={() => { setShowRecette(s => !s); setRecetteForm(EMPTY_R) }}
              filtreDateR={filtreDateR} onChangeFiltre={setFiltreDateR}
              onEdit={r => { setRecetteForm({ ...r, _editId: r.id }); setShowRecette(true) }}
              onDelete={supprimerRecette}
              hasMoreR={hasMoreR} onLoadMore={chargerPlusR} loadingMore={loadingMore}
              FormRecette={FormRecette}
              formProps={{ form: recetteForm, onChange: onChangeRecette, onSave: saveRecette, onCancel: () => { setShowRecette(false); setRecetteForm(EMPTY_R) }, saving }}
            />
          )}

          {onglet === 'dons_nature' && (
            <OngletDonsNature
              donsNature={donsNature} commissions={commissions}
              showForm={showDonNature}
              onToggleForm={() => { setShowDonNature(s => !s); setDonNatureForm(EMPTY_DN) }}
              onEdit={d => { setDonNatureForm({ ...d, _editId: d.id }); setShowDonNature(true) }}
              onDelete={supprimerDonNature}
              FormDonNature={FormDonNature}
              formProps={{ form: donNatureForm, onChange: onChangeDonNature, onSave: saveDonNature, onCancel: () => { setShowDonNature(false); setDonNatureForm(EMPTY_DN) }, saving }}
            />
          )}

          {onglet === 'commissions' && (
            <OngletCommissions
              commissions={commissions} depenses={depenses} donsNature={donsNature}
              showForm={showCommission}
              onToggleForm={() => { setShowCommission(s => !s); setCommissionForm(EMPTY_C) }}
              onSaveAllouer={saveAllouer}
              onSupprimerCommission={supprimerCommission}
              saving={saving}
              FormCommission={FormCommission}
              formProps={{ form: commissionForm, onChange: onChangeCommission, onSave: saveCommission, onCancel: () => { setShowCommission(false); setCommissionForm(EMPTY_C) }, saving }}
            />
          )}

          {onglet === 'depenses' && (
            <OngletDepenses
              depenses={depenses} commissions={commissions}
              showForm={showDepense}
              onToggleForm={() => { setShowDepense(s => !s); setDepenseForm(EMPTY_D) }}
              filtreDateD={filtreDateD} onChangeFiltre={setFiltreDateD}
              vueDepenses={vueDepenses} onChangeVue={setVueDepenses}
              onEdit={d => { setDepenseForm({ ...d, _editId: d.id }); setShowDepense(true) }}
              onDelete={supprimerDepense}
              hasMoreD={hasMoreD} onLoadMore={chargerPlusD} loadingMore={loadingMore}
              FormDepense={FormDepense}
              formProps={{ form: depenseForm, onChange: onChangeDepense, onSave: saveDepense, onCancel: () => { setShowDepense(false); setDepenseForm(EMPTY_D) }, saving }}
            />
          )}

          {onglet === 'historique' && (
            <OngletHistorique
              historique={historique}
              totalRecettes={totalRecettes}
              totalDepenses={totalDepenses}
            />
          )}
        </>
      )}

      </div>{/* fin zone scrollable */}
      </div>{/* fin conteneur absolu */}
    </AdminLayout>
  )
}
