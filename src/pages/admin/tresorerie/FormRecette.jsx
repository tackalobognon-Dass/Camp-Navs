import { TYPES_RECETTE, STATUTS_SUBVENTION, iS, lS, VERT, VERT_CLAIR } from './utils'

const placeholders = {
  frais_participation: { desc: 'Ex : Paiement inscriptions adultes', donateur: 'Ex : Groupe Jeunes' },
  apport_exterieur:    { desc: 'Ex : Don de soutien au camp', donateur: 'Ex : Famille KOUASSI' },
  apport_interieur:    { desc: 'Ex : Contribution membres Navigateurs', donateur: 'Ex : Frère KOFFI Ange' },
  subvention:          { desc: 'Subvention Navs-CI', donateur: 'Ex : Navigateurs CI' },
  vente_tshirt:        { desc: 'Ex : T-shirts taille M', acheteur: 'Ex : Groupe Getsémani' },
  solde_anterieur:     { desc: 'Solde du camp 2025', donateur: '' },
  autre:               { desc: 'Ex : Collecte culte du dimanche', source: 'Ex : Collecte, Vente...' },
}

export default function FormRecette({ form, onChange, onSave, onCancel, saving }) {
  const ph = placeholders[form.type] || placeholders.autre
  const isVente = form.type === 'vente_tshirt'
  const isSolde = form.type === 'solde_anterieur'
  const isSubvention = form.type === 'subvention'
  const isAutre = form.type === 'autre'

  const montantCalcule = isVente && form.quantite && form.prix_unitaire
    ? parseInt(form.quantite || 0) * parseInt(form.prix_unitaire || 0)
    : null

  return (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: 14, marginBottom: 12 }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', margin: '0 0 12px' }}>
        {form._editId ? 'Modifier la recette' : 'Nouvelle recette'}
      </p>

      <div style={{ marginBottom: 8 }}>
        <label className={lS}>Source *</label>
        <select value={form.type} onChange={e => onChange('type', e.target.value)} className={iS}>
          {TYPES_RECETTE.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
        </select>
      </div>

      <div style={{ marginBottom: 8 }}>
        <label className={lS}>Description</label>
        <input type="text" value={form.description}
          onChange={e => onChange('description', e.target.value)}
          placeholder={ph.desc} className={iS} />
      </div>

      {isVente ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
          <div>
            <label className={lS}>Quantité</label>
            <input type="number" value={form.quantite}
              onChange={e => onChange('quantite', e.target.value)} className={iS} />
          </div>
          <div>
            <label className={lS}>Prix unitaire (FCFA)</label>
            <input type="number" value={form.prix_unitaire}
              onChange={e => onChange('prix_unitaire', e.target.value)} className={iS} />
          </div>
          {montantCalcule !== null && (
            <div style={{ gridColumn: '1/-1' }}>
              <label className={lS}>Total calculé</label>
              <input type="text" value={`${montantCalcule.toLocaleString()} FCFA`} readOnly
                className={iS} style={{ background: '#F8FAFC', color: '#065F46', fontWeight: 600 }} />
            </div>
          )}
        </div>
      ) : (
        <div style={{ marginBottom: 8 }}>
          <label className={lS}>Montant (FCFA) *</label>
          <input type="number" value={form.montant}
            onChange={e => onChange('montant', e.target.value)} className={iS} />
        </div>
      )}

      {isSubvention && (
        <div style={{ marginBottom: 8 }}>
          <label className={lS}>Statut de la subvention</label>
          <select value={form.statut_recette} onChange={e => onChange('statut_recette', e.target.value)} className={iS}>
            <option value="">-- Sélectionner --</option>
            {STATUTS_SUBVENTION.map(s => <option key={s}>{s}</option>)}
          </select>
          <p style={{ fontSize: 10, color: '#D97706', margin: '4px 0 0' }}>
            ⚠ Seules les subventions « accordée » ou « reçue » sont comptées dans les recettes.
          </p>
        </div>
      )}

      {!isSolde && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          <div>
            <label className={lS}>{isVente ? 'Acheteur' : isAutre ? 'Source du revenu' : 'Donateur'}</label>
            <input type="text" value={form.donateur}
              onChange={e => onChange('donateur', e.target.value)}
              placeholder={isVente ? ph.acheteur : isAutre ? ph.source : ph.donateur}
              className={iS} />
          </div>
          <div>
            <label className={lS}>Date</label>
            <input type="date" value={form.date_reception}
              onChange={e => onChange('date_reception', e.target.value)} className={iS} />
          </div>
        </div>
      )}

      {isSolde && (
        <div style={{ marginBottom: 12 }}>
          <label className={lS}>Date</label>
          <input type="date" value={form.date_reception}
            onChange={e => onChange('date_reception', e.target.value)} className={iS} />
        </div>
      )}

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
