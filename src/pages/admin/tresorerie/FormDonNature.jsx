import { UNITES, STATUTS_DON, iS, lS, VERT } from './utils'

export default function FormDonNature({ form, onChange, onSave, onCancel, saving, commissions }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: 14, marginBottom: 12 }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', margin: '0 0 12px' }}>
        {form._editId ? 'Modifier le don' : 'Nouveau don en nature'}
      </p>

      <div style={{ marginBottom: 8 }}>
        <label className={lS}>Désignation *</label>
        <input type="text" value={form.designation}
          onChange={e => onChange('designation', e.target.value)}
          placeholder="Ex : Riz, Huile, Poisson fumé, Eau minérale..."
          className={iS} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <div>
          <label className={lS}>Quantité *</label>
          <input type="number" value={form.quantite}
            onChange={e => onChange('quantite', e.target.value)} className={iS} />
        </div>
        <div>
          <label className={lS}>Unité</label>
          <select value={form.unite} onChange={e => onChange('unite', e.target.value)} className={iS}>
            {UNITES.map(u => <option key={u}>{u}</option>)}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 8 }}>
        <label className={lS}>Valeur estimée (FCFA)</label>
        <input type="number" value={form.valeur_estimee}
          onChange={e => onChange('valeur_estimee', e.target.value)}
          placeholder="Ex : 15000"
          className={iS} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <div>
          <label className={lS}>Donateur / Organisation</label>
          <input type="text" value={form.donateur}
            onChange={e => onChange('donateur', e.target.value)}
            placeholder="Ex : Famille BROU, Église XYZ"
            className={iS} />
        </div>
        <div>
          <label className={lS}>Type de donateur</label>
          <select value={form.type_donateur} onChange={e => onChange('type_donateur', e.target.value)} className={iS}>
            <option value="exterieur">Extérieur (hors Navs)</option>
            <option value="interieur">Intérieur (Navigateurs)</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
        <div>
          <label className={lS}>Commission bénéficiaire</label>
          <select value={form.commission_id} onChange={e => onChange('commission_id', e.target.value)} className={iS}>
            <option value="">-- Aucune --</option>
            {commissions.map(c => <option key={c.id} value={c.id}>{c.nom_commission}</option>)}
          </select>
        </div>
        <div>
          <label className={lS}>Statut</label>
          <select value={form.statut} onChange={e => onChange('statut', e.target.value)} className={iS}>
            {STATUTS_DON.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label className={lS}>Date de réception prévue</label>
        <input type="date" value={form.date_reception}
          onChange={e => onChange('date_reception', e.target.value)} className={iS} />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={onCancel}
          style={{ flex: 1, background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 10, padding: 10, fontSize: 13, cursor: 'pointer' }}>
          Annuler
        </button>
        <button type="button" onClick={onSave} disabled={saving}
          style={{ flex: 1, background: VERT, color: '#fff', border: 'none', borderRadius: 10, padding: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
          {saving ? '...' : form._editId ? 'Modifier' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}
