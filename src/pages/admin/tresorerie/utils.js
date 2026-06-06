export const VERT = '#1B3B2B'
export const VERT_CLAIR = '#E8F5E8'
export const LIMIT = 50

export const TYPES_RECETTE = [
  { key: 'frais_participation', label: 'Frais de participation' },
  { key: 'apport_exterieur',    label: 'Apport extérieur (hors Navigateurs)' },
  { key: 'apport_interieur',    label: 'Apport intérieur (Navigateurs)' },
  { key: 'subvention',          label: 'Subvention du ministère' },
  { key: 'vente_tshirt',        label: 'Vente T-shirts & gadgets' },
  { key: 'solde_anterieur',     label: 'Solde camp antérieur' },
  { key: 'autre',               label: 'Autre revenu' },
]

export const STATUTS_SUBVENTION = ['demandée', 'accordée', 'reçue']
export const UNITES = ['kg', 'litres', 'cartons', 'sacs', 'boîtes', 'pièces', 'unités']
export const STATUTS_DON = ['promis', 'partiellement reçu', 'reçu']

export function getTypeRecette(key) {
  return TYPES_RECETTE.find(t => t.key === key) || TYPES_RECETTE[6]
}

export function fmt(n) {
  return String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

export function filtrerParDate(items, dateKey, filtre) {
  if (filtre === 'tout') return items
  const debut = new Date()
  if (filtre === 'semaine') debut.setDate(debut.getDate() - 7)
  if (filtre === 'mois') { debut.setDate(1); debut.setHours(0, 0, 0, 0) }
  return items.filter(i => new Date(i[dateKey]) >= debut)
}

export function estAujourdhui(dateStr) {
  const d = new Date(dateStr), n = new Date()
  return d.getDate() === n.getDate() && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear()
}

// Une subvention ne compte dans les recettes que si elle est accordée ou reçue
export function montantRecetteEffectif(r) {
  if (r.type === 'subvention' && r.statut_recette === 'demandée') return 0
  return r.montant || 0
}

export const iS = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400'
export const lS = 'block text-xs text-gray-500 mb-1'

export const EMPTY_R = {
  type: 'frais_participation', description: '', montant: '', donateur: '',
  date_reception: new Date().toISOString().split('T')[0],
  statut_recette: '', quantite: '', prix_unitaire: '',
}
export const EMPTY_D = {
  commission_id: '', description: '', montant: '',
  date_depense: new Date().toISOString().split('T')[0], justificatif: '',
}
export const EMPTY_DN = {
  designation: '', quantite: '', unite: 'kg', valeur_estimee: '',
  donateur: '', type_donateur: 'exterieur', commission_id: '',
  statut: 'promis', date_reception: new Date().toISOString().split('T')[0],
}
export const EMPTY_C = { nom_commission: '', budget_previsionnel: '' }

export function commStats(c, depenses) {
  const dep = depenses.filter(d => d.commission_id === c.id).reduce((s, d) => s + d.montant, 0)
  const alloue = c.montant_alloue || 0
  const pct = alloue > 0 ? Math.round((dep / alloue) * 100) : 0
  const depasse = dep > alloue && alloue > 0
  const warning = pct >= 80 && !depasse
  const couleurBarre = depasse ? '#DC2626' : warning ? '#D97706' : '#065F46'
  return { dep, alloue, sol: alloue - dep, pct, depasse, warning, couleurBarre }
}
