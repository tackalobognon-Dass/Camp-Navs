import { iS, lS, VERT } from './utils'

export default function FormCommission({ form, onChange, onSave, onCancel, saving }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: 14, marginBottom: 12 }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', margin: '0 0 12px' }}>Nouvelle commission</p>

      <div style={{ marginBottom: 8 }}>
        <label className={lS}>Nom de la commission *</label>
        <input type="text" value={form.nom_commission}
          onChange={e => onChange('nom_commission', e.target.value)}
          placeholder="Ex : Restauration, Logistique, Louange..."
          className={iS} />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label className={lS}>Budget prévisionnel (FCFA)</label>
        <input type="number" value={form.budget_previsionnel}
          onChange={e => onChange('budget_previsionnel', e.target.value)}
          placeholder="Ex : 150000"
          className={iS} />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={onCancel}
          style={{ flex: 1, background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 10, padding: 10, fontSize: 13, cursor: 'pointer' }}>
          Annuler
        </button>
        <button type="button" onClick={onSave} disabled={saving}
          style={{ flex: 1, background: VERT, color: '#fff', border: 'none', borderRadius: 10, padding: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
          {saving ? '...' : 'Ajouter'}
        </button>
      </div>
    </div>
  )
}
