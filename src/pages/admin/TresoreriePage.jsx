import { useEffect, useState, useMemo, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/admin/AdminLayout'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const VERT = '#1B3B2B'
const VERT_CLAIR = '#E8F5E8'

function fmt(n) {
  return String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

const TYPES_RECETTE = [
  { key: 'frais_participation', label: 'Frais de participation' },
  { key: 'apport_exterieur',    label: 'Apport extérieur (hors Navigateurs)' },
  { key: 'apport_interieur',    label: 'Apport intérieur (Navigateurs)' },
  { key: 'subvention',          label: 'Subvention du ministère' },
  { key: 'vente_tshirt',        label: 'Vente T-shirts & gadgets' },
  { key: 'solde_anterieur',     label: 'Solde camp antérieur' },
  { key: 'autre',               label: 'Autre revenu' },
]
const STATUTS_SUBVENTION = ['demandée', 'accordée', 'reçue']
const UNITES = ['kg', 'litres', 'cartons', 'sacs', 'boîtes', 'pièces', 'unités']
const STATUTS_DON = ['promis', 'partiellement reçu', 'reçu']
const LIMIT = 50

function getTypeRecette(key) { return TYPES_RECETTE.find(t => t.key === key) || TYPES_RECETTE[6] }

function filtrerParDate(items, dateKey, filtre) {
  if (filtre === 'tout') return items
  const debut = new Date()
  if (filtre === 'semaine') debut.setDate(debut.getDate() - 7)
  if (filtre === 'mois') { debut.setDate(1); debut.setHours(0, 0, 0, 0) }
  return items.filter(i => new Date(i[dateKey]) >= debut)
}

function estAujourdhui(dateStr) {
  const d = new Date(dateStr), n = new Date()
  return d.getDate()===n.getDate() && d.getMonth()===n.getMonth() && d.getFullYear()===n.getFullYear()
}

function exportPDFTresorerie(recettes, commissions, depenses, donsNature, budgetGlobal) {
  const doc = new jsPDF()
  const now = new Date().toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' })
  const totalR = recettes.reduce((s,r)=>s+(r.montant||0),0)
  const totalD = depenses.reduce((s,d)=>s+(d.montant||0),0)
  const totalDN = donsNature.filter(d=>d.statut==='reçu').reduce((s,d)=>s+(d.valeur_estimee||0),0)
  const taux = budgetGlobal > 0 ? Math.round((totalR/budgetGlobal)*100) : 0
  const pw = doc.internal.pageSize.getWidth()

  doc.setFillColor(27,59,43); doc.rect(0,0,pw,32,'F')
  doc.setTextColor(255,255,255); doc.setFontSize(15); doc.setFont('helvetica','bold')
  doc.text('Rapport Financier \u2014 Camp-Navs 2026', 14, 13)
  doc.setFontSize(8); doc.setFont('helvetica','normal')
  doc.text("Mission \u00c9vang\u00e9lique des Navigateurs \u2014 C\u00f4te d'Ivoire", 14, 20)
  doc.text(`G\u00e9n\u00e9r\u00e9 le ${now}`, 14, 26)

  let y = 40
  doc.setTextColor(27,59,43); doc.setFontSize(11); doc.setFont('helvetica','bold')
  doc.text('1. R\u00c9SUM\u00c9 EX\u00c9CUTIF', 14, y); y += 4
  autoTable(doc, {
    startY: y,
    head: [['Indicateur','Montant (FCFA)','Observation']],
    body: [
      ['Budget global', budgetGlobal>0?`${fmt(budgetGlobal)} FCFA`:'Non d\u00e9fini',''],
      ['Total recettes',`${fmt(totalR)} FCFA`,`${taux}% du budget`],
      ['Total d\u00e9penses',`${fmt(totalD)} FCFA`,''],
      ['Solde disponible',`${fmt(totalR-totalD)} FCFA`,totalR-totalD>=0?'Exc\u00e9dent':'D\u00e9ficit'],
      ['Dons en nature (re\u00e7us)',`${fmt(totalDN)} FCFA`,`${donsNature.filter(d=>d.statut==='\u0072e\u00e7u').length} don(s)`],
    ],
    headStyles:{fillColor:[27,59,43],fontSize:9},
    bodyStyles:{fontSize:9},
    columnStyles:{1:{halign:'right'},2:{textColor:[100,100,100]}},
    alternateRowStyles:{fillColor:[248,250,252]},
    margin:{left:14,right:14},
  })
  y = doc.lastAutoTable.finalY + 10

  doc.setFontSize(11); doc.setFont('helvetica','bold')
  doc.text('2. RECETTES PAR SOURCE', 14, y); y += 4
  const parSource = TYPES_RECETTE.map(t=>{ const items=recettes.filter(r=>r.type===t.key); return {label:t.label,total:items.reduce((s,r)=>s+(r.montant||0),0),count:items.length} }).filter(t=>t.total>0)
  autoTable(doc, {
    startY: y,
    head: [['Source','Nb','Montant (FCFA)']],
    body: [...parSource.map(t=>[t.label,String(t.count),`${fmt(t.total)} FCFA`]),
      [{content:'TOTAL',styles:{fontStyle:'bold'}},{content:String(recettes.length),styles:{fontStyle:'bold'}},{content:`${fmt(totalR)} FCFA`,styles:{fontStyle:'bold',textColor:[6,95,70]}}]],
    headStyles:{fillColor:[6,95,70],fontSize:9}, bodyStyles:{fontSize:9},
    columnStyles:{1:{halign:'center'},2:{halign:'right'}},
    alternateRowStyles:{fillColor:[236,253,245]}, margin:{left:14,right:14},
  })
  y = doc.lastAutoTable.finalY + 10

  if (donsNature.length > 0) {
    if (y>230){doc.addPage();y=20}
    doc.setFontSize(11); doc.setFont('helvetica','bold')
    doc.text('3. DONS EN NATURE', 14, y); y += 4
    autoTable(doc, {
      startY: y,
      head: [['D\u00e9signation','Qt\u00e9','Donateur','Valeur est.','Statut']],
      body: donsNature.map(d=>[d.designation,`${d.quantite} ${d.unite||''}`,d.donateur||'-',`${fmt(d.valeur_estimee||0)} FCFA`,d.statut||'-']),
      headStyles:{fillColor:[109,40,217],fontSize:8}, bodyStyles:{fontSize:8},
      columnStyles:{3:{halign:'right'}}, alternateRowStyles:{fillColor:[245,243,255]},
      margin:{left:14,right:14},
    })
    y = doc.lastAutoTable.finalY + 10
  }

  const sN = donsNature.length>0?'4':'3'
  if (y>230){doc.addPage();y=20}
  doc.setFontSize(11); doc.setFont('helvetica','bold')
  doc.text(`${sN}. D\u00c9PENSES PAR COMMISSION`, 14, y); y += 4

  for (const c of commissions) {
    const deps = depenses.filter(d=>d.commission_id===c.id)
    const totalDep = deps.reduce((s,d)=>s+d.montant,0)
    const alloue = c.montant_alloue||0, sol=alloue-totalDep, depasse=totalDep>alloue&&alloue>0
    if (y>240){doc.addPage();y=20}
    doc.setFontSize(9); doc.setFont('helvetica','bold')
    doc.setTextColor(depasse?192:27,depasse?38:59,depasse?38:43)
    doc.text(`  ${c.nom_commission}${depasse?'  \u26a0 D\u00c9PASSEMENT : +'+fmt(totalDep-alloue)+' FCFA':''}`, 14, y); y+=4
    autoTable(doc,{
      startY:y,
      head:[['Budget pr\u00e9vu','Allou\u00e9','D\u00e9pens\u00e9','Solde']],
      body:[[`${fmt(c.budget_previsionnel||0)} FCFA`,`${fmt(alloue)} FCFA`,`${fmt(totalDep)} FCFA`,{content:`${sol>=0?'+':''}${fmt(sol)} FCFA`,styles:{textColor:sol<0?[220,38,38]:[6,95,70],fontStyle:'bold'}}]],
      headStyles:{fillColor:depasse?[220,38,38]:[30,78,216],fontSize:8},
      bodyStyles:{fontSize:8},
      columnStyles:{1:{halign:'right'},2:{halign:'right'},3:{halign:'right'}},
      margin:{left:14,right:14},
    })
    y = doc.lastAutoTable.finalY+3
    if (deps.length>0) {
      autoTable(doc,{
        startY:y,
        head:[['Description','Montant','Date','Justificatif']],
        body:deps.map(d=>[d.description||'-',`${fmt(d.montant)} FCFA`,new Date(d.date_depense).toLocaleDateString('fr-FR'),d.justificatif||'-']),
        headStyles:{fillColor:[71,85,105],fontSize:7},bodyStyles:{fontSize:7},
        columnStyles:{1:{halign:'right'}},alternateRowStyles:{fillColor:[248,250,252]},
        margin:{left:20,right:14},
      })
      y = doc.lastAutoTable.finalY+8
    } else { doc.setFontSize(7);doc.setTextColor(148,163,184);doc.setFont('helvetica','italic');doc.text('  Aucune d\u00e9pense.',20,y);y+=8 }
  }

  const depassements = commissions.filter(c=>{const d=depenses.filter(x=>x.commission_id===c.id).reduce((s,x)=>s+x.montant,0);return d>(c.montant_alloue||0)&&(c.montant_alloue||0)>0})
  if (depassements.length>0) {
    if (y>230){doc.addPage();y=20}
    doc.setTextColor(220,38,38);doc.setFontSize(11);doc.setFont('helvetica','bold')
    doc.text(`${parseInt(sN)+1}. D\u00c9PASSEMENTS`, 14, y); y+=4
    autoTable(doc,{
      startY:y,
      head:[['Commission','Allou\u00e9','D\u00e9pens\u00e9','D\u00e9passement']],
      body:depassements.map(c=>{const d=depenses.filter(x=>x.commission_id===c.id).reduce((s,x)=>s+x.montant,0);return[c.nom_commission,`${fmt(c.montant_alloue||0)} FCFA`,`${fmt(d)} FCFA`,`+${fmt(d-(c.montant_alloue||0))} FCFA`]}),
      headStyles:{fillColor:[220,38,38],fontSize:9},bodyStyles:{fontSize:9,textColor:[220,38,38]},
      columnStyles:{1:{halign:'right'},2:{halign:'right'},3:{halign:'right',fontStyle:'bold'}},
      margin:{left:14,right:14},
    })
  }

  const pH = doc.internal.pageSize.getHeight(), cy=pH-55
  doc.setPage(doc.internal.getNumberOfPages())
  doc.setDrawColor(27,59,43);doc.setLineWidth(0.5);doc.rect(14,cy,pw-28,40)
  doc.setFillColor(27,59,43);doc.rect(14,cy,pw-28,7,'F')
  doc.setTextColor(255,255,255);doc.setFontSize(8);doc.setFont('helvetica','bold')
  doc.text('CERTIFICATION DU TR\u00c9SORIER',16,cy+5)
  doc.setTextColor(27,59,43);doc.setFontSize(8);doc.setFont('helvetica','normal')
  const c1=18,c2=pw/2+5
  doc.text('\u00c9tabli par :',c1,cy+13);doc.line(c1+22,cy+13,c2-5,cy+13)
  doc.text('Fonction : Tr\u00e9sorier',c2,cy+13)
  doc.text('Date :',c1,cy+22);doc.line(c1+14,cy+22,c2-5,cy+22)
  doc.text('Signature :',c2,cy+22);doc.line(c2+22,cy+22,pw-16,cy+22)
  doc.setFontSize(7);doc.setTextColor(100,116,139)
  doc.text(`Camp-Navs 2026 \u00b7 Mission \u00c9vang\u00e9lique des Navigateurs CI \u00b7 ${now}`,pw/2,cy+33,{align:'center'})
  doc.save(`Rapport_Tresorerie_CampNavs2026_${new Date().toLocaleDateString('fr-FR').replace(/\//g,'-')}.pdf`)
}

function exportExcel(recettes, commissions, depenses) {
  const now = new Date().toLocaleDateString('fr-FR')
  const totalR=recettes.reduce((s,r)=>s+(r.montant||0),0), totalD=depenses.reduce((s,d)=>s+(d.montant||0),0)
  const lignes=[['RAPPORT FINANCIER \u2014 CAMP-NAVS 2026'],[`Export\u00e9 le ${now}`],[],
    ['=== RECETTES ==='],['Type','Description','Donateur','Montant','Date'],
    ...recettes.map(r=>[getTypeRecette(r.type).label,r.description||'',r.donateur||'',r.montant||0,new Date(r.date_reception).toLocaleDateString('fr-FR')]),
    [],[`Total recettes`,'','',totalR],[],
    ['=== D\u00c9PENSES ==='],['Commission','Description','Montant','Date'],
    ...depenses.map(d=>[d.nom_commission||'',d.description||'',d.montant||0,new Date(d.date_depense).toLocaleDateString('fr-FR')]),
    [],[`Total d\u00e9penses`,'','',totalD],[],
    ['=== R\u00c9SUM\u00c9 ==='],['Total recettes',`${fmt(totalR)} FCFA`],['Total d\u00e9penses',`${fmt(totalD)} FCFA`],['Solde',`${fmt(totalR-totalD)} FCFA`],
  ]
  const csv='\uFEFF'+lignes.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(';')).join('\n')
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob)
  const a=document.createElement('a');a.href=url;a.download=`Tresorerie_CampNavs2026_${now.replace(/\//g,'-')}.csv`;a.click()
  URL.revokeObjectURL(url)
}

