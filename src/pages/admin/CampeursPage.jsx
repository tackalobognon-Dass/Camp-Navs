import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/admin/AdminLayout'

const VERT = '#1B3B2B'
const VERT_CLAIR = '#E8F5E8'

function getMontantDu(ins) {
  if (ins.montant_personnalise != null) return ins.montant_personnalise
  return ins.tranche_age === 'Enfants & Adolescents' ? 25000 : 30000
}

function exportExcel(campeurs) {
  const wb = XLSX.utils.book_new()

  function buildData(liste) {
    return liste.map(ins => {
      const du = getMontantDu(ins)
      const paye = ins.statut_paiement === 'payé' ? du : (ins.montant_paye || 0)
      return {
        'Nom complet':          ins.nom_complet || '',
        'Genre':                ins.genre || '',
        'Téléphone':            ins.telephone || '',
        'Catégorie':            ins.tranche_age || '',
        'Tranche âge':          ins.tranche_age_detail || '',
        'Occupation':           ins.occupation || '',
        'Pays':                 ins.pays || '',
        'Ville':                ins.ville || '',
        'Commune':              ins.commune || '',
        'Statut paiement':      ins.statut_paiement || '',
        'Montant dû (FCFA)':    du,
        'Montant payé (FCFA)':  paye,
        'Reste (FCFA)':         Math.max(du - paye, 0),
        'Réduction':            ins.montant_personnalise != null ? 'Oui' : 'Non',
        'Taille polo':          ins.taille_tshirt || '',
        'Antécédents médicaux': ins.antecedents_medicaux || '',
        'Contact urgence':      ins.contact_urgence || '',
        'Invité par':           ins.nom_inviteur || '',
        'Déjà participé':       ins.deja_participe || '',
        'Motivation':           ins.motivation || '',
        'Date inscription':     new Date(ins.created_at).toLocaleDateString('fr-FR'),
      }
    })
  }

  const tous    = buildData(campeurs)
  const jeunes  = buildData(campeurs.filter(i => i.tranche_age === 'Jeunes & Adultes'))
  const enfants = buildData(campeurs.filter(i => i.tranche_age === 'Enfants & Adolescents'))

  const totalDu    = campeurs.reduce((s, i) => s + getMontantDu(i), 0)
  const totalPaye  = campeurs.reduce((s, i) => { const du = getMontantDu(i); return s + (i.statut_paiement === 'payé' ? du : (i.montant_paye || 0)) }, 0)
  const resume = [
    { 'Indicateur': 'Total inscrits',         'Valeur': campeurs.length },
    { 'Indicateur': 'Jeunes & Adultes',        'Valeur': campeurs.filter(i => i.tranche_age === 'Jeunes & Adultes').length },
    { 'Indicateur': 'Enfants & Adolescents',   'Valeur': campeurs.filter(i => i.tranche_age === 'Enfants & Adolescents').length },
    { 'Indicateur': 'Payés',                   'Valeur': campeurs.filter(i => i.statut_paiement === 'payé').length },
    { 'Indicateur': 'Partiels',                'Valeur': campeurs.filter(i => i.statut_paiement === 'partiel').length },
    { 'Indicateur': 'En attente',              'Valeur': campeurs.filter(i => i.statut_paiement === 'en attente').length },
    { 'Indicateur': 'Montant total dû (FCFA)', 'Valeur': totalDu },
    { 'Indicateur': 'Montant collecté (FCFA)', 'Valeur': totalPaye },
    { 'Indicateur': 'Reste à collecter (FCFA)','Valeur': totalDu - totalPaye },
  ]

  const wsAll    = XLSX.utils.json_to_sheet(tous)
  const wsJeunes = XLSX.utils.json_to_sheet(jeunes)
  const wsEnfants= XLSX.utils.json_to_sheet(enfants)
  const wsResume = XLSX.utils.json_to_sheet(resume)

  // Largeur des colonnes
  const colWidth = col => ({ wch: Math.max(...col.map(v => String(v || '').length), 12) })
  const setWidths = (ws, data) => {
    if (!data.length) return
    ws['!cols'] = Object.keys(data[0]).map(k => colWidth([k, ...data.map(r => r[k])]))
  }
  setWidths(wsAll, tous)
  setWidths(wsJeunes, jeunes)
  setWidths(wsEnfants, enfants)
  wsResume['!cols'] = [{ wch: 30 }, { wch: 15 }]

  XLSX.utils.book_append_sheet(wb, wsAll,     'Tous les campeurs')
  XLSX.utils.book_append_sheet(wb, wsJeunes,  'Jeunes & Adultes')
  XLSX.utils.book_append_sheet(wb, wsEnfants, 'Enfants & Adolescents')
  XLSX.utils.book_append_sheet(wb, wsResume,  'Résumé financier')

  const now = new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')
  XLSX.writeFile(wb, `Campeurs_CampNavs2026_${now}.xlsx`)
}

