import * as XLSX from 'xlsx'
import { fmt, getTypeRecette, TYPES_RECETTE, montantRecetteEffectif } from './utils'

export function exportExcelTresorerie(recettes, commissions, depenses, donsNature, budgetGlobal) {
  const wb = XLSX.utils.book_new()
  const now = new Date().toLocaleDateString('fr-FR')

  // ── Feuille 1 : Résumé ──
  const totalR = recettes.reduce((s, r) => s + montantRecetteEffectif(r), 0)
  const totalD = depenses.reduce((s, d) => s + (d.montant || 0), 0)
  const totalDN = donsNature.filter(d => d.statut === 'reçu').reduce((s, d) => s + (d.valeur_estimee || 0), 0)
  const subvAttendu = recettes.filter(r => r.type === 'subvention' && r.statut_recette === 'demandée').reduce((s, r) => s + (r.montant || 0), 0)

  const resume = [
    { 'Indicateur': 'Budget global (FCFA)',           'Valeur': budgetGlobal || 0 },
    { 'Indicateur': 'Total recettes effectives (FCFA)','Valeur': totalR },
    { 'Indicateur': 'Total dépenses (FCFA)',           'Valeur': totalD },
    { 'Indicateur': 'Solde disponible (FCFA)',         'Valeur': totalR - totalD },
    { 'Indicateur': 'Subvention en attente (FCFA)',    'Valeur': subvAttendu },
    { 'Indicateur': 'Dons en nature reçus (FCFA)',     'Valeur': totalDN },
    { 'Indicateur': '',                                'Valeur': '' },
    { 'Indicateur': 'Nombre de recettes',              'Valeur': recettes.length },
    { 'Indicateur': 'Nombre de dépenses',              'Valeur': depenses.length },
    { 'Indicateur': 'Nombre de commissions',           'Valeur': commissions.length },
    { 'Indicateur': 'Nombre de dons en nature',        'Valeur': donsNature.length },
    { 'Indicateur': '',                                'Valeur': '' },
    { 'Indicateur': 'Exporté le',                     'Valeur': now },
  ]

  // ── Feuille 2 : Recettes ──
  const dataRecettes = recettes.map(r => ({
    'Type':            getTypeRecette(r.type).label,
    'Description':     r.description || '',
    'Donateur':        r.donateur || '',
    'Montant (FCFA)':  r.montant || 0,
    'Effectif (FCFA)': montantRecetteEffectif(r),
    'Statut':          r.statut_recette || '',
    'Quantité':        r.quantite || '',
    'Prix unitaire':   r.prix_unitaire || '',
    'Date':            new Date(r.date_reception).toLocaleDateString('fr-FR'),
  }))

  // ── Feuille 3 : Dépenses ──
  const dataDepenses = depenses.map(d => ({
    'Commission':      d.nom_commission || '',
    'Description':     d.description || '',
    'Montant (FCFA)':  d.montant || 0,
    'Date':            new Date(d.date_depense).toLocaleDateString('fr-FR'),
    'Justificatif':    d.justificatif || '',
  }))

  // ── Feuille 4 : Dons en nature ──
  const dataDons = donsNature.map(d => ({
    'Désignation':       d.designation || '',
    'Quantité':          d.quantite || 0,
    'Unité':             d.unite || '',
    'Valeur estimée (FCFA)': d.valeur_estimee || 0,
    'Donateur':          d.donateur || '',
    'Type donateur':     d.type_donateur === 'interieur' ? 'Navigateurs' : 'Extérieur',
    'Commission':        commissions.find(c => c.id === d.commission_id)?.nom_commission || '',
    'Statut':            d.statut || '',
    'Date':              new Date(d.date_reception).toLocaleDateString('fr-FR'),
  }))

  // ── Feuille 5 : Commissions ──
  const dataCommissions = commissions.map(c => {
    const dep = depenses.filter(d => d.commission_id === c.id).reduce((s, d) => s + d.montant, 0)
    const donsRecus = donsNature.filter(d => d.commission_id === c.id && d.statut === 'reçu').reduce((s, d) => s + (d.valeur_estimee || 0), 0)
    const alloue = c.montant_alloue || 0
    return {
      'Commission':              c.nom_commission || '',
      'Budget prévu (FCFA)':    c.budget_previsionnel || 0,
      'Alloué (FCFA)':          alloue,
      'Dépensé (FCFA)':         dep,
      'Solde cash (FCFA)':      alloue - dep,
      'Dons nature reçus (FCFA)': donsRecus,
      'Couverture totale (FCFA)': alloue + donsRecus,
      'Dépassement':             dep > alloue && alloue > 0 ? 'OUI' : 'Non',
    }
  })

  // ── Créer les feuilles ──
  function makeSheet(data) {
    if (!data.length) return XLSX.utils.json_to_sheet([])
    const ws = XLSX.utils.json_to_sheet(data)
    ws['!cols'] = Object.keys(data[0]).map(k => ({
      wch: Math.max(...data.map(r => String(r[k] || '').length), k.length, 10)
    }))
    return ws
  }

  const wsResume = makeSheet(resume)
  const wsR      = makeSheet(dataRecettes)
  const wsD      = makeSheet(dataDepenses)
  const wsDN     = makeSheet(dataDons)
  const wsC      = makeSheet(dataCommissions)

  wsResume['!cols'] = [{ wch: 35 }, { wch: 20 }]

  XLSX.utils.book_append_sheet(wb, wsResume, 'Résumé')
  XLSX.utils.book_append_sheet(wb, wsR,      'Recettes')
  XLSX.utils.book_append_sheet(wb, wsD,      'Dépenses')
  XLSX.utils.book_append_sheet(wb, wsDN,     'Dons en nature')
  XLSX.utils.book_append_sheet(wb, wsC,      'Commissions')

  XLSX.writeFile(wb, `Tresorerie_CampNavs2026_${now.replace(/\//g, '-')}.xlsx`)
}
