import { fmt, VERT } from '../utils'

export default function OngletHistorique({ historique, totalRecettes, totalDepenses }) {
  return (
    <>
      <div style={{ position: 'sticky', top: 0, background: '#F8FAFC', zIndex: 5, paddingBottom: 12, paddingTop: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', margin: 0 }}>
            RELEVÉ ({historique.length})
          </p>
          <div style={{ display: 'flex', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#065F46', background: '#ECFDF5', borderRadius: 20, padding: '2px 10px' }}>+{fmt(totalRecettes)}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#DC2626', background: '#FEF2F2', borderRadius: 20, padding: '2px 10px' }}>-{fmt(totalDepenses)}</span>
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        {historique.length === 0
          ? <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '20px', margin: 0 }}>Aucune transaction.</p>
          : historique.map((tx, i) => {
            const isR = tx._type === 'recette'
            return (
              <div key={`${tx._type}-${tx.id}`}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: i < historique.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: isR ? '#ECFDF5' : '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: isR ? '#065F46' : '#DC2626', lineHeight: 1 }}>{isR ? '+' : '−'}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', margin: '0 0 1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {tx._label}
                  </p>
                  <p style={{ fontSize: 10, color: '#94A3B8', margin: 0 }}>
                    {tx._sub && `${tx._sub} · `}
                    {new Date(tx._date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: isR ? '#065F46' : '#DC2626', margin: 0, flexShrink: 0 }}>
                  {isR ? '+' : '-'}{fmt(tx._montant)}
                </p>
              </div>
            )
          })
        }
      </div>
    </>
  )
}