function envoyerWhatsApp(ins, versements) {
  const du = getMontantDu(ins)
  const totalVerse = versements.reduce((s, v) => s + v.montant, 0)
  const reste = Math.max(du - totalVerse, 0)
  const tel = ins.telephone?.replace(/\s/g, '').replace(/^0/, '225')
  let message = ''
  if (totalVerse === 0) {
    message = `Bonjour ${ins.nom_complet},\n\nVotre inscription au Camp-Navs 2026 est bien enregistrée.\n\nMontant à payer : ${du.toLocaleString()} FCFA\n\nPaiement via Wave ou Orange Money :\n- Bureau Navigateurs : 07 78 48 48 79\n- Mme OBODJI : 07 09 62 62 65\n\nMerci et à bientôt !`
  } else if (reste > 0) {
    const detail = versements.map(v => `  • ${new Date(v.date_versement).toLocaleDateString('fr-FR')} : ${v.montant.toLocaleString()} FCFA`).join('\n')
    message = `Bonjour ${ins.nom_complet},\n\nVos versements pour le Camp-Navs 2026 :\n\n${detail}\n\nTotal versé : ${totalVerse.toLocaleString()} FCFA\nReste à payer : ${reste.toLocaleString()} FCFA\n\nMerci d'effectuer le solde via :\n- Bureau Navigateurs : 07 78 48 48 79\n- Mme OBODJI : 07 09 62 62 65`
  } else {
    message = `Bonjour ${ins.nom_complet},\n\nFélicitations ! Votre paiement de ${du.toLocaleString()} FCFA est complet.\n\nVotre place au Camp-Navs 2026 est confirmée. À La Sablière, Bingerville du 23 au 29 août 2026 !`
  }
  window.open(`https://wa.me/${tel}?text=${encodeURIComponent(message)}`, '_blank')
}

const STATUT_CONFIG = {
  'payé':       { bg: '#DCFCE7', color: '#166534', border: '#86EFAC', label: 'Payé' },
  'en attente': { bg: '#FEF9C3', color: '#854D0E', border: '#FDE047', label: 'En attente' },
  'partiel':    { bg: '#DBEAFE', color: '#1E40AF', border: '#93C5FD', label: 'Partiel' },
}

function InfoLigne({ label, valeur }) {
  if (!valeur) return null
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '9px 0', borderBottom: '1px solid #F1F5F9' }}>
      <span style={{ fontSize: 12, color: '#64748B', flexShrink: 0, marginRight: 12 }}>{label}</span>
      <span style={{ fontSize: 12, color: '#1E293B', fontWeight: 500, textAlign: 'right', lineHeight: 1.45 }}>{valeur}</span>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <p style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 6px' }}>{title}</p>
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #F1F5F9', padding: '0 14px' }}>
        {children}
      </div>
    </div>
  )
}

