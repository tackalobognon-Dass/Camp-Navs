import { fmt, getTypeRecette } from './utils'

export function exportExcelTresorerie(recettes, commissions, depenses) {
  const now = new Date().toLocaleDateString('fr-FR')
  const totalR = recettes.reduce((s, r) => s + (r.montant || 0), 0)
  const totalD = depenses.reduce((s, d) => s + (d.montant || 0), 0)
  const lignes = [
    ['RAPPORT FINANCIER — CAMP-NAVS 2026'], [`Exporté le ${now}`], [],
    ['=== RECETTES ==='], ['Type', 'Description', 'Donateur', 'Montant', 'Date'],
    ...recettes.map(r => [
      getTypeRecette(r.type).label, r.description || '', r.donateur || '',
      r.montant || 0, new Date(r.date_reception).toLocaleDateString('fr-FR'),
    ]),
    [], ['Total recettes', '', '', totalR], [],
    ['=== DÉPENSES ==='], ['Commission', 'Description', 'Montant', 'Date'],
    ...depenses.map(d => [
      d.nom_commission || '', d.description || '',
      d.montant || 0, new Date(d.date_depense).toLocaleDateString('fr-FR'),
    ]),
    [], ['Total dépenses', '', '', totalD], [],
    ['=== RÉSUMÉ ==='],
    ['Total recettes', `${fmt(totalR)} FCFA`],
    ['Total dépenses', `${fmt(totalD)} FCFA`],
    ['Solde', `${fmt(totalR - totalD)} FCFA`],
  ]
  const csv = '\uFEFF' + lignes.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Tresorerie_CampNavs2026_${now.replace(/\//g, '-')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
