import { fmt, VERT, VERT_CLAIR } from '../utils'

export default function OngletDonsNature({
  donsNature, commissions, showForm, onToggleForm,
  onEdit, onDelete, FormDonNature, formProps,
}) {
  const totalRecu = donsNature.filter(d => d.statut === 'reçu').reduce((s, d) => s + (d.valeur_estimee || 0), 0)

  const statutConfig = {
    'promis':              { bg: '#FFFBEB', color: '#92400E' },
    'partiellement reçu':  { bg: '#EFF6FF', color: '#1D4ED8' },
    'reçu':                { bg: '#ECFDF5', color: '#065F46' },
  }

  return (
    <>
      <div style={{ position: 'sticky', top: 0, background: '#F8FAFC', zIndex: 5, paddingBottom: 12, paddingTop: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', margin: 0 }}>
              DONS EN NATURE ({donsNature.length})
            </p>
            <p style={{ fontSize: 10, color: '#94A3B8', margin: '2px 0 0' }}>
              Valeur reçue : {fmt(totalRecu)} FCFA
            </p>
          </div>
          <button type="button" onClick={onToggleForm}
            style={{ width: 30, height: 30, borderRadius: '50%', background: showForm ? '#FEF2F2' : VERT, color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 300 }}>
            {showForm ? '×' : '+'}
          </button>
        </div>
      </div>

      {showForm && <FormDonNature {...formProps} commissions={commissions} />}

      {/* Compteurs statut */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 12 }}>
        {[
          { label: 'Promis', count: donsNature.filter(d => d.statut === 'promis').length, color: '#92400E', bg: '#FFFBEB', border: '#FCD34D' },
          { label: 'Partiel', count: donsNature.filter(d => d.statut === 'partiellement reçu').length, color: '#1D4ED8', bg: '#EFF6FF', border: '#93C5FD' },
          { label: 'Reçus', count: donsNature.filter(d => d.statut === 'reçu').length, color: '#065F46', bg: '#ECFDF5', border: '#6EE7B7' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: '8px', textAlign: 'center' }}>
            <p style={{ fontSize: 20, fontWeight: 700, color: s.color, margin: '0 0 2px' }}>{s.count}</p>
            <p style={{ fontSize: 9, color: s.color, margin: 0, opacity: 0.7 }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        {donsNature.length === 0 && (
          <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '20px', margin: 0 }}>
            Aucun don en nature enregistré.
          </p>
        )}
        {donsNature.map((d, i) => {
          const sc = statutConfig[d.statut] || { bg: '#F8FAFC', color: '#475569' }
          const commNom = commissions.find(c => c.id === d.commission_id)?.nom_commission
          return (
            <div key={d.id} style={{ padding: '10px 14px', borderBottom: i < donsNature.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 3 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', margin: 0 }}>{d.designation}</p>
                    <span style={{ fontSize: 9, fontWeight: 700, background: sc.bg, color: sc.color, borderRadius: 20, padding: '2px 8px' }}>
                      {d.statut}
                    </span>
                    {d.type_donateur === 'interieur' && (
                      <span style={{ fontSize: 9, background: VERT_CLAIR, color: VERT, borderRadius: 20, padding: '2px 7px', fontWeight: 600 }}>Navs</span>
                    )}
                  </div>
                  <p style={{ fontSize: 11, color: '#94A3B8', margin: 0 }}>
                    {d.quantite} {d.unite}
                    {d.donateur && ` · ${d.donateur}`}
                    {d.valeur_estimee > 0 && ` · ~${fmt(d.valeur_estimee)} FCFA`}
                  </p>
                  {commNom && (
                    <p style={{ fontSize: 10, color: '#6D28D9', margin: '2px 0 0' }}>→ {commNom}</p>
                  )}
                  <p style={{ fontSize: 10, color: '#CBD5E1', margin: '2px 0 0' }}>
                    {new Date(d.date_reception).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
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
            </div>
          )
        })}
      </div>
    </>
  )
}
