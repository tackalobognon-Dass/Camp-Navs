import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/admin/AdminLayout'

const VERT = '#1B3B2B'
const VERT_CLAIR = '#E8F5E8'

function getMontantDu(ins) {
  if (ins.montant_personnalise != null) return ins.montant_personnalise
  return ins.tranche_age === 'Enfants & Adolescents' ? 25000 : 30000
}

function exportExcel(campeurs) {
  const now = new Date().toLocaleDateString('fr-FR')
  function buildRows(liste) {
    return liste.map(ins => {
      const du = getMontantDu(ins)
      const paye = ins.statut_paiement === 'payé' ? du : (ins.montant_paye || 0)
      const reste = Math.max(du - paye, 0)
      return [ins.nom_complet || '', ins.genre || '', ins.telephone || '', ins.tranche_age || '', ins.tranche_age_detail || '', ins.statut_paiement || '', du, paye, reste, ins.montant_personnalise != null ? 'Oui' : 'Non', ins.occupation || '', ins.lieu_habitation || '', ins.taille_tshirt || '', ins.contact_urgence || '', ins.invite || '', new Date(ins.created_at).toLocaleDateString('fr-FR')]
    })
  }
  const jeunes = campeurs.filter(i => i.tranche_age === 'Jeunes & Adultes')
  const enfants = campeurs.filter(i => i.tranche_age === 'Enfants & Adolescents')
  const totalDu = campeurs.reduce((s, i) => s + getMontantDu(i), 0)
  const totalPaye = campeurs.reduce((s, i) => { const du = getMontantDu(i); return s + (i.statut_paiement === 'payé' ? du : (i.montant_paye || 0)) }, 0)
  const entetes = ['Nom', 'Genre', 'Téléphone', 'Catégorie', 'Tranche âge', 'Statut', 'Montant dû', 'Montant payé', 'Reste', 'Réduction', 'Occupation', 'Lieu', 'T-shirt', 'Contact urgence', 'Invité', 'Date inscription']
  const lignes = [['CAMP-NAVS 2026 — LISTE COMPLÈTE'], [`Exporté le ${now}`], [], ['TOUS LES CAMPEURS'], entetes, ...buildRows(campeurs), [], [], ['JEUNES & ADULTES'], entetes, ...buildRows(jeunes), [], [], ['ENFANTS & ADOLESCENTS'], entetes, ...buildRows(enfants), [], [], ['RÉSUMÉ FINANCIER'], [], ['Total inscrits', campeurs.length], ['Payés', campeurs.filter(i => i.statut_paiement === 'payé').length], ['En attente', campeurs.filter(i => i.statut_paiement === 'en attente').length], ['Partiels', campeurs.filter(i => i.statut_paiement === 'partiel').length], ['Montant total dû', `${totalDu.toLocaleString()} FCFA`], ['Montant total collecté', `${totalPaye.toLocaleString()} FCFA`], ['Montant restant', `${(totalDu - totalPaye).toLocaleString()} FCFA`]]
  const csv = '\uFEFF' + lignes.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Campeurs_CampNavs2026_${now.replace(/\//g, '-')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function envoyerWhatsApp(ins, versements) {
  const du = getMontantDu(ins)
  const totalVerse = versements.reduce((s, v) => s + v.montant, 0)
  const reste = Math.max(du - totalVerse, 0)
  const tel = ins.telephone?.replace(/\s/g, '').replace(/^0/, '225')
  let message = ''
  if (ins.statut_paiement === 'en attente' || totalVerse === 0) {
    message = `Bonjour ${ins.nom_complet},\n\nNous vous rappelons que votre inscription au Camp-Navs 2026 est enregistrée.\n\nMontant à payer : ${du.toLocaleString()} FCFA\n\nVeuillez effectuer votre paiement via :\n- Wave / Orange Money → Bureau Navigateurs : 07 78 48 48 79\n- ou Mme OBODJI : 07 09 62 62 65\n\nMerci et à bientôt au camp !`
  } else if (reste > 0) {
    const detailVersements = versements.map(v => `  • ${new Date(v.date_versement).toLocaleDateString('fr-FR')} : ${v.montant.toLocaleString()} FCFA`).join('\n')
    message = `Bonjour ${ins.nom_complet},\n\nVoici le récapitulatif de vos paiements pour le Camp-Navs 2026 :\n\n${detailVersements}\n\nTotal versé : ${totalVerse.toLocaleString()} FCFA\nReste à payer : ${reste.toLocaleString()} FCFA\n\nMerci d'effectuer le solde via :\n- Bureau Navigateurs : 07 78 48 48 79\n- Mme OBODJI : 07 09 62 62 65`
  } else {
    message = `Bonjour ${ins.nom_complet},\n\nFélicitations ! Votre paiement de ${du.toLocaleString()} FCFA pour le Camp-Navs 2026 est complet.\n\nVotre place est confirmée. Nous avons hâte de vous accueillir à La Sablière, Bingerville du 23 au 29 août 2026 !\n\nÀ très bientôt !`
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
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
      <span style={{ fontSize: 13, color: '#64748B', flexShrink: 0, marginRight: 12 }}>{label}</span>
      <span style={{ fontSize: 13, color: '#1E293B', fontWeight: 500, textAlign: 'right', lineHeight: 1.45 }}>{valeur}</span>
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
      // Fermer immédiatement
      setVersementForm({ montant: '', date_versement: new Date().toISOString().split('T')[0], note: '' })
      setShowAddVersement(false)
      const { data: newV } = await supabase.from('versements').select('*').eq('inscription_id', ficheOuverte.id).order('date_versement', { ascending: true })
      setVersements(newV || [])
      fetchCampeurs()
      // Recettes en arrière-plan
      try {
        const { data: existante } = await supabase.from('recettes').select('id').eq('description', `Inscription — ${ficheOuverte.nom_complet}`).single()
        if (existante) { await supabase.from('recettes').update({ montant: totalVerse }).eq('id', existante.id) }
        else { await supabase.from('recettes').insert([{ type: 'frais_participation', description: `Inscription — ${ficheOuverte.nom_complet}`, montant: totalVerse, donateur: ficheOuverte.nom_complet, date_reception: versementForm.date_versement }]) }
      } catch (_) {}
    } catch (err) {
      console.error('Erreur versement:', err)
    } finally {
      setSaving(false)
    }
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
    await supabase.from('inscriptions').update({ montant_personnalise: editMontantPerso !== '' ? parseInt(editMontantPerso) : null }).eq('id', ficheOuverte.id)
    setSavingReduction(false)
    fetchCampeurs()
  }

  async function supprimerCampeur(id) {
    if (!window.confirm('Supprimer cette inscription ?')) return
    await supabase.from('inscriptions').delete().eq('id', id)
    setFicheOuverte(null)
    fetchCampeurs()
  }

  const filtres = campeurs
    .filter(i => filtreStatut === 'tous' || i.statut_paiement === filtreStatut)
    .filter(i => filtreCategorie === 'tous' || i.tranche_age === filtreCategorie)
    .filter(i => i.nom_complet?.toLowerCase().includes(recherche.toLowerCase()) || i.telephone?.includes(recherche))

  const total = campeurs.length
  const jeunes = campeurs.filter(i => i.tranche_age === 'Jeunes & Adultes').length
  const enfants = campeurs.filter(i => i.tranche_age === 'Enfants & Adolescents').length
  const nbPaye = campeurs.filter(i => i.statut_paiement === 'payé').length
  const nbAttente = campeurs.filter(i => i.statut_paiement === 'en attente').length
  const montantCollecte = campeurs.reduce((s, i) => { const du = getMontantDu(i); return s + (i.statut_paiement === 'payé' ? du : (i.montant_paye || 0)) }, 0)

  const du = ficheOuverte ? (editMontantPerso !== '' ? parseInt(editMontantPerso) : getMontantDu(ficheOuverte)) : 0
  const totalVerse = versements.reduce((s, v) => s + v.montant, 0)
  const reste = Math.max(du - totalVerse, 0)

  const chipStyle = (active) => ({
    flexShrink: 0, padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
    cursor: 'pointer', border: `1px solid ${active ? VERT : '#E2E8F0'}`,
    background: active ? VERT : '#fff', color: active ? '#fff' : '#64748B',
  })

  return (
    <AdminLayout>
      {/* KPI 2x2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        {[
          { val: total, label: 'Total inscrits', bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
          { val: nbPaye, label: 'Payés', bg: '#F0FDF4', color: '#166534', border: '#86EFAC' },
          { val: nbAttente, label: 'En attente', bg: '#FFFBEB', color: '#92400E', border: '#FCD34D' },
          { val: montantCollecte.toLocaleString(), label: 'FCFA collectés', bg: '#ECFDF5', color: '#065F46', border: '#6EE7B7', small: true },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: '14px 16px', border: `1px solid ${s.border}` }}>
            <p style={{ fontSize: s.small ? 16 : 24, fontWeight: 700, color: s.color, margin: '0 0 3px', lineHeight: 1 }}>{s.val}</p>
            <p style={{ fontSize: 12, color: s.color, margin: 0, opacity: 0.8 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Export */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button onClick={() => exportExcel(campeurs)}
          style={{ background: 'transparent', color: VERT, border: `1px solid ${VERT}`, borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          Exporter CSV
        </button>
      </div>

      {/* Filtres catégorie */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {[{ key: 'tous', label: `Tous (${total})` }, { key: 'Jeunes & Adultes', label: `Jeunes & Adultes (${jeunes})` }, { key: 'Enfants & Adolescents', label: `Enfants & Ados (${enfants})` }].map(f => (
          <button key={f.key} onClick={() => setFiltreCategorie(f.key)} style={chipStyle(filtreCategorie === f.key)}>{f.label}</button>
        ))}
      </div>

      {/* Filtres statut */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto', scrollbarWidth: 'none' }}>
        {[{ key: 'tous', label: 'Tous' }, { key: 'payé', label: 'Payés' }, { key: 'en attente', label: 'En attente' }, { key: 'partiel', label: 'Partiel' }].map(f => (
          <button key={f.key} onClick={() => setFiltreStatut(f.key)} style={chipStyle(filtreStatut === f.key)}>{f.label}</button>
        ))}
      </div>

      {/* Recherche */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#94A3B8' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input type="text" value={recherche} onChange={e => setRecherche(e.target.value)}
          placeholder="Rechercher par nom ou téléphone..."
          style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px 12px 10px 34px', fontSize: 13, outline: 'none', background: '#fff', color: '#1E293B' }} />
      </div>

      {loading && <p style={{ textAlign: 'center', fontSize: 13, color: '#94A3B8', padding: '30px 0' }}>Chargement...</p>}

      {/* Liste campeurs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtres.map(ins => {
          const sc = STATUT_CONFIG[ins.statut_paiement] || STATUT_CONFIG['en attente']
          const du = getMontantDu(ins)
          const paye = ins.statut_paiement === 'payé' ? du : (ins.montant_paye || 0)
          const reste = Math.max(du - paye, 0)
          return (
            <div key={ins.id} onClick={() => ouvrirFiche(ins)}
              style={{ background: '#fff', borderRadius: 12, border: '1px solid #F1F5F9', padding: '13px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              {/* Avatar */}
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: VERT_CLAIR, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: VERT }}>{ins.nom_complet?.charAt(0)}</span>
              </div>

              {/* Infos */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 3 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', margin: 0 }}>{ins.nom_complet}</p>
                  {ins.montant_personnalise != null && (
                    <span style={{ fontSize: 9, fontWeight: 600, background: '#F3E8FF', color: '#7C3AED', border: '1px solid #DDD6FE', borderRadius: 20, padding: '1px 6px' }}>Réduction</span>
                  )}
                </div>
                <p style={{ fontSize: 11, color: '#64748B', margin: 0 }}>{ins.telephone} · {ins.tranche_age === 'Jeunes & Adultes' ? 'Jeune/Adulte' : 'Enfant/Ado'}</p>
              </div>

              {/* Statut */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <span style={{ fontSize: 10, fontWeight: 600, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, borderRadius: 20, padding: '2px 9px', display: 'block', marginBottom: 4 }}>
                  {sc.label}
                </span>
                <p style={{ fontSize: 11, color: reste > 0 ? '#92400E' : '#166534', margin: 0, fontWeight: 500 }}>
                  {reste > 0 ? `Reste : ${reste.toLocaleString()}` : '✓ Soldé'}
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

      {/* ── FICHE DÉTAILLÉE ── */}
      {ficheOuverte && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={() => setFicheOuverte(null)}>
          <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 480, maxHeight: '92vh', overflowY: 'auto', padding: '16px 16px 28px' }}
            onClick={e => e.stopPropagation()}>

            {/* Poignée */}
            <div style={{ width: 36, height: 3, background: '#E2E8F0', borderRadius: 2, margin: '0 auto 18px' }} />

            {/* En-tête profil */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #F1F5F9' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: VERT_CLAIR, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: VERT }}>{ficheOuverte.nom_complet?.charAt(0)}</span>
              </div>
              <div>
                <p style={{ fontSize: 17, fontWeight: 700, color: '#1E293B', margin: '0 0 3px' }}>{ficheOuverte.nom_complet}</p>
                <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>{ficheOuverte.genre} · {ficheOuverte.tranche_age === 'Jeunes & Adultes' ? 'Jeune / Adulte' : 'Enfant / Ado'}</p>
              </div>
            </div>

            {/* Infos personnelles */}
            <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', margin: '0 0 4px', textTransform: 'uppercase' }}>Informations personnelles</p>
            <div style={{ marginBottom: 20 }}>
              <InfoLigne label="Téléphone" valeur={ficheOuverte.telephone} />
              <InfoLigne label="Occupation" valeur={ficheOuverte.occupation} />
              <InfoLigne label="Pays" valeur={ficheOuverte.pays} />
              <InfoLigne label="Ville" valeur={ficheOuverte.ville} />
              <InfoLigne label="Commune" valeur={ficheOuverte.commune} />
              <InfoLigne label="Antécédents médicaux" valeur={ficheOuverte.antecedents_medicaux} />
              <InfoLigne label="Taille T-shirt" valeur={ficheOuverte.taille_tshirt} />
              <InfoLigne label="Contact urgence" valeur={ficheOuverte.contact_urgence ? `${ficheOuverte.nom_urgence || ''} — ${ficheOuverte.tel_urgence || ficheOuverte.contact_urgence}` : null} />
              <InfoLigne label="Invité par" valeur={ficheOuverte.nom_inviteur} />
              <InfoLigne label="Déjà participé" valeur={ficheOuverte.deja_participe} />
              <InfoLigne label="Inscrit le" valeur={new Date(ficheOuverte.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} />
            </div>

            {/* Paiement — 3 compteurs */}
            <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', margin: '0 0 10px', textTransform: 'uppercase' }}>Paiement</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
              {[
                { val: du.toLocaleString(), label: 'Dû', bg: '#F8FAFC', color: '#1E293B', border: '#E2E8F0' },
                { val: totalVerse.toLocaleString(), label: 'Versé', bg: '#F0FDF4', color: '#166534', border: '#86EFAC' },
                { val: reste.toLocaleString(), label: 'Reste', bg: reste > 0 ? '#FFFBEB' : '#F0FDF4', color: reste > 0 ? '#92400E' : '#166534', border: reste > 0 ? '#FCD34D' : '#86EFAC' },
              ].map(s => (
                <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: s.color, margin: '0 0 3px' }}>{s.val}</p>
                  <p style={{ fontSize: 10, color: s.color, margin: 0, opacity: 0.75 }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Historique versements */}
            <div style={{ border: '1px solid #F1F5F9', borderRadius: 12, overflow: 'hidden', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid #F1F5F9', background: '#FAFAFA' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', margin: 0 }}>Historique des versements</p>
                <button type="button" onClick={() => setShowAddVersement(!showAddVersement)}
                  style={{ background: VERT, color: '#fff', border: 'none', borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  + Ajouter
                </button>
              </div>

              {/* Formulaire ajout versement */}
              {showAddVersement && (
                <div style={{ padding: '14px', borderBottom: '1px solid #F1F5F9', background: '#F8FAFC' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                    <div>
                      <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4, fontWeight: 500 }}>Montant (FCFA)</label>
                      <input type="number" value={versementForm.montant}
                        onChange={e => setVersementForm(f => ({ ...f, montant: e.target.value }))}
                        placeholder="Ex : 15000"
                        style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none', background: '#fff', color: '#1E293B' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4, fontWeight: 500 }}>Date</label>
                      <input type="date" value={versementForm.date_versement}
                        onChange={e => setVersementForm(f => ({ ...f, date_versement: e.target.value }))}
                        style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none', background: '#fff', color: '#1E293B' }} />
                    </div>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4, fontWeight: 500 }}>Note (optionnel)</label>
                    <input type="text" value={versementForm.note}
                      onChange={e => setVersementForm(f => ({ ...f, note: e.target.value }))}
                      placeholder="Ex : Paiement Wave"
                      style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none', background: '#fff', color: '#1E293B' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="button" onClick={() => setShowAddVersement(false)}
                      style={{ flex: 1, background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 8, padding: '10px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                      Annuler
                    </button>
                    <button type="button" onClick={ajouterVersement} disabled={saving || !versementForm.montant}
                      style={{ flex: 1, background: VERT, color: '#fff', border: 'none', borderRadius: 8, padding: '10px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                      {saving ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                  </div>
                </div>
              )}

              {versements.length === 0 ? (
                <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '16px', margin: 0 }}>Aucun versement enregistré.</p>
              ) : (
                versements.map((v, i) => (
                  <div key={v.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderBottom: i < versements.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#166534', margin: '0 0 2px' }}>{v.montant.toLocaleString()} FCFA</p>
                      <p style={{ fontSize: 11, color: '#64748B', margin: 0 }}>{new Date(v.date_versement).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}{v.note ? ` · ${v.note}` : ''}</p>
                    </div>
                    <button type="button" onClick={() => supprimerVersement(v.id)}
                      style={{ width: 28, height: 28, borderRadius: 8, background: '#FEF2F2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg style={{ width: 13, height: 13, color: '#DC2626' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Réduction */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 6, fontWeight: 500 }}>Montant personnalisé (réduction)</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="number" value={editMontantPerso}
                  onChange={e => setEditMontantPerso(e.target.value)}
                  placeholder={`Standard : ${ficheOuverte.tranche_age === 'Enfants & Adolescents' ? '25 000' : '30 000'} FCFA`}
                  style={{ flex: 1, border: '1px solid #E2E8F0', borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none', background: '#fff', color: '#1E293B' }} />
                <button type="button" onClick={saveReduction} disabled={savingReduction}
                  style={{ background: VERT, color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  OK
                </button>
              </div>
            </div>

            {/* 3 boutons actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" onClick={() => supprimerCampeur(ficheOuverte.id)}
                style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5', borderRadius: 10, padding: '12px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                Supprimer
              </button>
              <button type="button" onClick={() => envoyerWhatsApp(ficheOuverte, versements)}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: '#25D366', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                <svg style={{ width: 16, height: 16 }} fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.859L.057 23.625a.5.5 0 00.612.612l5.766-1.476A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.9 0-3.7-.514-5.253-1.408l-.375-.223-3.886.995 1.013-3.786-.244-.388A9.955 9.955 0 012 12c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10z"/></svg>
                WhatsApp
              </button>
              <button type="button" onClick={() => setFicheOuverte(null)}
                style={{ background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 10, padding: '12px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
