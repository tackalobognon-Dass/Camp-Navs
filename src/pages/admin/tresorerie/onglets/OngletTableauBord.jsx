import { useState } from 'react'
import { fmt, VERT, VERT_CLAIR, TYPES_RECETTE, commStats } from '../utils'

export default function OngletTableauBord({
  recettes, commissions, depenses, donsNature,
  budgetGlobal, budgetGlobalId, totalRecettes, totalDepenses,
  soldeGlobal, totalAlloue, soldeNonAlloue, pctCollecte,
  depassements, caisseJour, onSaveBudget, saving,
}) {
  const [editBudget, setEditBudget] = useState(false)
  const [budgetForm, setBudgetForm] = useState(budgetGlobal)
  const [showMoreCaisse, setShowMoreCaisse] = useState(false)
  const [showMoreSources, setShowMoreSources] = useState(false)
  const [showMoreComm, setShowMoreComm] = useState(false)

  const sourcesAvecMontant = TYPES_RECETTE.map(t => ({
    ...t,
    montant: recettes.filter(r => r.type === t.key).reduce((s, r) => s + (r.montant || 0), 0),
  })).filter(t => t.montant > 0)

  const caisseVisible = showMoreCaisse ? caisseJour : caisseJour.slice(0, 4)
  const sourcesVisible = showMoreSources ? sourcesAvecMontant : sourcesAvecMontant.slice(0, 4)
  const commVisible = showMoreComm ? commissions : commissions.slice(0, 4)

  const caisseEntree = caisseJour.filter(t => t._type === 'recette').reduce((s, t) => s + t._montant, 0)
  const caisseSortie = caisseJour.filter(t => t._type === 'depense').reduce((s, t) => s + t._montant, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

      {/* Alertes dépassements */}
      {depassements.length > 0 && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 12, padding: '10px 14px' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#DC2626', margin: '0 0 6px' }}>
            ⚠ {depassements.length} commission(s) en dépassement
          </p>
          {depassements.map(c => {
            const dep = depenses.filter(d => d.commission_id === c.id).reduce((s, d) => s + d.montant, 0)
            return (
              <p key={c.id} style={{ fontSize: 11, color: '#DC2626', margin: '2px 0' }}>
                {c.nom_commission} : dépensé {fmt(dep)} / alloué {fmt(c.montant_alloue || 0)} FCFA (+{fmt(dep - (c.montant_alloue || 0))} FCFA)
              </p>
            )
          })}
        </div>
      )}

      {/* Budget global */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #F1F5F9', padding: '10px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: editBudget ? 8 : 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em' }}>BUDGET GLOBAL</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>
              {budgetGlobal > 0 ? `${fmt(budgetGlobal)} FCFA` : '—'}
            </span>
          </div>
          <button type="button" onClick={() => { setEditBudget(!editBudget); setBudgetForm(budgetGlobal) }}
            style={{ fontSize: 11, color: VERT, background: 'transparent', border: `1px solid ${VERT}`, borderRadius: 6, padding: '3px 10px', cursor: 'pointer' }}>
            {editBudget ? 'Annuler' : 'Modifier'}
          </button>
        </div>
        {editBudget && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input type="number" value={budgetForm}
              onChange={e => setBudgetForm(e.target.value)}
              placeholder="Montant du budget global FCFA"
              style={{ flex: 1, border: '1px solid #E2E8F0', borderRadius: 8, padding: '7px 12px', fontSize: 13, outline: 'none', color: '#1E293B' }} />
            <button type="button" onClick={() => { onSaveBudget(parseInt(budgetForm) || 0); setEditBudget(false) }} disabled={saving}
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
              <span style={{ fontSize: 10, color: '#94A3B8' }}>Reste : {fmt(Math.max(budgetGlobal - totalRecettes, 0))} FCFA</span>
            </div>
          </>
        )}
      </div>

      {/* 4 KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[
          { label: 'Recettes totales', val: totalRecettes, color: '#065F46', border: '#6EE7B7', prefix: '+' },
          { label: 'Dépenses totales', val: totalDepenses, color: '#DC2626', border: '#FCA5A5', prefix: '-' },
          { label: 'Solde disponible', val: soldeGlobal, color: soldeGlobal >= 0 ? '#1D4ED8' : '#DC2626', border: soldeGlobal >= 0 ? '#93C5FD' : '#FCA5A5', prefix: '' },
          { label: 'Non alloué', val: soldeNonAlloue, color: '#92400E', border: '#FCD34D', prefix: '' },
        ].map(k => (
          <div key={k.label} style={{ background: '#fff', borderRadius: 10, border: `1px solid ${k.border}`, padding: '10px 12px' }}>
            <p style={{ fontSize: 10, color: '#94A3B8', margin: '0 0 4px', fontWeight: 500 }}>{k.label}</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: k.color, margin: 0 }}>{k.prefix}{fmt(k.val)}</p>
            <p style={{ fontSize: 9, color: '#CBD5E1', margin: '1px 0 0' }}>FCFA</p>
          </div>
        ))}
      </div>

      {/* Caisse du jour */}
      {caisseJour.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #F1F5F9', padding: '10px 14px' }}>
          <p style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', margin: '0 0 8px', textTransform: 'uppercase' }}>
            Caisse du jour ({caisseJour.length} mouvement(s))
          </p>
          {caisseVisible.map((tx, i) => {
            const isR = tx._type === 'recette'
            return (
              <div key={`${tx._type}-${tx.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderBottom: i < caisseVisible.length - 1 ? '1px solid #F8FAFC' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: isR ? '#065F46' : '#DC2626' }}>{isR ? '+' : '−'}</span>
                  <span style={{ fontSize: 12, color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>{tx._label}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: isR ? '#065F46' : '#DC2626', flexShrink: 0 }}>{fmt(tx._montant)} FCFA</span>
              </div>
            )
          })}
          {caisseJour.length > 4 && (
            <button type="button" onClick={() => setShowMoreCaisse(!showMoreCaisse)}
              style={{ fontSize: 11, color: VERT, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0 0', fontWeight: 600 }}>
              {showMoreCaisse ? 'Voir moins ↑' : `Voir plus (${caisseJour.length - 4} de plus) ↓`}
            </button>
          )}
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Bilan du jour</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: caisseEntree - caisseSortie >= 0 ? '#065F46' : '#DC2626' }}>
              {caisseEntree - caisseSortie >= 0 ? '+' : ''}{fmt(caisseEntree - caisseSortie)} FCFA
            </span>
          </div>
        </div>
      )}

      {/* Recettes par source */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #F1F5F9', padding: '10px 14px' }}>
        <p style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', margin: '0 0 8px', textTransform: 'uppercase' }}>Recettes par source</p>
        {sourcesAvecMontant.length === 0 && <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>Aucune recette enregistrée.</p>}
        {sourcesVisible.map(t => (
          <div key={t.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #F8FAFC' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: VERT }} />
              <span style={{ fontSize: 12, color: '#1E293B' }}>{t.label}</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#065F46' }}>{fmt(t.montant)} FCFA</span>
          </div>
        ))}
        {sourcesAvecMontant.length > 4 && (
          <button type="button" onClick={() => setShowMoreSources(!showMoreSources)}
            style={{ fontSize: 11, color: VERT, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0 0', fontWeight: 600 }}>
            {showMoreSources ? 'Voir moins ↑' : `Voir plus ↓`}
          </button>
        )}
      </div>

      {/* Commissions résumé */}
      {commissions.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #F1F5F9', padding: '10px 14px' }}>
          <p style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', margin: '0 0 8px', textTransform: 'uppercase' }}>Commissions</p>
          {commVisible.map((c, i) => {
            const { dep, alloue, sol, depasse } = commStats(c, depenses)
            return (
              <div key={c.id} style={{ padding: '7px 0', borderBottom: i < commVisible.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{c.nom_commission}</span>
                    {depasse && <span style={{ fontSize: 9, fontWeight: 700, background: '#FEF2F2', color: '#DC2626', borderRadius: 20, padding: '1px 6px' }}>⚠</span>}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: sol >= 0 ? '#065F46' : '#DC2626' }}>
                    {sol >= 0 ? '+' : ''}{fmt(sol)} FCFA
                  </span>
                </div>
                <p style={{ fontSize: 10, color: '#94A3B8', margin: '2px 0 0' }}>Alloué : {fmt(alloue)} | Dépensé : {fmt(dep)}</p>
              </div>
            )
          })}
          {commissions.length > 4 && (
            <button type="button" onClick={() => setShowMoreComm(!showMoreComm)}
              style={{ fontSize: 11, color: VERT, background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0 0', fontWeight: 600 }}>
              {showMoreComm ? 'Voir moins ↑' : `Voir plus (${commissions.length - 4} de plus) ↓`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
