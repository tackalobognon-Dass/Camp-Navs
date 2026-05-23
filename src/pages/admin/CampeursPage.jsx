import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/admin/AdminLayout'

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
      return [
        ins.nom_complet || '', ins.genre || '', ins.telephone || '',
        ins.tranche_age || '', ins.tranche_age_detail || '',
        ins.statut_paiement || '', du, paye, reste,
        ins.montant_personnalise != null ? 'Oui' : 'Non',
        ins.occupation || '', ins.lieu_habitation || '',
        ins.taille_tshirt || '', ins.contact_urgence || '',
        ins.invite || '',
        new Date(ins.created_at).toLocaleDateString('fr-FR'),
      ]
    })
  }
  const jeunes = campeurs.filter(i => i.tranche_age === 'Jeunes & Adultes')
  const enfants = campeurs.filter(i => i.tranche_age === 'Enfants & Adolescents')
  const totalDu = campeurs.reduce((s, i) => s + getMontantDu(i), 0)
  const totalPaye = campeurs.reduce((s, i) => {
    const du = getMontantDu(i)
    return s + (i.statut_paiement === 'payé' ? du : (i.montant_paye || 0))
  }, 0)
  const entetes = ['Nom', 'Genre', 'Téléphone', 'Catégorie', 'Tranche âge', 'Statut', 'Montant dû', 'Montant payé', 'Reste', 'Réduction', 'Occupation', 'Lieu', 'T-shirt', 'Contact urgence', 'Invité', 'Date inscription']
  const lignes = [
    ['CAMP-NAVS 2026 — LISTE COMPLÈTE'], [`Exporté le ${now}`], [],
    ['TOUS LES CAMPEURS'], entetes, ...buildRows(campeurs), [], [],
    ['JEUNES & ADULTES'], entetes, ...buildRows(jeunes), [], [],
    ['ENFANTS & ADOLESCENTS'], entetes, ...buildRows(enfants), [], [],
    ['RÉSUMÉ FINANCIER'], [],
    ['Total inscrits', campeurs.length],
    ['Payés', campeurs.filter(i => i.statut_paiement === 'payé').length],
    ['En attente', campeurs.filter(i => i.statut_paiement === 'en attente').length],
    ['Partiels', campeurs.filter(i => i.statut_paiement === 'partiel').length],
    ['Montant total dû', `${totalDu.toLocaleString()} FCFA`],
    ['Montant total collecté', `${totalPaye.toLocaleString()} FCFA`],
    ['Montant restant', `${(totalDu - totalPaye).toLocaleString()} FCFA`],
  ]
  const csv = '\uFEFF' + lignes.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Campeurs_CampNavs2026_${now.replace(/\//g, '-')}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const statutColor = {
  'payé':       { bg: '#E1F5EE', color: '#085041', border: '#9FE1CB' },
  'en attente': { bg: '#FAEEDA', color: '#854F0B', border: '#FAC775' },
  'partiel':    { bg: '#E6F1FB', color: '#185FA5', border: '#85B7EB' },
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

  const url = `https://wa.me/${tel}?text=${encodeURIComponent(message)}`
  window.open(url, '_blank')
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
    const montant = parseInt(versementForm.montant)
    await supabase.from('versements').insert([{
      inscription_id: ficheOuverte.id,
      montant,
      date_versement: versementForm.date_versement,
      note: versementForm.note,
    }])

    // Recalculer le total versé
    const { data: allVersements } = await supabase.from('versements').select('*').eq('inscription_id', ficheOuverte.id)
    const totalVerse = (allVersements || []).reduce((s, v) => s + v.montant, 0)
    const du = editMontantPerso !== '' ? parseInt(editMontantPerso) : getMontantDu(ficheOuverte)
    const statut = totalVerse >= du ? 'payé' : 'partiel'

    await supabase.from('inscriptions').update({
      montant_paye: totalVerse,
      statut_paiement: statut,
      montant_personnalise: editMontantPerso !== '' ? parseInt(editMontantPerso) : null,
    }).eq('id', ficheOuverte.id)

    // Recette trésorerie
    const { data: existante } = await supabase.from('recettes').select('id').eq('description', `Inscription — ${ficheOuverte.nom_complet}`).single().catch(() => ({ data: null }))
    if (existante) {
      await supabase.from('recettes').update({ montant: totalVerse }).eq('id', existante.id)
    } else {
      await supabase.from('recettes').insert([{
        type: 'frais_participation',
        description: `Inscription — ${ficheOuverte.nom_complet}`,
        montant: totalVerse,
        donateur: ficheOuverte.nom_complet,
        date_reception: versementForm.date_versement,
      }])
    }

    setVersementForm({ montant: '', date_versement: new Date().toISOString().split('T')[0], note: '' })
    setShowAddVersement(false)
    setSaving(false)
    const { data: newVersements } = await supabase.from('versements').select('*').eq('inscription_id', ficheOuverte.id).order('date_versement', { ascending: true })
    setVersements(newVersements || [])
    fetchCampeurs()
  }

  async function supprimerVersement(id) {
    if (!window.confirm('Supprimer ce versement ?')) return
    await supabase.from('versements').delete().eq('id', id)
    const { data } = await supabase.from('versements').select('*').eq('inscription_id', ficheOuverte.id).order('date_versement', { ascending: true })
    setVersements(data || [])
    const totalVerse = (data || []).reduce((s, v) => s + v.montant, 0)
    const du = editMontantPerso !== '' ? parseInt(editMontantPerso) : getMontantDu(ficheOuverte)
    const statut = totalVerse >= du ? 'payé' : totalVerse > 0 ? 'partiel' : 'en attente'
    await supabase.from('inscriptions').update({ montant_paye: totalVerse, statut_paiement: statut }).eq('id', ficheOuverte.id)
    fetchCampeurs()
  }

  async function saveReduction() {
    if (!ficheOuverte) return
    setSaving(true)
    await supabase.from('inscriptions').update({
      montant_personnalise: editMontantPerso !== '' ? parseInt(editMontantPerso) : null,
    }).eq('id', ficheOuverte.id)
    setSaving(false)
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
    .filter(i =>
      i.nom_complet?.toLowerCase().includes(recherche.toLowerCase()) ||
      i.telephone?.includes(recherche)
    )

  const total = campeurs.length
  const jeunes = campeurs.filter(i => i.tranche_age === 'Jeunes & Adultes').length
  const enfants = campeurs.filter(i => i.tranche_age === 'Enfants & Adolescents').length
  const nbPaye = campeurs.filter(i => i.statut_paiement === 'payé').length
  const nbAttente = campeurs.filter(i => i.statut_paiement === 'en attente').length
  const montantCollecte = campeurs.reduce((s, i) => {
    const du = getMontantDu(i)
    return s + (i.statut_paiement === 'payé' ? du : (i.montant_paye || 0))
  }, 0)

  // Calculs fiche ouverte
  const du = ficheOuverte ? (editMontantPerso !== '' ? parseInt(editMontantPerso) : getMontantDu(ficheOuverte)) : 0
  const totalVerse = versements.reduce((s, v) => s + v.montant, 0)
  const reste = Math.max(du - totalVerse, 0)

  const inputStyle = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400"

  return (
    <AdminLayout>
      <div className="mb-5 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-medium text-gray-800">Campeurs</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total} inscrit(s)</p>
        </div>
        <button onClick={() => exportExcel(campeurs)}
          style={{ background: '#3B6D11', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
          <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Exporter Excel
        </button>
      </div>

      {/* Stats avec bordure */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {[
          { val: total, label: 'Total inscrits', bg: '#E6F1FB', color: '#185FA5', border: '#85B7EB' },
          { val: nbPaye, label: 'Payés', bg: '#E1F5EE', color: '#085041', border: '#9FE1CB' },
          { val: nbAttente, label: 'En attente', bg: '#FAEEDA', color: '#854F0B', border: '#FAC775' },
          { val: `${montantCollecte.toLocaleString()}`, label: 'FCFA collectés', bg: '#E1F5EE', color: '#085041', border: '#9FE1CB', small: true },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: '12px 14px', border: `1px solid ${s.border}` }}>
            <p style={{ fontSize: s.small ? 15 : 22, fontWeight: 600, color: s.color }}>{s.val}</p>
            <p style={{ fontSize: 11, color: s.color }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filtres catégorie */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {[
          { key: 'tous', label: `Tous (${total})` },
          { key: 'Jeunes & Adultes', label: `Jeunes & Adultes (${jeunes})` },
          { key: 'Enfants & Adolescents', label: `Enfants & Ados (${enfants})` },
        ].map(f => (
          <button key={f.key} onClick={() => setFiltreCategorie(f.key)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ border: `0.5px solid ${filtreCategorie === f.key ? '#085041' : '#e5e5e0'}`, background: filtreCategorie === f.key ? '#085041' : '#fff', color: filtreCategorie === f.key ? '#fff' : '#666' }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Filtres statut */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {[
          { key: 'tous', label: 'Tous' },
          { key: 'payé', label: 'Payés' },
          { key: 'en attente', label: 'En attente' },
          { key: 'partiel', label: 'Partiel' },
        ].map(f => (
          <button key={f.key} onClick={() => setFiltreStatut(f.key)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ border: `0.5px solid ${filtreStatut === f.key ? '#085041' : '#e5e5e0'}`, background: filtreStatut === f.key ? '#085041' : '#fff', color: filtreStatut === f.key ? '#fff' : '#666' }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Recherche */}
      <input type="text" value={recherche} onChange={e => setRecherche(e.target.value)}
        placeholder="Rechercher par nom ou téléphone..."
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-4 bg-white outline-none focus:border-emerald-400" />

      {loading && <p className="text-sm text-gray-400 text-center py-8">Chargement...</p>}
      {!loading && filtres.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-6 text-center">
          <p className="text-sm text-gray-400">Aucun campeur trouvé.</p>
        </div>
      )}

      <div className="space-y-2">
        {filtres.map(ins => {
          const sc = statutColor[ins.statut_paiement] || { bg: '#f0f0f0', color: '#666', border: '#ddd' }
          const du = getMontantDu(ins)
          const paye = ins.statut_paiement === 'payé' ? du : (ins.montant_paye || 0)
          const reste = Math.max(du - paye, 0)
          return (
            <div key={ins.id} onClick={() => ouvrirFiche(ins)}
              style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #e5e5e0', padding: '12px 14px', cursor: 'pointer' }}>
              <div className="flex items-center gap-3">
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#085041' }}>{ins.nom_complet?.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>{ins.nom_complet}</p>
                    {ins.montant_personnalise != null && (
                      <span style={{ fontSize: 9, background: '#EEEDFE', color: '#534AB7', border: '0.5px solid #AFA9EC', borderRadius: 20, padding: '1px 6px' }}>Réduction</span>
                    )}
                  </div>
                  <div className="flex gap-2 mt-0.5 flex-wrap">
                    <p style={{ fontSize: 10, color: '#888' }}>{ins.telephone}</p>
                    <p style={{ fontSize: 10, color: '#888' }}>· {ins.tranche_age === 'Jeunes & Adultes' ? 'Jeune/Adulte' : 'Enfant/Ado'}</p>
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <span style={{ fontSize: 10, background: sc.bg, color: sc.color, border: `0.5px solid ${sc.border}`, borderRadius: 20, padding: '2px 8px', fontWeight: 500, display: 'block', marginBottom: 3 }}>
                    {ins.statut_paiement}
                  </span>
                  <p style={{ fontSize: 10, color: reste > 0 ? '#854F0B' : '#085041' }}>
                    {reste > 0 ? `Reste : ${reste.toLocaleString()}` : '✓ Soldé'}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* FICHE DÉTAILLÉE */}
      {ficheOuverte && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={() => setFicheOuverte(null)}>
          <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', padding: '20px 16px 32px' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 36, height: 3, background: '#e0e0e0', borderRadius: 2, margin: '0 auto 16px' }} />

            {/* Identité */}
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 18, fontWeight: 600, color: '#085041' }}>{ficheOuverte.nom_complet?.charAt(0)}</span>
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 500, color: '#1a1a1a' }}>{ficheOuverte.nom_complet}</p>
                <p style={{ fontSize: 11, color: '#888' }}>{ficheOuverte.telephone} · {ficheOuverte.genre}</p>
                <p style={{ fontSize: 11, color: '#085041' }}>{ficheOuverte.tranche_age} · {ficheOuverte.tranche_age_detail}</p>
              </div>
            </div>

            {/* Infos personnelles */}
            <div style={{ background: '#f8f8f6', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: '#085041', marginBottom: 8, letterSpacing: '0.05em' }}>INFORMATIONS PERSONNELLES</p>
              {[
                { label: 'Occupation', val: ficheOuverte.occupation },
                { label: 'Lieu habitation', val: ficheOuverte.lieu_habitation },
                { label: 'Antécédents médicaux', val: ficheOuverte.antecedents_medicaux },
                { label: 'Taille T-shirt', val: ficheOuverte.taille_tshirt },
                { label: 'Contact urgence', val: ficheOuverte.contact_urgence },
                { label: 'Déjà participé', val: ficheOuverte.deja_participe },
                { label: 'Invité', val: ficheOuverte.invite },
                { label: 'Inscrit le', val: new Date(ficheOuverte.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) },
              ].filter(i => i.val).map(({ label, val }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '0.5px solid #f0f0ee' }}>
                  <span style={{ fontSize: 11, color: '#888' }}>{label}</span>
                  <span style={{ fontSize: 11, color: '#1a1a1a', maxWidth: 180, textAlign: 'right' }}>{val}</span>
                </div>
              ))}
            </div>

            {/* PAIEMENT */}
            <p style={{ fontSize: 10, fontWeight: 600, color: '#085041', marginBottom: 10, letterSpacing: '0.05em' }}>PAIEMENT</p>

            {/* Résumé montants */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
              <div style={{ background: '#f8f8f6', borderRadius: 8, padding: '8px', textAlign: 'center', border: '0.5px solid #e5e5e0' }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{du.toLocaleString()}</p>
                <p style={{ fontSize: 9, color: '#888' }}>Montant dû</p>
              </div>
              <div style={{ background: '#E1F5EE', borderRadius: 8, padding: '8px', textAlign: 'center', border: '0.5px solid #9FE1CB' }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#085041' }}>{totalVerse.toLocaleString()}</p>
                <p style={{ fontSize: 9, color: '#085041' }}>Versé</p>
              </div>
              <div style={{ background: reste > 0 ? '#FAEEDA' : '#E1F5EE', borderRadius: 8, padding: '8px', textAlign: 'center', border: `0.5px solid ${reste > 0 ? '#FAC775' : '#9FE1CB'}` }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: reste > 0 ? '#854F0B' : '#085041' }}>{reste.toLocaleString()}</p>
                <p style={{ fontSize: 9, color: reste > 0 ? '#854F0B' : '#085041' }}>Reste</p>
              </div>
            </div>

            {/* Historique versements */}
            <div style={{ background: '#fff', border: '0.5px solid #e5e5e0', borderRadius: 10, overflow: 'hidden', marginBottom: 12 }}>
              <div style={{ padding: '10px 14px', borderBottom: '0.5px solid #f0f0ee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#085041' }}>Historique des versements</p>
                <button onClick={() => setShowAddVersement(!showAddVersement)}
                  style={{ fontSize: 11, color: '#085041', background: '#E1F5EE', border: '0.5px solid #9FE1CB', borderRadius: 6, padding: '3px 10px', cursor: 'pointer' }}>
                  + Ajouter
                </button>
              </div>

              {showAddVersement && (
                <div style={{ padding: '12px 14px', borderBottom: '0.5px solid #f0f0ee', background: '#f8f8f6' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                    <div>
                      <label style={{ fontSize: 10, color: '#888', display: 'block', marginBottom: 3 }}>Montant (FCFA)</label>
                      <input type="number" value={versementForm.montant}
                        onChange={e => setVersementForm(f => ({ ...f, montant: e.target.value }))}
                        placeholder="Ex : 15000" className={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, color: '#888', display: 'block', marginBottom: 3 }}>Date</label>
                      <input type="date" value={versementForm.date_versement}
                        onChange={e => setVersementForm(f => ({ ...f, date_versement: e.target.value }))}
                        className={inputStyle} />
                    </div>
                  </div>
                  <input type="text" value={versementForm.note}
                    onChange={e => setVersementForm(f => ({ ...f, note: e.target.value }))}
                    placeholder="Note (optionnel)" className={inputStyle} style={{ marginBottom: 8 }} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setShowAddVersement(false)}
                      style={{ flex: 1, background: '#f0f0ee', color: '#666', border: 'none', borderRadius: 8, padding: '8px', fontSize: 12, cursor: 'pointer' }}>Annuler</button>
                    <button onClick={ajouterVersement} disabled={saving || !versementForm.montant}
                      style={{ flex: 1, background: '#085041', color: '#fff', border: 'none', borderRadius: 8, padding: '8px', fontSize: 12, fontWeight: 500, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                      {saving ? '...' : 'Enregistrer'}
                    </button>
                  </div>
                </div>
              )}

              {versements.length === 0 ? (
                <p style={{ fontSize: 12, color: '#aaa', textAlign: 'center', padding: '14px' }}>Aucun versement enregistré.</p>
              ) : (
                versements.map((v, i) => (
                  <div key={v.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: i < versements.length - 1 ? '0.5px solid #f0f0ee' : 'none' }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#085041' }}>{v.montant.toLocaleString()} FCFA</p>
                      <p style={{ fontSize: 10, color: '#888' }}>{new Date(v.date_versement).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}{v.note ? ` · ${v.note}` : ''}</p>
                    </div>
                    <button onClick={() => supprimerVersement(v.id)}
                      style={{ width: 26, height: 26, borderRadius: 6, background: '#FCEBEB', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg style={{ width: 12, height: 12, color: '#A32D2D' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Réduction */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 10, color: '#888', display: 'block', marginBottom: 4 }}>Montant personnalisé (réduction)</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="number" value={editMontantPerso}
                  onChange={e => setEditMontantPerso(e.target.value)}
                  placeholder={`Tarif standard : ${ficheOuverte.tranche_age === 'Enfants & Adolescents' ? '25 000' : '30 000'} FCFA`}
                  className={inputStyle} style={{ flex: 1 }} />
                <button onClick={saveReduction} disabled={saving}
                  style={{ background: '#085041', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 14px', fontSize: 12, cursor: 'pointer' }}>
                  OK
                </button>
              </div>
            </div>

            {/* Boutons WhatsApp */}
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: '#085041', marginBottom: 8, letterSpacing: '0.05em' }}>ENVOYER PAR WHATSAPP</p>
              <button onClick={() => envoyerWhatsApp(ficheOuverte, versements)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#25D366', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                <svg style={{ width: 18, height: 18 }} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.859L.057 23.625a.5.5 0 00.612.612l5.766-1.476A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.9 0-3.7-.514-5.253-1.408l-.375-.223-3.886.995 1.013-3.786-.244-.388A9.955 9.955 0 012 12c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10z"/>
                </svg>
                {totalVerse === 0 ? 'Envoyer un rappel' : reste > 0 ? 'Envoyer le récapitulatif' : 'Envoyer confirmation'}
              </button>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={() => supprimerCampeur(ficheOuverte.id)}
                style={{ padding: '12px 16px', borderRadius: 10, background: '#FCEBEB', color: '#A32D2D', border: '0.5px solid #F09595', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                Supprimer
              </button>
              <button onClick={() => setFicheOuverte(null)}
                style={{ flex: 1, background: '#085041', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
