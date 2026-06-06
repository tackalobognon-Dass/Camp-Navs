import { fmt, VERT, VERT_CLAIR, filtrerParDate, commStats } from '../utils'

function LigneDepense({ d, onEdit, onDelete, isLast, showComm = true }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderBottom: isLast ? 'none' : '1px solid #F1F5F9' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#DC2626" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 500, color: '#1E293B', margin: '0 0 1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.description}</p>
        <p style={{ fontSize: 10, color: '#94A3B8', margin: 0 }}>
          {showComm && d.nom_commission && `${d.nom_commission} · `}
          {new Date(d.date_depense).toLocaleDateString('fr-FR')}
          {d.justificatif && ` · ${d.justificatif}`}
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#DC2626', margin: 0 }}>{fmt(d.montant)}</p>
        <button type="button" onClick={() => onEdit(d)}
          style={{ width: 24, height: 24, borderRadius: 7, background: VERT_CLAIR, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke={VERT} strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
        </button>
        <button type="button" onClick={() => onDelete(d.id)}
          style={{ width: 24, height: 24, borderRadius: 7, background: '#FEF2F2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="#DC2626" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </button>
      </div>
    </div>
  )
}

export default function OngletDepenses({
  depenses, commissions, showForm, onToggleForm,
  filtreDateD, onChangeFiltre, vueDepenses, onChangeVue,
  onEdit, onDelete, hasMoreD, onLoadMore, loadingMore,
  FormDepense, formProps,
}) {
  const dateChipS = (a) => ({
    flexShrink: 0, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500,
    cursor: 'pointer', border: `1px solid ${a ? '#1D4ED8' : '#E2E8F0'}`,
    background: a ? '#EFF6FF' : '#fff', color: a ? '#1D4ED8' : '#64748B',
  })
  const filtrees = filtrerParDate(depenses, 'date_depense', filtreDateD)

  return (
    <>
      <div style={{ position: 'sticky', top: 0, background: '#F8FAFC', zIndex: 2, paddingTop: 12, paddingBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {[{ k: 'tout', l: 'Tout' }, { k: 'mois', l: 'Ce mois' }, { k: 'semaine', l: 'Cette semaine' }].map(f => (
              <button key={f.k} type="button" onClick={() => onChangeFiltre(f.k)} style={dateChipS(filtreDateD === f.k)}>{f.l}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 8 }}>
            <button type="button" onClick={() => onChangeVue(vueDepenses === 'liste' ? 'groupee' : 'liste')}
              style={{ fontSize: 10, fontWeight: 600, color: VERT, background: VERT_CLAIR, border: `1px solid ${VERT}`, borderRadius: 20, padding: '4px 10px', cursor: 'pointer' }}>
              {vueDepenses === 'liste' ? 'Par commission' : 'Chronologique'}
            </button>
            <button type="button" onClick={onToggleForm}
              style={{ width: 30, height: 30, borderRadius: '50%', background: showForm ? '#FEF2F2' : VERT, color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 300 }}>
              {showForm ? '×' : '+'}
            </button>
          </div>
        </div>
      </div>

      {showForm && <FormDepense {...formProps} commissions={commissions} />}

      {/* Vue chronologique */}
      {vueDepenses === 'liste' && (
        <>
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            {filtrees.length === 0
              ? <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '20px', margin: 0 }}>Aucune dépense.</p>
              : filtrees.map((d, i) => (
                <LigneDepense key={d.id} d={d} onEdit={onEdit} onDelete={onDelete} isLast={i === filtrees.length - 1} />
              ))
            }
          </div>
          {hasMoreD && filtreDateD === 'tout' && (
            <button type="button" onClick={onLoadMore} disabled={loadingMore}
              style={{ width: '100%', marginTop: 10, background: '#fff', color: VERT, border: `1px solid ${VERT}`, borderRadius: 10, padding: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: loadingMore ? 0.7 : 1 }}>
              {loadingMore ? 'Chargement...' : 'Charger plus'}
            </button>
          )}
        </>
      )}

      {/* Vue groupée par commission */}
      {vueDepenses === 'groupee' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {commissions.map(c => {
            const deps = filtrerParDate(depenses.filter(d => d.commission_id === c.id), 'date_depense', filtreDateD)
            const { dep, alloue, sol, depasse, couleurBarre, pct } = commStats(c, depenses)
            return (
              <div key={c.id} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${depasse ? '#FCA5A5' : '#E2E8F0'}`, overflow: 'hidden' }}>
                <div style={{ padding: '10px 14px', background: depasse ? '#FEF2F2' : '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', margin: 0 }}>{c.nom_commission}</p>
                      {depasse && <span style={{ fontSize: 9, fontWeight: 700, background: '#FEF2F2', color: '#DC2626', borderRadius: 20, padding: '2px 7px' }}>⚠</span>}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: sol >= 0 ? '#065F46' : '#DC2626' }}>{sol >= 0 ? '+' : ''}{fmt(sol)} FCFA</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 5 }}>
                    <span style={{ fontSize: 10, color: '#94A3B8' }}>Alloué : <strong style={{ color: VERT }}>{fmt(alloue)}</strong></span>
                    <span style={{ fontSize: 10, color: '#94A3B8' }}>Dépensé : <strong style={{ color: depasse ? '#DC2626' : '#1D4ED8' }}>{fmt(dep)}</strong></span>
                    <span style={{ fontSize: 10, color: '#94A3B8' }}>{pct}%</span>
                  </div>
                  <div style={{ background: '#E2E8F0', borderRadius: 4, height: 3 }}>
                    <div style={{ background: couleurBarre, borderRadius: 4, height: 3, width: `${Math.min(pct, 100)}%` }} />
                  </div>
                </div>
                {deps.length === 0
                  ? <p style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center', padding: '12px', margin: 0 }}>Aucune dépense.</p>
                  : deps.map((d, i) => (
                    <LigneDepense key={d.id} d={d} onEdit={onEdit} onDelete={onDelete} isLast={i === deps.length - 1} showComm={false} />
                  ))
                }
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
