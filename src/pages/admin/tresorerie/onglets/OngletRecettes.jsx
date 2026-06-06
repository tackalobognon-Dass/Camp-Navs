import { fmt, VERT, VERT_CLAIR, getTypeRecette, filtrerParDate } from '../utils'

function LigneRecette({ r, onEdit, onDelete, isLast }) {
  const t = getTypeRecette(r.type)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderBottom: isLast ? 'none' : '1px solid #F1F5F9' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#065F46" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 1v8m0 0v1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 500, color: '#1E293B', margin: '0 0 1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {r.description || t.label}
        </p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, color: '#94A3B8' }}>
            {r.donateur && `${r.donateur} · `}
            {new Date(r.date_reception).toLocaleDateString('fr-FR')}
          </span>
          {r.statut_recette && (
            <span style={{ fontSize: 9, fontWeight: 600, background: '#FFFBEB', color: '#92400E', borderRadius: 20, padding: '1px 6px' }}>
              {r.statut_recette}
            </span>
          )}
          {r.quantite && r.prix_unitaire && (
            <span style={{ fontSize: 9, color: '#94A3B8' }}>{r.quantite} × {fmt(r.prix_unitaire)} FCFA</span>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: r.type === 'subvention' && r.statut_recette === 'demandée' ? '#D97706' : '#065F46', margin: 0 }}>
          {fmt(r.montant || 0)}
        </p>
        <button type="button" onClick={() => onEdit(r)}
          style={{ width: 24, height: 24, borderRadius: 7, background: VERT_CLAIR, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke={VERT} strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
        </button>
        <button type="button" onClick={() => onDelete(r.id)}
          style={{ width: 24, height: 24, borderRadius: 7, background: '#FEF2F2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="#DC2626" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </button>
      </div>
    </div>
  )
}

export default function OngletRecettes({
  recettes, showForm, onToggleForm, filtreDateR, onChangeFiltre,
  onEdit, onDelete, hasMoreR, onLoadMore, loadingMore,
  FormRecette, formProps,
}) {
  const dateChipS = (a) => ({
    flexShrink: 0, padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500,
    cursor: 'pointer', border: `1px solid ${a ? '#1D4ED8' : '#E2E8F0'}`,
    background: a ? '#EFF6FF' : '#fff', color: a ? '#1D4ED8' : '#64748B',
  })
  const filtrees = filtrerParDate(recettes, 'date_reception', filtreDateR)

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {[{ k: 'tout', l: 'Tout' }, { k: 'mois', l: 'Ce mois' }, { k: 'semaine', l: 'Cette semaine' }].map(f => (
            <button key={f.k} type="button" onClick={() => onChangeFiltre(f.k)} style={dateChipS(filtreDateR === f.k)}>{f.l}</button>
          ))}
        </div>
        <button type="button" onClick={onToggleForm}
          style={{ width: 30, height: 30, borderRadius: '50%', background: showForm ? '#FEF2F2' : VERT, color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 300, flexShrink: 0, marginLeft: 8 }}>
          {showForm ? '×' : '+'}
        </button>
      </div>

      {showForm && <FormRecette {...formProps} />}

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        {filtrees.length === 0
          ? <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '20px', margin: 0 }}>Aucune recette.</p>
          : filtrees.map((r, i) => (
            <LigneRecette key={r.id} r={r} onEdit={onEdit} onDelete={onDelete} isLast={i === filtrees.length - 1} />
          ))
        }
      </div>

      {hasMoreR && filtreDateR === 'tout' && (
        <button type="button" onClick={onLoadMore} disabled={loadingMore}
          style={{ width: '100%', marginTop: 10, background: '#fff', color: VERT, border: `1px solid ${VERT}`, borderRadius: 10, padding: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: loadingMore ? 0.7 : 1 }}>
          {loadingMore ? 'Chargement...' : 'Charger plus'}
        </button>
      )}
    </>
  )
}
