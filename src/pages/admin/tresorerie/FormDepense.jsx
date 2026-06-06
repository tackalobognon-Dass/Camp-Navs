import { iS, lS, VERT } from './utils'

export default function FormDepense({ form, onChange, onSave, onCancel, saving, commissions }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: 14, marginBottom: 12 }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', margin: '0 0 12px' }}>
        {form._editId ? 'Modifier la dépense' : 'Nouvelle dépense'}
      </p>

      <div style={{ marginBottom: 8 }}>
        <label className={lS}>Commission *</label>
        <select value={form.commission_id} onChange={e => onChange('commission_id', e.target.value)} className={iS}>
          <option value="">Sélectionner une commission</option>
          {commissions.map(c => <option key={c.id} value={c.id}>{c.nom_commission}</option>)}
        </select>
      </div>

      <div style={{ marginBottom: 8 }}>
        <label className={lS}>Description *</label>
        <input type="text" value={form.description}
          onChange={e => onChange('description', e.target.value)}
          placeholder="Ex : Achat de vivres, Location sono..."
          className={iS} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <div>
          <label className={lS}>Montant (FCFA) *</label>
          <input type="number" value={form.montant}
            onChange={e => onChange('montant', e.target.value)} className={iS} />
        </div>
        <div>
          <label className={lS}>Date</label>
          <input type="date" value={form.date_depense}
            onChange={e => onChange('date_depense', e.target.value)} className={iS} />
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label className={lS}>Numéro de reçu / Justificatif</label>
        <input type="text" value={form.justificatif}
          onChange={e => onChange('justificatif', e.target.value)}
          placeholder="Ex : Reçu n°001, Facture SODECI..."
          className={iS} />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={onCancel}
          style={{ flex: 1, background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 10, padding: 10, fontSize: 13, cursor: 'pointer' }}>
          Annuler
        </button>
        <button type="button" onClick={onSave} disabled={saving}
          style={{ flex: 1, background: VERT, color: '#fff', border: 'none', borderRadius: 10, padding: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
          {saving ? '...' : form._editId ? 'Modifier' : 'Ajouter'}
        </button>
      </div>
    </div>
  )
}