const iS="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400"
const lS="block text-xs text-gray-500 mb-1"
const EMPTY_R={type:'frais_participation',description:'',montant:'',donateur:'',date_reception:new Date().toISOString().split('T')[0],statut_recette:'',quantite:'',prix_unitaire:''}
const EMPTY_D={commission_id:'',description:'',montant:'',date_depense:new Date().toISOString().split('T')[0],justificatif:''}
const EMPTY_DN={designation:'',quantite:'',unite:'kg',valeur_estimee:'',donateur:'',type_donateur:'exterieur',commission_id:'',statut:'promis',date_reception:new Date().toISOString().split('T')[0]}

export default function TresoreriePage() {
  const [onglet,setOnglet]=useState('tableau_bord')
  const [recettes,setRecettes]=useState([])
  const [commissions,setCommissions]=useState([])
  const [depenses,setDepenses]=useState([])
  const [donsNature,setDonsNature]=useState([])
  const [budgetGlobal,setBudgetGlobal]=useState(0)
  const [budgetGlobalId,setBudgetGlobalId]=useState(null)
  const [editBudget,setEditBudget]=useState(false)
  const [budgetForm,setBudgetForm]=useState('')
  const [loading,setLoading]=useState(true)
  const [saving,setSaving]=useState(false)
  const [showRecette,setShowRecette]=useState(false)
  const [showCommission,setShowCommission]=useState(false)
  const [showDepense,setShowDepense]=useState(false)
  const [showDonNature,setShowDonNature]=useState(false)
  const [showAllouer,setShowAllouer]=useState(null)
  const [ficheCommission,setFicheCommission]=useState(null)
  const [recetteForm,setRecetteForm]=useState(EMPTY_R)
  const [editRecetteId,setEditRecetteId]=useState(null)
  const [commissionForm,setCommissionForm]=useState({nom_commission:'',budget_previsionnel:''})
  const [depenseForm,setDepenseForm]=useState(EMPTY_D)
  const [editDepenseId,setEditDepenseId]=useState(null)
  const [donNatureForm,setDonNatureForm]=useState(EMPTY_DN)
  const [editDonNatureId,setEditDonNatureId]=useState(null)
  const [allouerMontant,setAllouerMontant]=useState('')
  const [pageR,setPageR]=useState(0)
  const [pageD,setPageD]=useState(0)
  const [hasMoreR,setHasMoreR]=useState(false)
  const [hasMoreD,setHasMoreD]=useState(false)
  const [loadingMore,setLoadingMore]=useState(false)
  const [filtreDateR,setFiltreDateR]=useState('tout')
  const [filtreDateD,setFiltreDateD]=useState('tout')
  const [vueDepenses,setVueDepenses]=useState('liste')
  const [toast,setToast]=useState('')
  const showToast=useCallback((msg)=>{setToast(msg);setTimeout(()=>setToast(''),2500)},[])

  useEffect(()=>{fetchData()},[])

  async function fetchData() {
    const [{data:r,count:rc},{data:c},{data:d,count:dc},{data:dn},{data:bg}]=await Promise.all([
      supabase.from('recettes').select('*',{count:'exact'}).order('date_reception',{ascending:false}).range(0,LIMIT-1),
      supabase.from('budget_commissions').select('*').order('nom_commission').limit(LIMIT),
      supabase.from('depenses').select('*',{count:'exact'}).order('date_depense',{ascending:false}).range(0,LIMIT-1),
      supabase.from('dons_nature').select('*').order('date_reception',{ascending:false}),
      supabase.from('budget_global').select('*').limit(1),
    ])
    setRecettes(r||[]);setCommissions(c||[]);setDepenses(d||[]);setDonsNature(dn||[])
    setHasMoreR((rc||0)>LIMIT);setHasMoreD((dc||0)>LIMIT)
    if(bg&&bg.length>0){setBudgetGlobal(bg[0].montant||0);setBudgetGlobalId(bg[0].id);setBudgetForm(bg[0].montant||0)}
    setLoading(false)
  }

  const totalRecettes=useMemo(()=>recettes.reduce((s,r)=>s+(r.montant||0),0),[recettes])
  const totalDepenses=useMemo(()=>depenses.reduce((s,d)=>s+(d.montant||0),0),[depenses])
  const soldeGlobal=useMemo(()=>totalRecettes-totalDepenses,[totalRecettes,totalDepenses])
  const totalAlloue=useMemo(()=>commissions.reduce((s,c)=>s+(c.montant_alloue||0),0),[commissions])
  const soldeNonAlloue=useMemo(()=>totalRecettes-totalAlloue,[totalRecettes,totalAlloue])
  const pctCollecte=useMemo(()=>budgetGlobal>0?Math.round((totalRecettes/budgetGlobal)*100):0,[totalRecettes,budgetGlobal])
  const historique=useMemo(()=>{
    const r=recettes.map(r=>({...r,_type:'recette',_date:r.date_reception,_montant:r.montant||0,_label:r.description||getTypeRecette(r.type).label,_sub:r.donateur||''}))
    const d=depenses.map(d=>({...d,_type:'depense',_date:d.date_depense,_montant:d.montant||0,_label:d.description,_sub:d.nom_commission||''}))
    return [...r,...d].sort((a,b)=>new Date(b._date)-new Date(a._date))
  },[recettes,depenses])
  const caisseJour=useMemo(()=>historique.filter(tx=>estAujourdhui(tx._date)),[historique])
  const recettesFiltrees=useMemo(()=>filtrerParDate(recettes,'date_reception',filtreDateR),[recettes,filtreDateR])
  const depensesFiltrees=useMemo(()=>filtrerParDate(depenses,'date_depense',filtreDateD),[depenses,filtreDateD])
  const depassements=useMemo(()=>commissions.filter(c=>{const d=depenses.filter(x=>x.commission_id===c.id).reduce((s,x)=>s+x.montant,0);return d>(c.montant_alloue||0)&&(c.montant_alloue||0)>0}),[commissions,depenses])

  function commStats(c){
    const dep=depenses.filter(d=>d.commission_id===c.id).reduce((s,d)=>s+d.montant,0)
    const alloue=c.montant_alloue||0,pct=alloue>0?Math.round((dep/alloue)*100):0
    const depasse=dep>alloue&&alloue>0,warning=pct>=80&&!depasse
    return{dep,alloue,sol:alloue-dep,pct,depasse,warning,couleurBarre:depasse?'#DC2626':warning?'#D97706':'#065F46'}
  }

  async function chargerPlusR(){setLoadingMore(true);const next=pageR+1;const{data}=await supabase.from('recettes').select('*').order('date_reception',{ascending:false}).range(next*LIMIT,next*LIMIT+LIMIT-1);setRecettes(prev=>[...prev,...(data||[])]);setPageR(next);setHasMoreR((data||[]).length===LIMIT);setLoadingMore(false)}
  async function chargerPlusD(){setLoadingMore(true);const next=pageD+1;const{data}=await supabase.from('depenses').select('*').order('date_depense',{ascending:false}).range(next*LIMIT,next*LIMIT+LIMIT-1);setDepenses(prev=>[...prev,...(data||[])]);setPageD(next);setHasMoreD((data||[]).length===LIMIT);setLoadingMore(false)}

  async function saveBudgetGlobal(){setSaving(true);const montant=parseInt(budgetForm)||0;if(budgetGlobalId)await supabase.from('budget_global').update({montant}).eq('id',budgetGlobalId);else{const{data}=await supabase.from('budget_global').insert([{montant}]).select().single();if(data)setBudgetGlobalId(data.id)};setBudgetGlobal(montant);setSaving(false);setEditBudget(false);showToast('Budget mis \u00e0 jour \u2713')}

  async function saveRecette(){
    if(!recetteForm.montant&&!(recetteForm.quantite&&recetteForm.prix_unitaire))return
    setSaving(true)
    const montant=recetteForm.type==='vente_tshirt'&&recetteForm.quantite&&recetteForm.prix_unitaire?parseInt(recetteForm.quantite)*parseInt(recetteForm.prix_unitaire):parseInt(recetteForm.montant)||0
    const payload={type:recetteForm.type,description:recetteForm.description,montant,donateur:recetteForm.donateur,date_reception:recetteForm.date_reception,statut_recette:recetteForm.statut_recette||null,quantite:recetteForm.quantite?parseInt(recetteForm.quantite):null,prix_unitaire:recetteForm.prix_unitaire?parseInt(recetteForm.prix_unitaire):null}
    if(editRecetteId){const{data:upd}=await supabase.from('recettes').update(payload).eq('id',editRecetteId).select().single();if(upd)setRecettes(prev=>prev.map(r=>r.id===editRecetteId?upd:r));showToast('Recette modifi\u00e9e \u2713')}
    else{const{data:newR}=await supabase.from('recettes').insert([payload]).select().single();if(newR)setRecettes(prev=>[newR,...prev]);showToast('Recette ajout\u00e9e \u2713')}
    setSaving(false);setShowRecette(false);setEditRecetteId(null);setRecetteForm(EMPTY_R)
  }
  function openEditRecette(r){setRecetteForm({type:r.type,description:r.description||'',montant:String(r.montant||''),donateur:r.donateur||'',date_reception:r.date_reception,statut_recette:r.statut_recette||'',quantite:String(r.quantite||''),prix_unitaire:String(r.prix_unitaire||'')});setEditRecetteId(r.id);setShowRecette(true)}
  async function supprimerRecette(id){if(!window.confirm('Supprimer ?'))return;await supabase.from('recettes').delete().eq('id',id);setRecettes(prev=>prev.filter(r=>r.id!==id));showToast('Recette supprim\u00e9e')}

  async function saveDepense(){
    if(!depenseForm.commission_id||!depenseForm.description||!depenseForm.montant)return;setSaving(true)
    const comm=commissions.find(c=>c.id===depenseForm.commission_id)
    const payload={commission_id:depenseForm.commission_id,nom_commission:comm?.nom_commission||'',description:depenseForm.description,montant:parseInt(depenseForm.montant)||0,date_depense:depenseForm.date_depense,justificatif:depenseForm.justificatif}
    if(editDepenseId){const{data:upd}=await supabase.from('depenses').update(payload).eq('id',editDepenseId).select().single();if(upd)setDepenses(prev=>prev.map(d=>d.id===editDepenseId?upd:d));showToast('D\u00e9pense modifi\u00e9e \u2713')}
    else{const{data:newD}=await supabase.from('depenses').insert([payload]).select().single();if(newD)setDepenses(prev=>[newD,...prev]);showToast('D\u00e9pense enregistr\u00e9e \u2713')}
    setSaving(false);setShowDepense(false);setEditDepenseId(null);setDepenseForm(EMPTY_D)
  }
  function openEditDepense(d){setDepenseForm({commission_id:d.commission_id,description:d.description||'',montant:String(d.montant||''),date_depense:d.date_depense,justificatif:d.justificatif||''});setEditDepenseId(d.id);setShowDepense(true)}
  async function supprimerDepense(id){if(!window.confirm('Supprimer ?'))return;await supabase.from('depenses').delete().eq('id',id);setDepenses(prev=>prev.filter(d=>d.id!==id));showToast('D\u00e9pense supprim\u00e9e')}

  async function saveDonNature(){
    if(!donNatureForm.designation||!donNatureForm.quantite)return;setSaving(true)
    const payload={designation:donNatureForm.designation,quantite:parseFloat(donNatureForm.quantite),unite:donNatureForm.unite,valeur_estimee:parseInt(donNatureForm.valeur_estimee)||0,donateur:donNatureForm.donateur,type_donateur:donNatureForm.type_donateur,commission_id:donNatureForm.commission_id||null,statut:donNatureForm.statut,date_reception:donNatureForm.date_reception}
    if(editDonNatureId){const{data:upd}=await supabase.from('dons_nature').update(payload).eq('id',editDonNatureId).select().single();if(upd)setDonsNature(prev=>prev.map(d=>d.id===editDonNatureId?upd:d));showToast('Don modifi\u00e9 \u2713')}
    else{const{data:newD}=await supabase.from('dons_nature').insert([payload]).select().single();if(newD)setDonsNature(prev=>[newD,...prev]);showToast('Don enregistr\u00e9 \u2713')}
    setSaving(false);setShowDonNature(false);setEditDonNatureId(null);setDonNatureForm(EMPTY_DN)
  }
  function openEditDonNature(d){setDonNatureForm({designation:d.designation,quantite:String(d.quantite),unite:d.unite||'kg',valeur_estimee:String(d.valeur_estimee||''),donateur:d.donateur||'',type_donateur:d.type_donateur||'exterieur',commission_id:d.commission_id||'',statut:d.statut||'promis',date_reception:d.date_reception});setEditDonNatureId(d.id);setShowDonNature(true)}
  async function supprimerDonNature(id){if(!window.confirm('Supprimer ?'))return;await supabase.from('dons_nature').delete().eq('id',id);setDonsNature(prev=>prev.filter(d=>d.id!==id));showToast('Don supprim\u00e9')}

  async function saveCommission(){if(!commissionForm.nom_commission)return;setSaving(true);const{data:newC}=await supabase.from('budget_commissions').insert([{nom_commission:commissionForm.nom_commission,budget_previsionnel:parseInt(commissionForm.budget_previsionnel)||0,montant_alloue:0}]).select().single();if(newC)setCommissions(prev=>[...prev,newC].sort((a,b)=>a.nom_commission.localeCompare(b.nom_commission)));setSaving(false);setShowCommission(false);setCommissionForm({nom_commission:'',budget_previsionnel:''});showToast('Commission cr\u00e9\u00e9e \u2713')}
  async function saveAllouer(cId){if(!allouerMontant)return;setSaving(true);const montant=parseInt(allouerMontant);await supabase.from('budget_commissions').update({montant_alloue:montant}).eq('id',cId);setCommissions(prev=>prev.map(c=>c.id===cId?{...c,montant_alloue:montant}:c));setSaving(false);setShowAllouer(null);setAllouerMontant('');showToast('Allocation mise \u00e0 jour \u2713')}
  async function supprimerCommission(id){if(!window.confirm('Supprimer ?'))return;await supabase.from('budget_commissions').delete().eq('id',id);setCommissions(prev=>prev.filter(c=>c.id!==id));showToast('Commission supprim\u00e9e')}

  const chipS=(a)=>({flexShrink:0,padding:'5px 12px',borderRadius:20,fontSize:12,fontWeight:500,cursor:'pointer',border:`1px solid ${a?VERT:'#E2E8F0'}`,background:a?VERT:'#fff',color:a?'#fff':'#64748B'})
  const dateChipS=(a)=>({flexShrink:0,padding:'4px 10px',borderRadius:20,fontSize:11,fontWeight:500,cursor:'pointer',border:`1px solid ${a?'#1D4ED8':'#E2E8F0'}`,background:a?'#EFF6FF':'#fff',color:a?'#1D4ED8':'#64748B'})
  const btnP={background:VERT,color:'#fff',border:'none',borderRadius:10,padding:'10px',fontSize:13,fontWeight:600,cursor:'pointer'}
  const btnS={background:'#F1F5F9',color:'#475569',border:'none',borderRadius:10,padding:'10px',fontSize:13,cursor:'pointer'}
  const inpS={border:'1px solid #E2E8F0',borderRadius:8,padding:'7px 12px',fontSize:13,outline:'none',color:'#1E293B'}

  const FmrRecette=()=>(
    <div style={{background:'#fff',border:'1px solid #E2E8F0',borderRadius:14,padding:'14px',marginBottom:12}}>
      <p style={{fontSize:13,fontWeight:600,color:'#1E293B',margin:'0 0 10px'}}>{editRecetteId?'Modifier':'Nouvelle recette'}</p>
      <div style={{marginBottom:8}}><label className={lS}>Source *</label>
        <select value={recetteForm.type} onChange={e=>setRecetteForm(f=>({...f,type:e.target.value}))} className={iS}>
          {TYPES_RECETTE.map(t=><option key={t.key} value={t.key}>{t.label}</option>)}
        </select>
      </div>
      {recetteForm.type==='vente_tshirt'?(
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
          <div><label className={lS}>Quantit\u00e9</label><input type="number" value={recetteForm.quantite} onChange={e=>setRecetteForm(f=>({...f,quantite:e.target.value,montant:String(parseInt(e.target.value||0)*parseInt(f.prix_unitaire||0))}))} className={iS}/></div>
          <div><label className={lS}>Prix unitaire (FCFA)</label><input type="number" value={recetteForm.prix_unitaire} onChange={e=>setRecetteForm(f=>({...f,prix_unitaire:e.target.value,montant:String(parseInt(f.quantite||0)*parseInt(e.target.value||0))}))} className={iS}/></div>
          <div><label className={lS}>Total (calcul\u00e9)</label><input type="number" value={recetteForm.montant} readOnly className={iS} style={{background:'#F8FAFC'}}/></div>
          <div><label className={lS}>Description</label><input type="text" value={recetteForm.description} onChange={e=>setRecetteForm(f=>({...f,description:e.target.value}))} placeholder="Ex: T-shirt S/M/L" className={iS}/></div>
        </div>
      ):(
        <>
          <div style={{marginBottom:8}}><label className={lS}>Montant (FCFA) *</label><input type="number" value={recetteForm.montant} onChange={e=>setRecetteForm(f=>({...f,montant:e.target.value}))} className={iS}/></div>
          <div style={{marginBottom:8}}><label className={lS}>Description</label><input type="text" value={recetteForm.description} onChange={e=>setRecetteForm(f=>({...f,description:e.target.value}))} placeholder="Ex: Don de l'Eglise XYZ" className={iS}/></div>
        </>
      )}
      {recetteForm.type==='subvention'&&(
        <div style={{marginBottom:8}}><label className={lS}>Statut subvention</label>
          <select value={recetteForm.statut_recette} onChange={e=>setRecetteForm(f=>({...f,statut_recette:e.target.value}))} className={iS}>
            <option value="">-- S\u00e9lectionner --</option>
            {STATUTS_SUBVENTION.map(s=><option key={s}>{s}</option>)}
          </select>
        </div>
      )}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
        <div><label className={lS}>Donateur</label><input type="text" value={recetteForm.donateur} onChange={e=>setRecetteForm(f=>({...f,donateur:e.target.value}))} placeholder="Ex: M. KOUASSI" className={iS}/></div>
        <div><label className={lS}>Date</label><input type="date" value={recetteForm.date_reception} onChange={e=>setRecetteForm(f=>({...f,date_reception:e.target.value}))} className={iS}/></div>
      </div>
      <div style={{display:'flex',gap:8}}>
        <button type="button" onClick={()=>{setShowRecette(false);setEditRecetteId(null);setRecetteForm(EMPTY_R)}} style={{...btnS,flex:1}}>Annuler</button>
        <button type="button" onClick={saveRecette} disabled={saving} style={{...btnP,flex:1,opacity:saving?0.7:1}}>{saving?'...':(editRecetteId?'Modifier':'Ajouter')}</button>
      </div>
    </div>
  )

  const FmrDepense=()=>(
    <div style={{background:'#fff',border:'1px solid #E2E8F0',borderRadius:14,padding:'14px',marginBottom:12}}>
      <p style={{fontSize:13,fontWeight:600,color:'#1E293B',margin:'0 0 10px'}}>{editDepenseId?'Modifier':'Nouvelle d\u00e9pense'}</p>
      <div style={{marginBottom:8}}><label className={lS}>Commission *</label>
        <select value={depenseForm.commission_id} onChange={e=>setDepenseForm(f=>({...f,commission_id:e.target.value}))} className={iS}>
          <option value="">S\u00e9lectionner</option>
          {commissions.map(c=><option key={c.id} value={c.id}>{c.nom_commission}</option>)}
        </select>
      </div>
      <div style={{marginBottom:8}}><label className={lS}>Description *</label><input type="text" value={depenseForm.description} onChange={e=>setDepenseForm(f=>({...f,description:e.target.value}))} placeholder="Ex: Achat vivres" className={iS}/></div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
        <div><label className={lS}>Montant (FCFA) *</label><input type="number" value={depenseForm.montant} onChange={e=>setDepenseForm(f=>({...f,montant:e.target.value}))} className={iS}/></div>
        <div><label className={lS}>Date</label><input type="date" value={depenseForm.date_depense} onChange={e=>setDepenseForm(f=>({...f,date_depense:e.target.value}))} className={iS}/></div>
      </div>
      <div style={{marginBottom:12}}><label className={lS}>Justificatif</label><input type="text" value={depenseForm.justificatif} onChange={e=>setDepenseForm(f=>({...f,justificatif:e.target.value}))} placeholder="Ex: Re\u00e7u n\u00b0001" className={iS}/></div>
      <div style={{display:'flex',gap:8}}>
        <button type="button" onClick={()=>{setShowDepense(false);setEditDepenseId(null);setDepenseForm(EMPTY_D)}} style={{...btnS,flex:1}}>Annuler</button>
        <button type="button" onClick={saveDepense} disabled={saving} style={{...btnP,flex:1,opacity:saving?0.7:1}}>{saving?'...':(editDepenseId?'Modifier':'Ajouter')}</button>
      </div>
    </div>
  )

  const LigneR=({r,i,total})=>(
    <div style={{display:'flex',alignItems:'center',gap:10,padding:'9px 14px',borderBottom:i<total-1?'1px solid #F1F5F9':'none'}}>
      <div style={{width:32,height:32,borderRadius:'50%',background:'#ECFDF5',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#065F46" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 1v8m0 0v1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
      </div>
      <div style={{flex:1,minWidth:0}}>
        <p style={{fontSize:12,fontWeight:500,color:'#1E293B',margin:'0 0 1px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.description||getTypeRecette(r.type).label}</p>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          <span style={{fontSize:10,color:'#94A3B8'}}>{r.donateur&&`${r.donateur} \u00b7 `}{new Date(r.date_reception).toLocaleDateString('fr-FR')}</span>
          {r.statut_recette&&<span style={{fontSize:9,fontWeight:600,background:'#FFFBEB',color:'#92400E',borderRadius:20,padding:'1px 6px'}}>{r.statut_recette}</span>}
          {r.quantite&&r.prix_unitaire&&<span style={{fontSize:9,color:'#94A3B8'}}>{r.quantite}\u00d7{fmt(r.prix_unitaire)} FCFA</span>}
        </div>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:5,flexShrink:0}}>
        <p style={{fontSize:13,fontWeight:700,color:'#065F46',margin:0}}>{fmt(r.montant||0)}</p>
        <button type="button" onClick={()=>openEditRecette(r)} style={{width:24,height:24,borderRadius:7,background:VERT_CLAIR,border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke={VERT} strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
        </button>
        <button type="button" onClick={()=>supprimerRecette(r.id)} style={{width:24,height:24,borderRadius:7,background:'#FEF2F2',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="#DC2626" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </button>
      </div>
    </div>
  )

  const LigneD=({d,i,total,showComm=true})=>(
    <div style={{display:'flex',alignItems:'center',gap:10,padding:'9px 14px',borderBottom:i<total-1?'1px solid #F1F5F9':'none'}}>
      <div style={{width:32,height:32,borderRadius:'50%',background:'#FEF2F2',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#DC2626" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
      </div>
      <div style={{flex:1,minWidth:0}}>
        <p style={{fontSize:12,fontWeight:500,color:'#1E293B',margin:'0 0 1px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.description}</p>
        <p style={{fontSize:10,color:'#94A3B8',margin:0}}>{showComm&&d.nom_commission&&`${d.nom_commission} \u00b7 `}{new Date(d.date_depense).toLocaleDateString('fr-FR')}{d.justificatif&&` \u00b7 ${d.justificatif}`}</p>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:5,flexShrink:0}}>
        <p style={{fontSize:13,fontWeight:700,color:'#DC2626',margin:0}}>{fmt(d.montant)}</p>
        <button type="button" onClick={()=>openEditDepense(d)} style={{width:24,height:24,borderRadius:7,background:VERT_CLAIR,border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke={VERT} strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
        </button>
        <button type="button" onClick={()=>supprimerDepense(d.id)} style={{width:24,height:24,borderRadius:7,background:'#FEF2F2',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="#DC2626" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
        </button>
      </div>
    </div>
  )

  return (
    <AdminLayout>
      {toast!==''&&<div style={{position:'fixed',bottom:84,left:'50%',transform:'translateX(-50%)',background:VERT,color:'#fff',borderRadius:12,padding:'10px 22px',fontSize:13,fontWeight:600,zIndex:200,boxShadow:'0 4px 20px rgba(0,0,0,0.2)',whiteSpace:'nowrap',pointerEvents:'none'}}>{toast}</div>}

      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
        <div>
          <h1 style={{fontSize:20,fontWeight:700,color:'#1E293B',margin:0}}>Tr\u00e9sorerie</h1>
          <p style={{fontSize:11,color:'#94A3B8',margin:'2px 0 0'}}>Camp-Navs 2026</p>
        </div>
        <div style={{display:'flex',gap:6}}>
          <button type="button" onClick={()=>exportPDFTresorerie(recettes,commissions,depenses,donsNature,budgetGlobal)}
            style={{background:'#FEF2F2',color:'#DC2626',border:'1px solid #FCA5A5',borderRadius:8,padding:'6px 12px',fontSize:12,fontWeight:500,cursor:'pointer',display:'flex',alignItems:'center',gap:4}}>
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>PDF
          </button>
          <button type="button" onClick={()=>exportExcel(recettes,commissions,depenses)}
            style={{background:VERT_CLAIR,color:VERT,border:`1px solid ${VERT}`,borderRadius:8,padding:'6px 12px',fontSize:12,fontWeight:500,cursor:'pointer',display:'flex',alignItems:'center',gap:4}}>
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>Excel
          </button>
        </div>
      </div>

      <div style={{display:'flex',gap:6,marginBottom:14,overflowX:'auto',scrollbarWidth:'none'}}>
        {[{key:'tableau_bord',label:'Tableau de bord'},{key:'recettes',label:`Recettes (${recettes.length})`},{key:'dons_nature',label:`Dons nature (${donsNature.length})`},{key:'commissions',label:'Commissions'},{key:'depenses',label:`D\u00e9penses (${depenses.length})`},{key:'historique',label:'Historique'}].map(o=>(
          <button key={o.key} type="button" onClick={()=>setOnglet(o.key)} style={chipS(onglet===o.key)}>{o.label}</button>
        ))}
      </div>

      {onglet==='tableau_bord'&&(
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {depassements.length>0&&(
            <div style={{background:'#FEF2F2',border:'1px solid #FCA5A5',borderRadius:12,padding:'10px 14px'}}>
              <p style={{fontSize:11,fontWeight:700,color:'#DC2626',margin:'0 0 6px'}}>\u26a0 {depassements.length} commission(s) en d\u00e9passement</p>
              {depassements.map(c=>{const dep=depenses.filter(d=>d.commission_id===c.id).reduce((s,d)=>s+d.montant,0);return <p key={c.id} style={{fontSize:11,color:'#DC2626',margin:'2px 0'}}>{c.nom_commission} : d\u00e9pens\u00e9 {fmt(dep)} / allou\u00e9 {fmt(c.montant_alloue||0)} FCFA (+{fmt(dep-(c.montant_alloue||0))} FCFA)</p>})}
            </div>
          )}
          <div style={{background:'#fff',borderRadius:12,border:'1px solid #F1F5F9',padding:'10px 14px'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:editBudget?8:4}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <span style={{fontSize:10,fontWeight:700,color:'#94A3B8',letterSpacing:'0.08em'}}>BUDGET GLOBAL</span>
                <span style={{fontSize:14,fontWeight:700,color:'#1E293B'}}>{budgetGlobal>0?`${fmt(budgetGlobal)} FCFA`:'\u2014'}</span>
              </div>
              <button type="button" onClick={()=>{setEditBudget(!editBudget);setBudgetForm(budgetGlobal)}} style={{fontSize:11,color:VERT,background:'transparent',border:`1px solid ${VERT}`,borderRadius:6,padding:'3px 10px',cursor:'pointer'}}>{editBudget?'Annuler':'Modifier'}</button>
            </div>
            {editBudget&&(<div style={{display:'flex',gap:8,marginBottom:8}}><input type="number" value={budgetForm} onChange={e=>setBudgetForm(e.target.value)} placeholder="Montant FCFA" style={{...inpS,flex:1}}/><button type="button" onClick={saveBudgetGlobal} disabled={saving} style={{background:VERT,color:'#fff',border:'none',borderRadius:8,padding:'7px 14px',fontSize:12,fontWeight:600,cursor:'pointer'}}>{saving?'...':'OK'}</button></div>)}
            {budgetGlobal>0&&!editBudget&&(<><div style={{background:'#F1F5F9',borderRadius:4,height:4,marginBottom:4}}><div style={{background:VERT,borderRadius:4,height:4,width:`${Math.min(pctCollecte,100)}%`,transition:'width .4s'}}/></div><div style={{display:'flex',justifyContent:'space-between'}}><span style={{fontSize:10,color:'#64748B'}}>{pctCollecte}% collect\u00e9</span><span style={{fontSize:10,color:'#94A3B8'}}>Reste : {fmt(Math.max(budgetGlobal-totalRecettes,0))} FCFA</span></div></>)}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
            {[{label:'Recettes totales',val:totalRecettes,color:'#065F46',border:'#6EE7B7',p:'+'},{label:'D\u00e9penses totales',val:totalDepenses,color:'#DC2626',border:'#FCA5A5',p:'-'},{label:'Solde disponible',val:soldeGlobal,color:soldeGlobal>=0?'#1D4ED8':'#DC2626',border:soldeGlobal>=0?'#93C5FD':'#FCA5A5',p:''},{label:'Non allou\u00e9',val:soldeNonAlloue,color:'#92400E',border:'#FCD34D',p:''}].map(k=>(
              <div key={k.label} style={{background:'#fff',borderRadius:10,border:`1px solid ${k.border}`,padding:'10px 12px'}}>
                <p style={{fontSize:10,color:'#94A3B8',margin:'0 0 4px',fontWeight:500}}>{k.label}</p>
                <p style={{fontSize:15,fontWeight:700,color:k.color,margin:0}}>{k.p}{fmt(k.val)}</p>
                <p style={{fontSize:9,color:'#CBD5E1',margin:'1px 0 0'}}>FCFA</p>
              </div>
            ))}
          </div>
          {caisseJour.length>0&&(
            <div style={{background:'#fff',borderRadius:12,border:'1px solid #F1F5F9',padding:'10px 14px'}}>
              <p style={{fontSize:9,fontWeight:700,color:'#94A3B8',letterSpacing:'0.1em',margin:'0 0 8px',textTransform:'uppercase'}}>Caisse du jour ({caisseJour.length} mouvement(s))</p>
              {caisseJour.map((tx,i)=>{const isR=tx._type==='recette';return(<div key={`${tx._type}-${tx.id}`} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'5px 0',borderBottom:i<caisseJour.length-1?'1px solid #F8FAFC':'none'}}><div style={{display:'flex',alignItems:'center',gap:6}}><span style={{fontSize:12,fontWeight:700,color:isR?'#065F46':'#DC2626'}}>{isR?'+':'\u2212'}</span><span style={{fontSize:12,color:'#1E293B',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:180}}>{tx._label}</span></div><span style={{fontSize:12,fontWeight:700,color:isR?'#065F46':'#DC2626',flexShrink:0}}>{fmt(tx._montant)} FCFA</span></div>)})}
              <div style={{marginTop:8,paddingTop:8,borderTop:'1px solid #F1F5F9',display:'flex',justifyContent:'space-between'}}>
                <span style={{fontSize:11,color:'#64748B',fontWeight:600}}>Bilan du jour</span>
                {(()=>{const e=caisseJour.filter(t=>t._type==='recette').reduce((s,t)=>s+t._montant,0),so=caisseJour.filter(t=>t._type==='depense').reduce((s,t)=>s+t._montant,0),b=e-so;return<span style={{fontSize:11,fontWeight:700,color:b>=0?'#065F46':'#DC2626'}}>{b>=0?'+':''}{fmt(b)} FCFA</span>})()}
              </div>
            </div>
          )}
          <div style={{background:'#fff',borderRadius:12,border:'1px solid #F1F5F9',padding:'10px 14px'}}>
            <p style={{fontSize:9,fontWeight:700,color:'#94A3B8',letterSpacing:'0.1em',margin:'0 0 8px',textTransform:'uppercase'}}>Recettes par source</p>
            {TYPES_RECETTE.map(t=>{const m=recettes.filter(r=>r.type===t.key).reduce((s,r)=>s+(r.montant||0),0);if(m===0)return null;return(<div key={t.key} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px solid #F8FAFC'}}><div style={{display:'flex',alignItems:'center',gap:6}}><div style={{width:6,height:6,borderRadius:'50%',background:VERT}}/><span style={{fontSize:12,color:'#1E293B'}}>{t.label}</span></div><span style={{fontSize:12,fontWeight:700,color:'#065F46'}}>{fmt(m)} FCFA</span></div>)})}
            {totalRecettes===0&&<p style={{fontSize:12,color:'#94A3B8',margin:0}}>Aucune recette.</p>}
          </div>
          {commissions.length>0&&(<div style={{background:'#fff',borderRadius:12,border:'1px solid #F1F5F9',padding:'10px 14px'}}>
            <p style={{fontSize:9,fontWeight:700,color:'#94A3B8',letterSpacing:'0.1em',margin:'0 0 8px',textTransform:'uppercase'}}>Commissions</p>
            {commissions.map((c,i)=>{const{dep,alloue,sol,depasse}=commStats(c);return(<div key={c.id} style={{padding:'7px 0',borderBottom:i<commissions.length-1?'1px solid #F1F5F9':'none'}}><div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}><div style={{display:'flex',alignItems:'center',gap:6}}><span style={{fontSize:13,fontWeight:600,color:'#1E293B'}}>{c.nom_commission}</span>{depasse&&<span style={{fontSize:9,fontWeight:700,background:'#FEF2F2',color:'#DC2626',borderRadius:20,padding:'1px 6px'}}>\u26a0</span>}</div><span style={{fontSize:13,fontWeight:700,color:sol>=0?'#065F46':'#DC2626'}}>{sol>=0?'+':''}{fmt(sol)} FCFA</span></div><p style={{fontSize:10,color:'#94A3B8',margin:'2px 0 0'}}>Allou\u00e9 : {fmt(alloue)} | D\u00e9pens\u00e9 : {fmt(dep)}</p></div>)})}
          </div>)}
        </div>
      )}

      {onglet==='recettes'&&(
        <>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
            <div style={{display:'flex',gap:6,overflowX:'auto',scrollbarWidth:'none'}}>
              {[{k:'tout',l:'Tout'},{k:'mois',l:'Ce mois'},{k:'semaine',l:'Cette semaine'}].map(f=><button key={f.k} type="button" onClick={()=>setFiltreDateR(f.k)} style={dateChipS(filtreDateR===f.k)}>{f.l}</button>)}
            </div>
            <button type="button" onClick={()=>{setShowRecette(!showRecette);setEditRecetteId(null);setRecetteForm(EMPTY_R)}} style={{width:30,height:30,borderRadius:'50%',background:showRecette&&!editRecetteId?'#FEF2F2':VERT,color:'#fff',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:300,flexShrink:0,marginLeft:8}}>
              {showRecette&&!editRecetteId?'\u00d7':'+'}
            </button>
          </div>
          {showRecette&&<FmrRecette/>}
          <div style={{background:'#fff',borderRadius:12,border:'1px solid #E2E8F0',overflow:'hidden'}}>
            {recettesFiltrees.length===0&&<p style={{fontSize:13,color:'#94A3B8',textAlign:'center',padding:'20px',margin:0}}>Aucune recette.</p>}
            {recettesFiltrees.map((r,i)=><LigneR key={r.id} r={r} i={i} total={recettesFiltrees.length}/>)}
          </div>
          {hasMoreR&&filtreDateR==='tout'&&<button type="button" onClick={chargerPlusR} disabled={loadingMore} style={{width:'100%',marginTop:10,background:'#fff',color:VERT,border:`1px solid ${VERT}`,borderRadius:10,padding:'10px',fontSize:13,fontWeight:600,cursor:'pointer',opacity:loadingMore?0.7:1}}>{loadingMore?'Chargement...':'Charger plus'}</button>}
        </>
      )}

      {onglet==='dons_nature'&&(
        <>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
            <div>
              <p style={{fontSize:11,fontWeight:700,color:'#94A3B8',letterSpacing:'0.1em',margin:0}}>DONS EN NATURE ({donsNature.length})</p>
              <p style={{fontSize:10,color:'#94A3B8',margin:'2px 0 0'}}>Valeur re\u00e7ue : {fmt(donsNature.filter(d=>d.statut==='re\u00e7u').reduce((s,d)=>s+(d.valeur_estimee||0),0))} FCFA</p>
            </div>
            <button type="button" onClick={()=>{setShowDonNature(!showDonNature);setEditDonNatureId(null);setDonNatureForm(EMPTY_DN)}} style={{width:30,height:30,borderRadius:'50%',background:showDonNature&&!editDonNatureId?'#FEF2F2':VERT,color:'#fff',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:300}}>
              {showDonNature&&!editDonNatureId?'\u00d7':'+'}
            </button>
          </div>
          {showDonNature&&(
            <div style={{background:'#fff',border:'1px solid #E2E8F0',borderRadius:14,padding:'14px',marginBottom:12}}>
              <p style={{fontSize:13,fontWeight:600,color:'#1E293B',margin:'0 0 10px'}}>{editDonNatureId?'Modifier':'Nouveau don en nature'}</p>
              <div style={{marginBottom:8}}><label className={lS}>D\u00e9signation *</label><input type="text" value={donNatureForm.designation} onChange={e=>setDonNatureForm(f=>({...f,designation:e.target.value}))} placeholder="Ex: Riz, Huile, Poisson..." className={iS}/></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
                <div><label className={lS}>Quantit\u00e9 *</label><input type="number" value={donNatureForm.quantite} onChange={e=>setDonNatureForm(f=>({...f,quantite:e.target.value}))} className={iS}/></div>
                <div><label className={lS}>Unit\u00e9</label><select value={donNatureForm.unite} onChange={e=>setDonNatureForm(f=>({...f,unite:e.target.value}))} className={iS}>{UNITES.map(u=><option key={u}>{u}</option>)}</select></div>
              </div>
              <div style={{marginBottom:8}}><label className={lS}>Valeur estim\u00e9e (FCFA)</label><input type="number" value={donNatureForm.valeur_estimee} onChange={e=>setDonNatureForm(f=>({...f,valeur_estimee:e.target.value}))} className={iS}/></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
                <div><label className={lS}>Donateur</label><input type="text" value={donNatureForm.donateur} onChange={e=>setDonNatureForm(f=>({...f,donateur:e.target.value}))} className={iS}/></div>
                <div><label className={lS}>Type</label><select value={donNatureForm.type_donateur} onChange={e=>setDonNatureForm(f=>({...f,type_donateur:e.target.value}))} className={iS}><option value="exterieur">Ext\u00e9rieur (hors Navs)</option><option value="interieur">Int\u00e9rieur (Navigateurs)</option></select></div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
                <div><label className={lS}>Commission b\u00e9n\u00e9ficiaire</label><select value={donNatureForm.commission_id} onChange={e=>setDonNatureForm(f=>({...f,commission_id:e.target.value}))} className={iS}><option value="">-- Aucune --</option>{commissions.map(c=><option key={c.id} value={c.id}>{c.nom_commission}</option>)}</select></div>
                <div><label className={lS}>Statut</label><select value={donNatureForm.statut} onChange={e=>setDonNatureForm(f=>({...f,statut:e.target.value}))} className={iS}>{STATUTS_DON.map(s=><option key={s}>{s}</option>)}</select></div>
              </div>
              <div style={{marginBottom:12}}><label className={lS}>Date</label><input type="date" value={donNatureForm.date_reception} onChange={e=>setDonNatureForm(f=>({...f,date_reception:e.target.value}))} className={iS}/></div>
              <div style={{display:'flex',gap:8}}>
                <button type="button" onClick={()=>{setShowDonNature(false);setEditDonNatureId(null);setDonNatureForm(EMPTY_DN)}} style={{...btnS,flex:1}}>Annuler</button>
                <button type="button" onClick={saveDonNature} disabled={saving} style={{...btnP,flex:1,opacity:saving?0.7:1}}>{saving?'...':(editDonNatureId?'Modifier':'Enregistrer')}</button>
              </div>
            </div>
          )}
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6,marginBottom:12}}>
            {[{label:'Promis',count:donsNature.filter(d=>d.statut==='promis').length,color:'#92400E',bg:'#FFFBEB',border:'#FCD34D'},{label:'Partiel',count:donsNature.filter(d=>d.statut==='partiellement re\u00e7u').length,color:'#1D4ED8',bg:'#EFF6FF',border:'#93C5FD'},{label:'Re\u00e7us',count:donsNature.filter(d=>d.statut==='re\u00e7u').length,color:'#065F46',bg:'#ECFDF5',border:'#6EE7B7'}].map(s=>(
              <div key={s.label} style={{background:s.bg,border:`1px solid ${s.border}`,borderRadius:10,padding:'8px',textAlign:'center'}}>
                <p style={{fontSize:20,fontWeight:700,color:s.color,margin:'0 0 2px'}}>{s.count}</p>
                <p style={{fontSize:9,color:s.color,margin:0,opacity:0.7}}>{s.label}</p>
              </div>
            ))}
          </div>
          <div style={{background:'#fff',borderRadius:12,border:'1px solid #E2E8F0',overflow:'hidden'}}>
            {donsNature.length===0&&<p style={{fontSize:13,color:'#94A3B8',textAlign:'center',padding:'20px',margin:0}}>Aucun don en nature.</p>}
            {donsNature.map((d,i)=>{
              const sc={'promis':{bg:'#FFFBEB',color:'#92400E'},'partiellement re\u00e7u':{bg:'#EFF6FF',color:'#1D4ED8'},'re\u00e7u':{bg:'#ECFDF5',color:'#065F46'}}[d.statut]||{bg:'#F8FAFC',color:'#475569'}
              return(
                <div key={d.id} style={{padding:'10px 14px',borderBottom:i<donsNature.length-1?'1px solid #F1F5F9':'none'}}>
                  <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between'}}>
                    <div style={{flex:1}}>
                      <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap',marginBottom:3}}>
                        <p style={{fontSize:13,fontWeight:600,color:'#1E293B',margin:0}}>{d.designation}</p>
                        <span style={{fontSize:9,fontWeight:700,background:sc.bg,color:sc.color,borderRadius:20,padding:'2px 8px'}}>{d.statut}</span>
                        {d.type_donateur==='interieur'&&<span style={{fontSize:9,background:VERT_CLAIR,color:VERT,borderRadius:20,padding:'2px 7px',fontWeight:600}}>Navs</span>}
                      </div>
                      <p style={{fontSize:11,color:'#94A3B8',margin:0}}>{d.quantite} {d.unite}{d.donateur&&` \u00b7 ${d.donateur}`}{d.valeur_estimee>0&&` \u00b7 ~${fmt(d.valeur_estimee)} FCFA`}</p>
                      {d.commission_id&&<p style={{fontSize:10,color:'#6D28D9',margin:'2px 0 0'}}>\u2192 {commissions.find(c=>c.id===d.commission_id)?.nom_commission||'Commission'}</p>}
                    </div>
                    <div style={{display:'flex',gap:5,flexShrink:0}}>
                      <button type="button" onClick={()=>openEditDonNature(d)} style={{width:24,height:24,borderRadius:7,background:VERT_CLAIR,border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                        <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke={VERT} strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      </button>
                      <button type="button" onClick={()=>supprimerDonNature(d.id)} style={{width:24,height:24,borderRadius:7,background:'#FEF2F2',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                        <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="#DC2626" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {onglet==='commissions'&&(
        <>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
            <p style={{fontSize:11,fontWeight:700,color:'#94A3B8',letterSpacing:'0.1em',margin:0}}>P\u00d4LES ({commissions.length})</p>
            <button type="button" onClick={()=>setShowCommission(!showCommission)} style={{width:30,height:30,borderRadius:'50%',background:showCommission?'#FEF2F2':VERT,color:'#fff',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:300}}>{showCommission?'\u00d7':'+'}</button>
          </div>
          {showCommission&&(<div style={{background:'#fff',border:'1px solid #E2E8F0',borderRadius:14,padding:'14px',marginBottom:12}}>
            <div style={{marginBottom:8}}><label className={lS}>Nom *</label><input type="text" value={commissionForm.nom_commission} onChange={e=>setCommissionForm(f=>({...f,nom_commission:e.target.value}))} placeholder="Ex: Restauration..." className={iS}/></div>
            <div style={{marginBottom:12}}><label className={lS}>Budget pr\u00e9visionnel (FCFA)</label><input type="number" value={commissionForm.budget_previsionnel} onChange={e=>setCommissionForm(f=>({...f,budget_previsionnel:e.target.value}))} className={iS}/></div>
            <div style={{display:'flex',gap:8}}><button type="button" onClick={()=>setShowCommission(false)} style={{...btnS,flex:1}}>Annuler</button><button type="button" onClick={saveCommission} disabled={saving} style={{...btnP,flex:1,opacity:saving?0.7:1}}>{saving?'...':'Ajouter'}</button></div>
          </div>)}
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {commissions.map(c=>{
              const{dep,alloue,sol,pct,depasse,warning,couleurBarre}=commStats(c)
              return(
                <div key={c.id} style={{background:'#fff',borderRadius:12,border:`1px solid ${depasse?'#FCA5A5':warning?'#FCD34D':'#E2E8F0'}`,padding:'12px 14px',cursor:'pointer'}} onClick={()=>setFicheCommission(c)}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <p style={{fontSize:13,fontWeight:700,color:'#1E293B',margin:0}}>{c.nom_commission}</p>
                      {depasse&&<span style={{fontSize:9,fontWeight:700,background:'#FEF2F2',color:'#DC2626',borderRadius:20,padding:'2px 7px'}}>\u26a0 D\u00c9PASSEMENT</span>}
                      {warning&&!depasse&&<span style={{fontSize:9,fontWeight:700,background:'#FFFBEB',color:'#D97706',borderRadius:20,padding:'2px 7px'}}>\u26a0 80%</span>}
                    </div>
                    <button type="button" onClick={e=>{e.stopPropagation();supprimerCommission(c.id)}} style={{width:24,height:24,borderRadius:6,background:'#FEF2F2',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="#DC2626" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6,marginBottom:10}}>
                    {[{label:'Pr\u00e9vu',val:fmt(c.budget_previsionnel||0),color:'#475569'},{label:'Allou\u00e9',val:fmt(alloue),color:VERT},{label:'D\u00e9pens\u00e9',val:fmt(dep),color:depasse?'#DC2626':'#1D4ED8'}].map(s=>(
                      <div key={s.label} style={{textAlign:'center',background:'#F8FAFC',borderRadius:8,padding:'6px 4px'}}>
                        <p style={{fontSize:13,fontWeight:700,color:s.color,margin:'0 0 1px'}}>{s.val}</p>
                        <p style={{fontSize:9,color:'#94A3B8',margin:0}}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{background:'#F1F5F9',borderRadius:4,height:5,marginBottom:5}}><div style={{background:couleurBarre,borderRadius:4,height:5,width:`${Math.min(pct,100)}%`,transition:'width .3s'}}/></div>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
                    <span style={{fontSize:9,color:couleurBarre,fontWeight:600}}>{pct}% consomm\u00e9</span>
                    <span style={{fontSize:9,color:sol>=0?'#065F46':'#DC2626',fontWeight:600}}>Solde : {sol>=0?'+':''}{fmt(sol)} FCFA</span>
                  </div>
                  {showAllouer===c.id?(
                    <div style={{display:'flex',gap:6}} onClick={e=>e.stopPropagation()}>
                      <input type="number" value={allouerMontant} onChange={e=>setAllouerMontant(e.target.value)} placeholder="Montant \u00e0 allouer" style={{...inpS,flex:1}}/>
                      <button type="button" onClick={()=>saveAllouer(c.id)} style={{background:VERT,color:'#fff',border:'none',borderRadius:8,padding:'6px 12px',fontSize:12,cursor:'pointer'}}>OK</button>
                      <button type="button" onClick={()=>setShowAllouer(null)} style={{background:'#F1F5F9',color:'#64748B',border:'none',borderRadius:8,padding:'6px 10px',fontSize:12,cursor:'pointer'}}>\u2715</button>
                    </div>
                  ):(
                    <button type="button" onClick={e=>{e.stopPropagation();setShowAllouer(c.id);setAllouerMontant(alloue||'')}} style={{background:'transparent',color:VERT,border:`1px solid ${VERT}`,borderRadius:8,padding:'5px 12px',fontSize:11,fontWeight:600,cursor:'pointer'}}>Modifier l'allocation</button>
                  )}
                  <p style={{fontSize:10,color:'#CBD5E1',margin:'8px 0 0',textAlign:'center'}}>Appuyer pour voir les d\u00e9penses \u2192</p>
                </div>
              )
            })}
            {commissions.length===0&&<p style={{fontSize:13,color:'#94A3B8',textAlign:'center',padding:'20px',margin:0}}>Aucune commission.</p>}
          </div>
        </>
      )}

      {onglet==='depenses'&&(
        <>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
            <div style={{display:'flex',gap:6,overflowX:'auto',scrollbarWidth:'none'}}>
              {[{k:'tout',l:'Tout'},{k:'mois',l:'Ce mois'},{k:'semaine',l:'Cette semaine'}].map(f=><button key={f.k} type="button" onClick={()=>setFiltreDateD(f.k)} style={dateChipS(filtreDateD===f.k)}>{f.l}</button>)}
            </div>
            <div style={{display:'flex',gap:6,flexShrink:0,marginLeft:8}}>
              <button type="button" onClick={()=>setVueDepenses(v=>v==='liste'?'groupee':'liste')} style={{fontSize:10,fontWeight:600,color:VERT,background:VERT_CLAIR,border:`1px solid ${VERT}`,borderRadius:20,padding:'4px 10px',cursor:'pointer'}}>{vueDepenses==='liste'?'Par commission':'Chronologique'}</button>
              <button type="button" onClick={()=>{setShowDepense(!showDepense);setEditDepenseId(null);setDepenseForm(EMPTY_D)}} style={{width:30,height:30,borderRadius:'50%',background:showDepense&&!editDepenseId?'#FEF2F2':VERT,color:'#fff',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:300}}>{showDepense&&!editDepenseId?'\u00d7':'+'}</button>
            </div>
          </div>
          {showDepense&&<FmrDepense/>}
          {vueDepenses==='liste'&&(
            <>
              <div style={{background:'#fff',borderRadius:12,border:'1px solid #E2E8F0',overflow:'hidden'}}>
                {depensesFiltrees.length===0&&<p style={{fontSize:13,color:'#94A3B8',textAlign:'center',padding:'20px',margin:0}}>Aucune d\u00e9pense.</p>}
                {depensesFiltrees.map((d,i)=><LigneD key={d.id} d={d} i={i} total={depensesFiltrees.length}/>)}
              </div>
              {hasMoreD&&filtreDateD==='tout'&&<button type="button" onClick={chargerPlusD} disabled={loadingMore} style={{width:'100%',marginTop:10,background:'#fff',color:VERT,border:`1px solid ${VERT}`,borderRadius:10,padding:'10px',fontSize:13,fontWeight:600,cursor:'pointer',opacity:loadingMore?0.7:1}}>{loadingMore?'Chargement...':'Charger plus'}</button>}
            </>
          )}
          {vueDepenses==='groupee'&&(
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {commissions.map(c=>{
                const deps=filtrerParDate(depenses.filter(d=>d.commission_id===c.id),'date_depense',filtreDateD)
                const{dep,alloue,sol,depasse,couleurBarre,pct}=commStats(c)
                return(
                  <div key={c.id} style={{background:'#fff',borderRadius:12,border:`1px solid ${depasse?'#FCA5A5':'#E2E8F0'}`,overflow:'hidden'}}>
                    <div style={{padding:'10px 14px',background:depasse?'#FEF2F2':'#F8FAFC',borderBottom:'1px solid #F1F5F9'}}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
                        <div style={{display:'flex',alignItems:'center',gap:6}}>
                          <p style={{fontSize:13,fontWeight:700,color:'#1E293B',margin:0}}>{c.nom_commission}</p>
                          {depasse&&<span style={{fontSize:9,fontWeight:700,background:'#FEF2F2',color:'#DC2626',borderRadius:20,padding:'2px 7px'}}>\u26a0</span>}
                        </div>
                        <span style={{fontSize:12,fontWeight:700,color:sol>=0?'#065F46':'#DC2626'}}>{sol>=0?'+':''}{fmt(sol)} FCFA</span>
                      </div>
                      <div style={{display:'flex',gap:12,marginBottom:5}}>
                        <span style={{fontSize:10,color:'#94A3B8'}}>Allou\u00e9 : <strong style={{color:VERT}}>{fmt(alloue)}</strong></span>
                        <span style={{fontSize:10,color:'#94A3B8'}}>D\u00e9pens\u00e9 : <strong style={{color:depasse?'#DC2626':'#1D4ED8'}}>{fmt(dep)}</strong></span>
                        <span style={{fontSize:10,color:'#94A3B8'}}>{pct}%</span>
                      </div>
                      <div style={{background:'#E2E8F0',borderRadius:4,height:3}}><div style={{background:couleurBarre,borderRadius:4,height:3,width:`${Math.min(pct,100)}%`}}/></div>
                    </div>
                    {deps.length===0?<p style={{fontSize:12,color:'#94A3B8',textAlign:'center',padding:'12px',margin:0}}>Aucune d\u00e9pense.</p>:deps.map((d,i)=><LigneD key={d.id} d={d} i={i} total={deps.length} showComm={false}/>)}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {onglet==='historique'&&(
        <>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
            <p style={{fontSize:11,fontWeight:700,color:'#94A3B8',letterSpacing:'0.1em',margin:0}}>RELEV\u00c9 ({historique.length})</p>
            <div style={{display:'flex',gap:6}}>
              <span style={{fontSize:11,fontWeight:600,color:'#065F46',background:'#ECFDF5',borderRadius:20,padding:'2px 10px'}}>+{fmt(totalRecettes)}</span>
              <span style={{fontSize:11,fontWeight:600,color:'#DC2626',background:'#FEF2F2',borderRadius:20,padding:'2px 10px'}}>-{fmt(totalDepenses)}</span>
            </div>
          </div>
          <div style={{background:'#fff',borderRadius:12,border:'1px solid #E2E8F0',overflow:'hidden'}}>
            {historique.length===0&&<p style={{fontSize:13,color:'#94A3B8',textAlign:'center',padding:'20px',margin:0}}>Aucune transaction.</p>}
            {historique.map((tx,i)=>{const isR=tx._type==='recette';return(
              <div key={`${tx._type}-${tx.id}`} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderBottom:i<historique.length-1?'1px solid #F1F5F9':'none'}}>
                <div style={{width:30,height:30,borderRadius:'50%',background:isR?'#ECFDF5':'#FEF2F2',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <span style={{fontSize:16,fontWeight:800,color:isR?'#065F46':'#DC2626',lineHeight:1}}>{isR?'+':'\u2212'}</span>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <p style={{fontSize:13,fontWeight:600,color:'#1E293B',margin:'0 0 1px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{tx._label}</p>
                  <p style={{fontSize:10,color:'#94A3B8',margin:0}}>{tx._sub&&`${tx._sub} \u00b7 `}{new Date(tx._date).toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'})}</p>
                </div>
                <p style={{fontSize:14,fontWeight:700,color:isR?'#065F46':'#DC2626',margin:0,flexShrink:0}}>{isR?'+':'-'}{fmt(tx._montant)}</p>
              </div>
            )})}
          </div>
        </>
      )}

      {ficheCommission&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:50,display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={()=>setFicheCommission(null)}>
          <div style={{background:'#F8FAFC',borderRadius:'20px 20px 0 0',width:'100%',maxWidth:480,maxHeight:'80vh',overflowY:'auto',paddingBottom:28}} onClick={e=>e.stopPropagation()}>
            <div style={{width:36,height:3,background:'#E2E8F0',borderRadius:2,margin:'14px auto 0'}}/>
            {(()=>{
              const{dep,alloue,sol,pct,depasse,warning,couleurBarre}=commStats(ficheCommission)
              const deps=depenses.filter(d=>d.commission_id===ficheCommission.id)
              return(
                <>
                  <div style={{padding:'14px 16px 0'}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                      <p style={{fontSize:17,fontWeight:700,color:'#1E293B',margin:0}}>{ficheCommission.nom_commission}</p>
                      {depasse&&<span style={{fontSize:9,fontWeight:700,background:'#FEF2F2',color:'#DC2626',borderRadius:20,padding:'2px 8px'}}>\u26a0 D\u00c9PASSEMENT</span>}
                      {warning&&!depasse&&<span style={{fontSize:9,fontWeight:700,background:'#FFFBEB',color:'#D97706',borderRadius:20,padding:'2px 8px'}}>\u26a0 80%</span>}
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6,marginBottom:10}}>
                      {[{label:'Allou\u00e9',val:fmt(alloue),color:VERT},{label:'D\u00e9pens\u00e9',val:fmt(dep),color:depasse?'#DC2626':'#1D4ED8'},{label:'Solde',val:`${sol>=0?'+':''}${fmt(sol)}`,color:sol>=0?'#065F46':'#DC2626'}].map(s=>(
                        <div key={s.label} style={{background:'#fff',borderRadius:10,border:'1px solid #E2E8F0',padding:'8px',textAlign:'center'}}>
                          <p style={{fontSize:14,fontWeight:700,color:s.color,margin:'0 0 2px'}}>{s.val}</p>
                          <p style={{fontSize:9,color:'#94A3B8',margin:0}}>{s.label}</p>
                        </div>
                      ))}
                    </div>
                    <div style={{background:'#F1F5F9',borderRadius:4,height:5,marginBottom:4}}><div style={{background:couleurBarre,borderRadius:4,height:5,width:`${Math.min(pct,100)}%`}}/></div>
                    <p style={{fontSize:10,color:couleurBarre,fontWeight:600,margin:'0 0 14px',textAlign:'right'}}>{pct}% consomm\u00e9</p>
                  </div>
                  <p style={{fontSize:10,fontWeight:700,color:'#94A3B8',letterSpacing:'0.1em',margin:'0 0 8px',padding:'0 16px',textTransform:'uppercase'}}>D\u00e9penses ({deps.length})</p>
                  <div style={{background:'#fff',borderRadius:12,border:'1px solid #E2E8F0',overflow:'hidden',margin:'0 16px'}}>
                    {deps.length===0&&<p style={{fontSize:13,color:'#94A3B8',textAlign:'center',padding:'16px',margin:0}}>Aucune d\u00e9pense.</p>}
                    {deps.map((d,i)=>(
                      <div key={d.id} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 14px',borderBottom:i<deps.length-1?'1px solid #F1F5F9':'none'}}>
                        <div style={{flex:1,minWidth:0}}>
                          <p style={{fontSize:13,fontWeight:500,color:'#1E293B',margin:'0 0 1px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.description}</p>
                          <p style={{fontSize:10,color:'#94A3B8',margin:0}}>{new Date(d.date_depense).toLocaleDateString('fr-FR')}{d.justificatif&&` \u00b7 ${d.justificatif}`}</p>
                        </div>
                        <p style={{fontSize:14,fontWeight:700,color:'#DC2626',margin:0,flexShrink:0}}>{fmt(d.montant)} FCFA</p>
                      </div>
                    ))}
                  </div>
                  <div style={{padding:'14px 16px 0'}}>
                    <button type="button" onClick={()=>setFicheCommission(null)} style={{...btnS,width:'100%'}}>Fermer</button>
                  </div>
                </>
              )
            })()}
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
