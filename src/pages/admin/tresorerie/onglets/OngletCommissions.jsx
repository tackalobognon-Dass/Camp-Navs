import { useState } from 'react'
import { fmt, VERT, VERT_CLAIR, commStats } from '../utils'

function FicheCommission({ commission, depenses, onClose }) {
  const { dep, alloue, sol, pct, depasse, warning, couleurBarre } = commStats(commission, depenses)
  const deps = depenses.filter(d => d.commission_id === commission.id)

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onClose}>
      <div style={{ background: '#F8FAFC', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 480, maxHeight: '80vh', overflowY: 'auto', paddingBottom: 28 }}
        onClick={e => e.stopPropagation()}>
        <div style={{ width: 36, height: 3, background: '#E2E8F0', borderRadius: 2, margin: '14px auto 0' }} />
        <div style={{ padding: '14px 16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <p style={{ fontSize: 17, fontWeight: 700, color: '#1E293B', margin: 0 }}>{commission.nom_commission}</p>
            {depasse && <span style={{ fontSize: 9, fontWeight: 700, background: '#FEF2F2', color: '#DC2626', borderRadius: 20, padding: '2px 8px' }}>⚠ DÉPASSEMENT</span>}
            {warning && !depasse && <span style={{ fontSize: 9, fontWeight: 700, background: '#FFFBEB', color: '#D97706', borderRadius: 20, padding: '2px 8px' }}>⚠ 80%</span>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 10 }}>
            {[
              { label: 'Alloué', val: fmt(alloue), color: VERT },
              { label: 'Dépensé', val: fmt(dep), color: depasse ? '#DC2626' : '#1D4ED8' },
              { label: 'Solde', val: `${sol >= 0 ? '+' : ''}${fmt(sol)}`, color: sol >= 0 ? '#065F46' : '#DC2626' },
            ].map(s => (
              <div key={s.label} style={{ background: '#fff', borderRadius: 10, border: '1px solid #E2E8F0', padding: 8, textAlign: 'center' }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: s.color, margin: '0 0 2px' }}>{s.val}</p>
                <p style={{ fontSize: 9, color: '#94A3B8', margin: 0 }}>{s.label}</p>
              </div>
            ))}
          </div>
          <div style={{ background: '#F1F5F9', borderRadius: 4, height: 5, marginBottom: 4 }}>
            <div style={{ background: couleurBarre, borderRadius: 4, height: 5, width: `${Math.min(pct, 100)}%` }} />
          </div>
          <p style={{ fontSize: 10, color: couleurBarre, fontWeight: 600, margin: '0 0 14px', textAlign: 'right' }}>{pct}% consommé</p>
        </div>

        <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', margin: '0 0 8px', padding: '0 16px', textTransform: 'uppercase' }}>
          Dépenses ({deps.length})
        </p>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden', margin: '0 16px' }}>
          {deps.length === 0
            ? <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '16px', margin: 0 }}>Aucune dépense.</p>
            : deps.map((d, i) => (
              <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderBottom: i < deps.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: '#1E293B', margin: '0 0 1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.description}</p>
                  <p style={{ fontSize: 10, color: '#94A3B8', margin: 0 }}>
                    {new Date(d.date_depense).toLocaleDateString('fr-FR')}
                    {d.justificatif && ` · ${d.justificatif}`}
                  </p>
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#DC2626', margin: 0, flexShrink: 0 }}>{fmt(d.montant)} FCFA</p>
              </div>
            ))
          }
        </div>
        <div style={{ padding: '14px 16px 0' }}>
          <button type="button" onClick={onClose}
            style={{ width: '100%', background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 10, padding: 11, fontSize: 13, cursor: 'pointer' }}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}