export default function CampeursPage() {
  const [campeurs, setCampeurs] = useState([])
  const [loading, setLoading] = useState(true)
  const [recherche, setRecherche] = useState('')
  const [filtreStatut, setFiltreStatut] = useState('tous')
  const [filtreCategorie, setFiltreCategorie] = useState('tous')
  const [ficheOuverte, setFicheOuverte] = useState(null)
  const [versements, setVersements] = useState([])
  const [editMontantPerso, setEditMontantPerso] = useState('')
  const [saving, setSaving] = useState(false)
  const [savingReduction, setSavingReduction] = useState(false)
  const [showAddVersement, setShowAddVersement] = useState(false)
  const [versementForm, setVersementForm] = useState({ montant: '', date_versement: new Date().toISOString().split('T')[0], note: '' })

  useEffect(() => { fetchCampeurs() }, [])

  async function fetchCampeurs() {
    const { data } = await supabase.from('inscriptions').select('*').order('created_at', { ascending: false })
    setCampeurs(data || [])
    setLoading(false)
  }

  async function ouvrirFiche(ins) {
    setFicheOuverte(ins)
    setEditMontantPerso(ins.montant_personnalise != null ? ins.montant_personnalise : '')
    setShowAddVersement(false)
    setVersementForm({ montant: '', date_versement: new Date().toISOString().split('T')[0], note: '' })
    const { data } = await supabase.from('versements').select('*').eq('inscription_id', ins.id).order('date_versement', { ascending: true })
    setVersements(data || [])
  }

  async function ajouterVersement() {
    if (!versementForm.montant || !ficheOuverte) return
    setSaving(true)
    try {
      const montant = parseInt(versementForm.montant)
      await supabase.from('versements').insert([{ inscription_id: ficheOuverte.id, montant, date_versement: versementForm.date_versement, note: versementForm.note }])
      const { data: allV } = await supabase.from('versements').select('*').eq('inscription_id', ficheOuverte.id)
      const totalVerse = (allV || []).reduce((s, v) => s + v.montant, 0)
      const du = editMontantPerso !== '' ? parseInt(editMontantPerso) : getMontantDu(ficheOuverte)
      const statut = totalVerse >= du ? 'payé' : 'partiel'
      await supabase.from('inscriptions').update({ montant_paye: totalVerse, statut_paiement: statut, montant_personnalise: editMontantPerso !== '' ? parseInt(editMontantPerso) : null }).eq('id', ficheOuverte.id)
      setVersementForm({ montant: '', date_versement: new Date().toISOString().split('T')[0], note: '' })
      setShowAddVersement(false)
      const { data: newV } = await supabase.from('versements').select('*').eq('inscription_id', ficheOuverte.id).order('date_versement', { ascending: true })
      setVersements(newV || [])
      fetchCampeurs()
      try {
        const { data: existante } = await supabase.from('recettes').select('id').eq('description', `Inscription — ${ficheOuverte.nom_complet}`).single()
        if (existante) await supabase.from('recettes').update({ montant: totalVerse }).eq('id', existante.id)
        else await supabase.from('recettes').insert([{ type: 'frais_participation', description: `Inscription — ${ficheOuverte.nom_complet}`, montant: totalVerse, donateur: ficheOuverte.nom_complet, date_reception: versementForm.date_versement }])
      } catch (_) {}
    } catch (err) { console.error(err) }
    finally { setSaving(false) }
  }

  async function supprimerVersement(id) {
    if (!window.confirm('Supprimer ce versement ?')) return
    await supabase.from('versements').delete().eq('id', id)
    const { data } = await supabase.from('versements').select('*').eq('inscription_id', ficheOuverte.id).order('date_versement', { ascending: true })
    setVersements(data || [])
    const totalVerse = (data || []).reduce((s, v) => s + v.montant, 0)
    const du = editMontantPerso !== '' ? parseInt(editMontantPerso) : getMontantDu(ficheOuverte)
    await supabase.from('inscriptions').update({ montant_paye: totalVerse, statut_paiement: totalVerse >= du ? 'payé' : totalVerse > 0 ? 'partiel' : 'en attente' }).eq('id', ficheOuverte.id)
    fetchCampeurs()
  }

  async function saveReduction() {
    if (!ficheOuverte) return
    setSavingReduction(true)
    const montantPerso = editMontantPerso !== '' ? parseInt(editMontantPerso) : null
    await supabase.from('inscriptions').update({ montant_personnalise: montantPerso }).eq('id', ficheOuverte.id)
    setFicheOuverte(prev => ({ ...prev, montant_personnalise: montantPerso }))
    setSavingReduction(false)
    fetchCampeurs()
  }

  async function supprimerCampeur(id) {
    if (!window.confirm('Supprimer cette inscription définitivement ?')) return
    await supabase.from('inscriptions').delete().eq('id', id)
    setFicheOuverte(null)
    fetchCampeurs()
  }

  const filtres = campeurs
    .filter(i => filtreStatut === 'tous' || i.statut_paiement === filtreStatut)
    .filter(i => filtreCategorie === 'tous' || i.tranche_age === filtreCategorie)
    .filter(i => i.nom_complet?.toLowerCase().includes(recherche.toLowerCase()) || i.telephone?.includes(recherche))

  const total         = campeurs.length
  const nbJeunes      = campeurs.filter(i => i.tranche_age === 'Jeunes & Adultes').length
  const nbEnfants     = campeurs.filter(i => i.tranche_age === 'Enfants & Adolescents').length
  const nbPaye        = campeurs.filter(i => i.statut_paiement === 'payé').length
  const nbAttente     = campeurs.filter(i => i.statut_paiement === 'en attente').length
  const nbPartiel     = campeurs.filter(i => i.statut_paiement === 'partiel').length
  const montantCollecte = campeurs.reduce((s, i) => { const du = getMontantDu(i); return s + (i.statut_paiement === 'payé' ? du : (i.montant_paye || 0)) }, 0)
  const montantTotal  = campeurs.reduce((s, i) => s + getMontantDu(i), 0)

  const duFiche       = ficheOuverte ? (editMontantPerso !== '' ? parseInt(editMontantPerso) : getMontantDu(ficheOuverte)) : 0
  const totalVerse    = versements.reduce((s, v) => s + v.montant, 0)
  const resteFiche    = Math.max(duFiche - totalVerse, 0)

  const chipS = (active) => ({
    flexShrink: 0, padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
    cursor: 'pointer', border: `1px solid ${active ? VERT : '#E2E8F0'}`,
    background: active ? VERT : '#fff', color: active ? '#fff' : '#64748B',
  })
  const iS = { width: '100%', border: '1px solid #E2E8F0', borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none', background: '#fff', color: '#1E293B' }

  return (
    <AdminLayout>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#F8FAFC', overflow: 'hidden' }}>

        {/* ── HEADER FIXE ── */}
        <div style={{ flexShrink: 0, padding: '14px 14px 10px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC', zIndex: 2, position: 'relative', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1E293B', margin: 0 }}>Campeurs</h1>
              <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 0' }}>{total} inscrit(s) · {montantCollecte.toLocaleString()} FCFA collectés</p>
            </div>
            <button type="button" onClick={() => exportExcel(campeurs)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, background: VERT, color: '#fff', border: 'none', borderRadius: 10, padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              Excel
            </button>
          </div>

          {/* Recherche */}
          <div style={{ position: 'relative', marginBottom: 8 }}>
            <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#94A3B8" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input type="text" value={recherche} onChange={e => setRecherche(e.target.value)}
              placeholder="Rechercher par nom ou téléphone..."
              style={{ ...iS, paddingLeft: 30, fontSize: 12 }} />
          </div>

          {/* Filtres */}
          <div style={{ display: 'flex', gap: 5, overflowX: 'auto', scrollbarWidth: 'none', marginBottom: 5 }}>
            {[{ k: 'tous', l: `Tous (${total})` }, { k: 'Jeunes & Adultes', l: `Jeunes (${nbJeunes})` }, { k: 'Enfants & Adolescents', l: `Enfants (${nbEnfants})` }].map(f => (
              <button key={f.k} type="button" onClick={() => setFiltreCategorie(f.k)} style={chipS(filtreCategorie === f.k)}>{f.l}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 5, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {[{ k: 'tous', l: 'Tous' }, { k: 'payé', l: `Payés (${nbPaye})` }, { k: 'partiel', l: `Partiels (${nbPartiel})` }, { k: 'en attente', l: `En attente (${nbAttente})` }].map(f => (
              <button key={f.k} type="button" onClick={() => setFiltreStatut(f.k)} style={chipS(filtreStatut === f.k)}>{f.l}</button>
            ))}
          </div>
        </div>

        {/* ── ZONE SCROLLABLE ── */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '10px 14px 14px' }}>

          {/* KPI */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 12 }}>
            {[
              { val: nbPaye,    label: 'Payés',      bg: '#F0FDF4', color: '#166534', border: '#86EFAC' },
              { val: nbPartiel, label: 'Partiels',   bg: '#EFF6FF', color: '#1D4ED8', border: '#93C5FD' },
              { val: nbAttente, label: 'En attente', bg: '#FFFBEB', color: '#92400E', border: '#FCD34D' },
            ].map(s => (
              <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: '10px 8px', border: `1px solid ${s.border}`, textAlign: 'center' }}>
                <p style={{ fontSize: 20, fontWeight: 700, color: s.color, margin: '0 0 2px' }}>{s.val}</p>
                <p style={{ fontSize: 10, color: s.color, margin: 0, opacity: 0.8 }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Barre collecte */}
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #E2E8F0', padding: '10px 14px', marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 11, color: '#64748B' }}>Collecté</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: VERT }}>{montantCollecte.toLocaleString()} / {montantTotal.toLocaleString()} FCFA</span>
            </div>
            <div style={{ background: '#F1F5F9', borderRadius: 4, height: 5 }}>
              <div style={{ background: VERT, borderRadius: 4, height: 5, width: `${montantTotal > 0 ? Math.round((montantCollecte / montantTotal) * 100) : 0}%`, transition: 'width .4s' }} />
            </div>
            <p style={{ fontSize: 10, color: '#94A3B8', margin: '4px 0 0', textAlign: 'right' }}>
              {montantTotal > 0 ? Math.round((montantCollecte / montantTotal) * 100) : 0}% · Reste : {(montantTotal - montantCollecte).toLocaleString()} FCFA
            </p>
          </div>

          {loading && <p style={{ textAlign: 'center', fontSize: 13, color: '#94A3B8', padding: '30px 0' }}>Chargement...</p>}

          {/* Liste */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtres.map(ins => {
              const sc  = STATUT_CONFIG[ins.statut_paiement] || STATUT_CONFIG['en attente']
              const du  = getMontantDu(ins)
              const paye = ins.statut_paiement === 'payé' ? du : (ins.montant_paye || 0)
              const reste = Math.max(du - paye, 0)
              return (
                <div key={ins.id} onClick={() => ouvrirFiche(ins)}
                  style={{ background: '#fff', borderRadius: 12, border: '1px solid #F1F5F9', padding: '11px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: VERT_CLAIR, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: VERT }}>{ins.nom_complet?.charAt(0)}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ins.nom_complet}</p>
                      {ins.montant_personnalise != null && (
                        <span style={{ fontSize: 9, fontWeight: 600, background: '#F3E8FF', color: '#7C3AED', borderRadius: 20, padding: '1px 6px', flexShrink: 0 }}>Réduction</span>
                      )}
                    </div>
                    <p style={{ fontSize: 11, color: '#64748B', margin: 0 }}>
                      {ins.telephone} · {ins.tranche_age === 'Jeunes & Adultes' ? 'Jeune/Adulte' : 'Enfant/Ado'}
                      {ins.taille_tshirt && ` · Polo ${ins.taille_tshirt}`}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, borderRadius: 20, padding: '2px 9px', display: 'block', marginBottom: 3 }}>
                      {sc.label}
                    </span>
                    <p style={{ fontSize: 11, color: reste > 0 ? '#92400E' : '#166534', margin: 0, fontWeight: 500 }}>
                      {reste > 0 ? `-${reste.toLocaleString()}` : '✓ Soldé'}
                    </p>
                  </div>
                </div>
              )
            })}
            {!loading && filtres.length === 0 && (
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #F1F5F9', padding: '32px', textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>Aucun campeur trouvé.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── FICHE DÉTAILLÉE ── */}
      {ficheOuverte && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={() => setFicheOuverte(null)}>
          <div style={{ background: '#F8FAFC', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 480, maxHeight: '92vh', overflowY: 'auto', padding: '0 0 28px' }}
            onClick={e => e.stopPropagation()}>

            {/* Poignée */}
            <div style={{ width: 36, height: 3, background: '#E2E8F0', borderRadius: 2, margin: '14px auto 0' }} />

            {/* En-tête */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px 14px', borderBottom: '1px solid #F1F5F9' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: VERT_CLAIR, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: VERT }}>{ficheOuverte.nom_complet?.charAt(0)}</span>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#1E293B', margin: '0 0 2px' }}>{ficheOuverte.nom_complet}</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10, color: '#64748B' }}>{ficheOuverte.genre}</span>
                  <span style={{ fontSize: 10, color: '#CBD5E1' }}>·</span>
                  <span style={{ fontSize: 10, color: '#64748B' }}>{ficheOuverte.tranche_age === 'Jeunes & Adultes' ? 'Jeune / Adulte' : 'Enfant / Ado'}</span>
                  {ficheOuverte.tranche_age_detail && <><span style={{ fontSize: 10, color: '#CBD5E1' }}>·</span><span style={{ fontSize: 10, color: '#64748B' }}>{ficheOuverte.tranche_age_detail}</span></>}
                </div>
              </div>
              {(() => { const sc = STATUT_CONFIG[ficheOuverte.statut_paiement] || STATUT_CONFIG['en attente']; return (
                <span style={{ fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, borderRadius: 20, padding: '3px 10px', flexShrink: 0 }}>{sc.label}</span>
              )})()}
            </div>

            <div style={{ padding: '12px 16px 0' }}>

              {/* Paiement */}
              <Section title="Paiement">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0, padding: '12px 0' }}>
                  {[
                    { val: duFiche.toLocaleString(), label: 'Dû', color: '#1E293B' },
                    { val: totalVerse.toLocaleString(), label: 'Versé', color: '#166534' },
                    { val: resteFiche.toLocaleString(), label: 'Reste', color: resteFiche > 0 ? '#92400E' : '#166534' },
                  ].map((s, i) => (
                    <div key={s.label} style={{ textAlign: 'center', borderRight: i < 2 ? '1px solid #F1F5F9' : 'none' }}>
                      <p style={{ fontSize: 16, fontWeight: 700, color: s.color, margin: '0 0 2px' }}>{s.val}</p>
                      <p style={{ fontSize: 10, color: '#94A3B8', margin: 0 }}>{s.label} FCFA</p>
                    </div>
                  ))}
                </div>
              </Section>

              {/* Versements */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <p style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>Versements ({versements.length})</p>
                  <button type="button" onClick={() => setShowAddVersement(!showAddVersement)}
                    style={{ background: showAddVersement ? '#FEF2F2' : VERT, color: '#fff', border: 'none', borderRadius: 8, padding: '4px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    {showAddVersement ? '×' : '+ Ajouter'}
                  </button>
                </div>
                {showAddVersement && (
                  <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, padding: 14, marginBottom: 8 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                      <div>
                        <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4 }}>Montant (FCFA)</label>
                        <input type="number" value={versementForm.montant} onChange={e => setVersementForm(f => ({ ...f, montant: e.target.value }))} placeholder="Ex : 15000" style={iS} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4 }}>Date</label>
                        <input type="date" value={versementForm.date_versement} onChange={e => setVersementForm(f => ({ ...f, date_versement: e.target.value }))} style={iS} />
                      </div>
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4 }}>Note</label>
                      <input type="text" value={versementForm.note} onChange={e => setVersementForm(f => ({ ...f, note: e.target.value }))} placeholder="Ex : Paiement Wave" style={iS} />
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" onClick={() => setShowAddVersement(false)} style={{ flex: 1, background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 8, padding: 10, fontSize: 13, cursor: 'pointer' }}>Annuler</button>
                      <button type="button" onClick={ajouterVersement} disabled={saving || !versementForm.montant} style={{ flex: 1, background: VERT, color: '#fff', border: 'none', borderRadius: 8, padding: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                        {saving ? '...' : 'Enregistrer'}
                      </button>
                    </div>
                  </div>
                )}
                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #F1F5F9', overflow: 'hidden' }}>
                  {versements.length === 0
                    ? <p style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center', padding: '14px', margin: 0 }}>Aucun versement.</p>
                    : versements.map((v, i) => (
                      <div key={v.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: i < versements.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 600, color: '#166534', margin: '0 0 2px' }}>{v.montant.toLocaleString()} FCFA</p>
                          <p style={{ fontSize: 11, color: '#64748B', margin: 0 }}>{new Date(v.date_versement).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}{v.note ? ` · ${v.note}` : ''}</p>
                        </div>
                        <button type="button" onClick={() => supprimerVersement(v.id)} style={{ width: 28, height: 28, borderRadius: 8, background: '#FEF2F2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#DC2626" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                      </div>
                    ))
                  }
                </div>
              </div>

              {/* Réduction */}
              <div style={{ marginBottom: 18 }}>
                <p style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 6px' }}>Montant personnalisé (réduction)</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="number" value={editMontantPerso} onChange={e => setEditMontantPerso(e.target.value)}
                    placeholder={`Standard : ${ficheOuverte.tranche_age === 'Enfants & Adolescents' ? '25 000' : '30 000'} FCFA`}
                    style={{ ...iS, flex: 1 }} />
                  <button type="button" onClick={saveReduction} disabled={savingReduction}
                    style={{ background: VERT, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    {savingReduction ? '...' : 'OK'}
                  </button>
                </div>
              </div>

              {/* Infos personnelles */}
              <Section title="Informations personnelles">
                <InfoLigne label="Téléphone"    valeur={ficheOuverte.telephone} />
                <InfoLigne label="Occupation"   valeur={ficheOuverte.occupation} />
                <InfoLigne label="Ville"        valeur={ficheOuverte.ville} />
                <InfoLigne label="Commune"      valeur={ficheOuverte.commune} />
              </Section>

              {/* Logistique & santé */}
              <Section title="Logistique & Santé">
                <InfoLigne label="Taille polo"        valeur={ficheOuverte.taille_tshirt} />
                <InfoLigne label="Contact urgence"    valeur={ficheOuverte.nom_urgence ? `${ficheOuverte.nom_urgence} — ${ficheOuverte.tel_urgence}` : ficheOuverte.contact_urgence} />
                <InfoLigne label="Antécédents méd."   valeur={ficheOuverte.antecedents_medicaux} />
                <InfoLigne label="Déjà participé"     valeur={ficheOuverte.deja_participe} />
                <InfoLigne label="Invité par"         valeur={ficheOuverte.nom_inviteur} />
                <InfoLigne label="Inscrit le"         valeur={new Date(ficheOuverte.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} />
              </Section>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button type="button" onClick={() => supprimerCampeur(ficheOuverte.id)}
                  style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', borderRadius: 10, padding: '11px 14px', fontSize: 13, cursor: 'pointer' }}>
                  Supprimer
                </button>
                <button type="button" onClick={() => envoyerWhatsApp(ficheOuverte, versements)}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: '#25D366', color: '#fff', border: 'none', borderRadius: 10, padding: '11px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.859L.057 23.625a.5.5 0 00.612.612l5.766-1.476A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.9 0-3.7-.514-5.253-1.408l-.375-.223-3.886.995 1.013-3.786-.244-.388A9.955 9.955 0 012 12c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10z"/></svg>
                  WhatsApp
                </button>
                <button type="button" onClick={() => setFicheOuverte(null)}
                  style={{ background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 10, padding: '11px 14px', fontSize: 13, cursor: 'pointer' }}>
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
