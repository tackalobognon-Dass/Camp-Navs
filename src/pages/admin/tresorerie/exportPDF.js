import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { fmt, getTypeRecette, TYPES_RECETTE } from './utils'

export function exportPDFTresorerie(recettes, commissions, depenses, donsNature, budgetGlobal) {
  const doc = new jsPDF()
  const now = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const totalR = recettes.reduce((s, r) => s + (r.montant || 0), 0)
  const totalD = depenses.reduce((s, d) => s + (d.montant || 0), 0)
  const totalDN = donsNature.filter(d => d.statut === 'reçu').reduce((s, d) => s + (d.valeur_estimee || 0), 0)
  const taux = budgetGlobal > 0 ? Math.round((totalR / budgetGlobal) * 100) : 0
  const pw = doc.internal.pageSize.getWidth()

  // En-tête
  doc.setFillColor(27, 59, 43); doc.rect(0, 0, pw, 32, 'F')
  doc.setTextColor(255, 255, 255); doc.setFontSize(15); doc.setFont('helvetica', 'bold')
  doc.text('Rapport Financier — Camp-Navs 2026', 14, 13)
  doc.setFontSize(8); doc.setFont('helvetica', 'normal')
  doc.text("Mission Évangélique des Navigateurs — Côte d'Ivoire", 14, 20)
  doc.text(`Généré le ${now}`, 14, 26)

  let y = 40

  // Section 1 — Résumé
  doc.setTextColor(27, 59, 43); doc.setFontSize(11); doc.setFont('helvetica', 'bold')
  doc.text('1. RÉSUMÉ EXÉCUTIF', 14, y); y += 4
  autoTable(doc, {
    startY: y,
    head: [['Indicateur', 'Montant (FCFA)', 'Observation']],
    body: [
      ['Budget global', budgetGlobal > 0 ? `${fmt(budgetGlobal)} FCFA` : 'Non défini', ''],
      ['Total recettes', `${fmt(totalR)} FCFA`, `${taux}% du budget`],
      ['Total dépenses', `${fmt(totalD)} FCFA`, ''],
      ['Solde disponible', `${fmt(totalR - totalD)} FCFA`, totalR - totalD >= 0 ? 'Excédent' : 'Déficit'],
      ['Dons en nature reçus', `${fmt(totalDN)} FCFA`, `${donsNature.filter(d => d.statut === 'reçu').length} don(s)`],
    ],
    headStyles: { fillColor: [27, 59, 43], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 1: { halign: 'right' }, 2: { textColor: [100, 100, 100] } },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  })
  y = doc.lastAutoTable.finalY + 10

  // Section 2 — Recettes
  doc.setFontSize(11); doc.setFont('helvetica', 'bold')
  doc.text('2. RECETTES PAR SOURCE', 14, y); y += 4
  const parSource = TYPES_RECETTE.map(t => {
    const items = recettes.filter(r => r.type === t.key)
    return { label: t.label, total: items.reduce((s, r) => s + (r.montant || 0), 0), count: items.length }
  }).filter(t => t.total > 0)
  autoTable(doc, {
    startY: y,
    head: [['Source', 'Nb', 'Montant (FCFA)']],
    body: [
      ...parSource.map(t => [t.label, String(t.count), `${fmt(t.total)} FCFA`]),
      [{ content: 'TOTAL', styles: { fontStyle: 'bold' } }, { content: String(recettes.length), styles: { fontStyle: 'bold' } }, { content: `${fmt(totalR)} FCFA`, styles: { fontStyle: 'bold', textColor: [6, 95, 70] } }],
    ],
    headStyles: { fillColor: [6, 95, 70], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 1: { halign: 'center' }, 2: { halign: 'right' } },
    alternateRowStyles: { fillColor: [236, 253, 245] },
    margin: { left: 14, right: 14 },
  })
  y = doc.lastAutoTable.finalY + 10

  // Section 3 — Dons en nature
  if (donsNature.length > 0) {
    if (y > 230) { doc.addPage(); y = 20 }
    doc.setFontSize(11); doc.setFont('helvetica', 'bold')
    doc.text('3. DONS EN NATURE', 14, y); y += 4
    autoTable(doc, {
      startY: y,
      head: [['Désignation', 'Qté', 'Donateur', 'Valeur est.', 'Statut']],
      body: donsNature.map(d => [d.designation, `${d.quantite} ${d.unite || ''}`, d.donateur || '-', `${fmt(d.valeur_estimee || 0)} FCFA`, d.statut || '-']),
      headStyles: { fillColor: [109, 40, 217], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      columnStyles: { 3: { halign: 'right' } },
      alternateRowStyles: { fillColor: [245, 243, 255] },
      margin: { left: 14, right: 14 },
    })
    y = doc.lastAutoTable.finalY + 10
  }

  // Section 4 — Dépenses par commission
  const sN = donsNature.length > 0 ? '4' : '3'
  if (y > 230) { doc.addPage(); y = 20 }
  doc.setFontSize(11); doc.setFont('helvetica', 'bold')
  doc.text(`${sN}. DÉPENSES PAR COMMISSION`, 14, y); y += 4

  for (const c of commissions) {
    const deps = depenses.filter(d => d.commission_id === c.id)
    const totalDep = deps.reduce((s, d) => s + d.montant, 0)
    const alloue = c.montant_alloue || 0
    const sol = alloue - totalDep
    const depasse = totalDep > alloue && alloue > 0
    if (y > 240) { doc.addPage(); y = 20 }
    doc.setFontSize(9); doc.setFont('helvetica', 'bold')
    doc.setTextColor(depasse ? 192 : 27, depasse ? 38 : 59, depasse ? 38 : 43)
    doc.text(`  ${c.nom_commission}${depasse ? '  ⚠ DÉPASSEMENT : +' + fmt(totalDep - alloue) + ' FCFA' : ''}`, 14, y); y += 4
    autoTable(doc, {
      startY: y,
      head: [['Budget prévu', 'Alloué', 'Dépensé', 'Solde']],
      body: [[`${fmt(c.budget_previsionnel || 0)} FCFA`, `${fmt(alloue)} FCFA`, `${fmt(totalDep)} FCFA`,
        { content: `${sol >= 0 ? '+' : ''}${fmt(sol)} FCFA`, styles: { textColor: sol < 0 ? [220, 38, 38] : [6, 95, 70], fontStyle: 'bold' } }]],
      headStyles: { fillColor: depasse ? [220, 38, 38] : [30, 78, 216], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' } },
      margin: { left: 14, right: 14 },
    })
    y = doc.lastAutoTable.finalY + 3
    if (deps.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Description', 'Montant', 'Date', 'Justificatif']],
        body: deps.map(d => [d.description || '-', `${fmt(d.montant)} FCFA`, new Date(d.date_depense).toLocaleDateString('fr-FR'), d.justificatif || '-']),
        headStyles: { fillColor: [71, 85, 105], fontSize: 7 },
        bodyStyles: { fontSize: 7 },
        columnStyles: { 1: { halign: 'right' } },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 20, right: 14 },
      })
      y = doc.lastAutoTable.finalY + 8
    } else {
      doc.setFontSize(7); doc.setTextColor(148, 163, 184); doc.setFont('helvetica', 'italic')
      doc.text('  Aucune dépense.', 20, y); y += 8
    }
  }

  // Dépassements
  const depassements = commissions.filter(c => {
    const d = depenses.filter(x => x.commission_id === c.id).reduce((s, x) => s + x.montant, 0)
    return d > (c.montant_alloue || 0) && (c.montant_alloue || 0) > 0
  })
  if (depassements.length > 0) {
    if (y > 230) { doc.addPage(); y = 20 }
    doc.setTextColor(220, 38, 38); doc.setFontSize(11); doc.setFont('helvetica', 'bold')
    doc.text(`${parseInt(sN) + 1}. DÉPASSEMENTS`, 14, y); y += 4
    autoTable(doc, {
      startY: y,
      head: [['Commission', 'Alloué', 'Dépensé', 'Dépassement']],
      body: depassements.map(c => {
        const d = depenses.filter(x => x.commission_id === c.id).reduce((s, x) => s + x.montant, 0)
        return [c.nom_commission, `${fmt(c.montant_alloue || 0)} FCFA`, `${fmt(d)} FCFA`, `+${fmt(d - (c.montant_alloue || 0))} FCFA`]
      }),
      headStyles: { fillColor: [220, 38, 38], fontSize: 9 },
      bodyStyles: { fontSize: 9, textColor: [220, 38, 38] },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right', fontStyle: 'bold' } },
      margin: { left: 14, right: 14 },
    })
  }

  // Cadre officiel
  const pH = doc.internal.pageSize.getHeight()
  const cy = pH - 55
  doc.setPage(doc.internal.getNumberOfPages())
  doc.setDrawColor(27, 59, 43); doc.setLineWidth(0.5); doc.rect(14, cy, pw - 28, 40)
  doc.setFillColor(27, 59, 43); doc.rect(14, cy, pw - 28, 7, 'F')
  doc.setTextColor(255, 255, 255); doc.setFontSize(8); doc.setFont('helvetica', 'bold')
  doc.text('CERTIFICATION DU TRÉSORIER', 16, cy + 5)
  doc.setTextColor(27, 59, 43); doc.setFontSize(8); doc.setFont('helvetica', 'normal')
  const c1 = 18, c2 = pw / 2 + 5
  doc.text('Établi par :', c1, cy + 13); doc.line(c1 + 22, cy + 13, c2 - 5, cy + 13)
  doc.text('Fonction : Trésorier', c2, cy + 13)
  doc.text('Date :', c1, cy + 22); doc.line(c1 + 14, cy + 22, c2 - 5, cy + 22)
  doc.text('Signature :', c2, cy + 22); doc.line(c2 + 22, cy + 22, pw - 16, cy + 22)
  doc.setFontSize(7); doc.setTextColor(100, 116, 139)
  doc.text(`Camp-Navs 2026 · Mission Évangélique des Navigateurs CI · ${now}`, pw / 2, cy + 33, { align: 'center' })
  doc.save(`Rapport_Tresorerie_CampNavs2026_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.pdf`)
}