export default function OngletCommissions({
  commissions, depenses, showForm, onToggleForm,
  onDelete, onSaveAllouer, onSupprimerCommission, saving,
  FormCommission, formProps,
}) {
  const [ficheOuverte, setFicheOuverte] = useState(null)
  const [showAllouer, setShowAllouer] = useState(null)
  const [allouerMontant, setAllouerMontant] = useState('')

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', margin: 0 }}>
          PÔLES ({commissions.length})
        </p>
        <button type="button" onClick={onToggleForm}
          style={{ width: 30, height: 30, borderRadius: '50%', background: showForm ? '#FEF2F2' : VERT, color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 300 }}>
          {showForm ? '×' : '+'}
        </button>
      </div>

      {showForm && <FormCommission {...formProps} />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {commissions.map(c => {
          const { dep, alloue, sol, pct, depasse, warning, couleurBarre } = commStats(c, depenses)
          return (
            <div key={c.id}
              style={{ background: '#fff', borderRadius: 12, border: `1px solid ${depasse ? '#FCA5A5' : warning ? '#FCD34D' : '#E2E8F0'}`, padding: '12px 14px', cursor: 'pointer' }}
              onClick={() => setFicheOuverte(c)}>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', margin: 0 }}>{c.nom_commission}</p>
                  {depasse && <span style={{ fontSize: 9, fontWeight: 700, background: '#FEF2F2', color: '#DC2626', borderRadius: 20, padding: '2px 7px' }}>⚠ DÉPASSEMENT</span>}
                  {warning && !depasse && <span style={{ fontSize: 9, fontWeight: 700, background: '#FFFBEB', color: '#D97706', borderRadius: 20, padding: '2px 7px' }}>⚠ 80%</span>}
                </div>
                <button type="button" onClick={e => { e.stopPropagation(); onSupprimerCommission(c.id) }}
                  style={{ width: 24, height: 24, borderRadius: 6, background: '#FEF2F2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="#DC2626" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 10 }}>
                {[
                  { label: 'Prévu', val: fmt(c.budget_previsionnel || 0), color: '#475569' },
                  { label: 'Alloué', val: fmt(alloue), color: VERT },
                  { label: 'Dépensé', val: fmt(dep), color: depasse ? '#DC2626' : '#1D4ED8' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center', background: '#F8FAFC', borderRadius: 8, padding: '6px 4px' }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: s.color, margin: '0 0 1px' }}>{s.val}</p>
                    <p style={{ fontSize: 9, color: '#94A3B8', margin: 0 }}>{s.label}</p>
                  </div>
                ))}
              </div>

              <div style={{ background: '#F1F5F9', borderRadius: 4, height: 5, marginBottom: 5 }}>
                <div style={{ background: couleurBarre, borderRadius: 4, height: 5, width: `${Math.min(pct, 100)}%`, transition: 'width .3s' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 9, color: couleurBarre, fontWeight: 600 }}>{pct}% consommé</span>
                <span style={{ fontSize: 9, color: sol >= 0 ? '#065F46' : '#DC2626', fontWeight: 600 }}>Solde : {sol >= 0 ? '+' : ''}{fmt(sol)} FCFA</span>
              </div>

              {showAllouer === c.id ? (
                <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                  <input type="number" value={allouerMontant}
                    onChange={e => setAllouerMontant(e.target.value)}
                    placeholder="Montant à allouer (FCFA)"
                    style={{ flex: 1, border: '1px solid #E2E8F0', borderRadius: 8, padding: '6px 10px', fontSize: 12, outline: 'none', color: '#1E293B' }} />
                  <button type="button" onClick={() => { onSaveAllouer(c.id, parseInt(allouerMontant)); setShowAllouer(null); setAllouerMontant('') }}
                    style={{ background: VERT, color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>OK</button>
                  <button type="button" onClick={() => setShowAllouer(null)}
                    style={{ background: '#F1F5F9', color: '#64748B', border: 'none', borderRadius: 8, padding: '6px 10px', fontSize: 12, cursor: 'pointer' }}>✕</button>
                </div>
              ) : (
                <button type="button" onClick={e => { e.stopPropagation(); setShowAllouer(c.id); setAllouerMontant(String(alloue || '')) }}
                  style={{ background: 'transparent', color: VERT, border: `1px solid ${VERT}`, borderRadius: 8, padding: '5px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                  Modifier l'allocation
                </button>
              )}

              <p style={{ fontSize: 10, color: '#CBD5E1', margin: '8px 0 0', textAlign: 'center' }}>
                Appuyer pour voir les dépenses →
              </p>
            </div>
          )
        })}
        {commissions.length === 0 && (
          <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '20px', margin: 0 }}>Aucune commission.</p>
        )}
      </div>

      {ficheOuverte && (
        <FicheCommission
          commission={ficheOuverte}
          depenses={depenses}
          onClose={() => setFicheOuverte(null)}
        />
      )}
    </>
  )
}
