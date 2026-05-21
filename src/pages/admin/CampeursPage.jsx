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
    ['Jeunes & Adultes', jeunes.length],
    ['Enfants & Adolescents', enfants.length],
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
  'payé': { bg: '#E1F5EE', color: '#085041' },
  'en attente': { bg: '#FAEEDA', color: '#854F0B' },
  'partiel': { bg: '#E6F1FB', color: '#185FA5' },
}

export default function CampeursPage() {
  const [campeurs, setCampeurs] = useState([])
  const [loading, setLoading] = useState(true)
  const [recherche, setRecherche] = useState('')
  const [filtreStatut, setFiltreStatut] = useState('tous')
  const [filtreCategorie, setFiltreCategorie] = useState('tous')
  const [ficheOuverte, setFicheOuverte] = useState(null)
  const [editStatut, setEditStatut] = useState('')
  const [editMontantPaye, setEditMontantPaye] = useState('')
  const [editMontantPerso, setEditMontantPerso] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchCampeurs() }, [])

  async function fetchCampeurs() {
    const { data } = await supabase.from('inscriptions').select('*').order('created_at', { ascending: false })
    setCampeurs(data || [])
    setLoading(false)
  }

  function ouvrirFiche(ins) {
    setFicheOuverte(ins)
    setEditStatut(ins.statut_paiement)
    setEditMontantPaye(ins.montant_paye || 0)
    setEditMontantPerso(ins.montant_personnalise != null ? ins.montant_personnalise : '')
  }

  async function saveFiche() {
    if (!ficheOuverte) return
    setSaving(true)

    const montantPerso = editMontantPerso !== '' ? parseInt(editMontantPerso) : null
    const du = montantPerso != null ? montantPerso : getMontantDu(ficheOuverte)
    const montantPaye = editStatut === 'payé' ? du : (parseInt(editMontantPaye) || 0)

    // Mettre à jour l'inscription
    await supabase.from('inscriptions').update({
      statut_paiement: editStatut,
      montant_paye: montantPaye,
      montant_personnalise: montantPerso,
    }).eq('id', ficheOuverte.id)

    // Enregistrer automatiquement dans les recettes si paiement effectué
    if (editStatut === 'payé' || (editStatut === 'partiel' && montantPaye > 0)) {
      // Vérifier si une recette existe déjà pour ce campeur
      const { data: existante } = await supabase
        .from('recettes')
        .select('id')
        .eq('description', `Inscription — ${ficheOuverte.nom_complet}`)
        .single()

      if (existante) {
        // Mettre à jour la recette existante
        await supabase.from('recettes').update({
          montant: montantPaye,
          type: 'frais_participation',
        }).eq('id', existante.id)
      } else {
        // Créer une nouvelle recette
        await supabase.from('recettes').insert([{
          type: 'frais_participation',
          description: `Inscription — ${ficheOuverte.nom_complet}`,
          montant: montantPaye,
          donateur: ficheOuverte.nom_complet,
          date_reception: new Date().toISOString().split('T')[0],
        }])
      }
    }

    setSaving(false)
    setFicheOuverte(null)
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

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div style={{ background: '#E6F1FB', borderRadius: 12, padding: '12px 14px' }}>
          <p style={{ fontSize: 22, fontWeight: 600, color: '#185FA5' }}>{total}</p>
          <p style={{ fontSize: 11, color: '#185FA5' }}>Total inscrits</p>
        </div>
        <div style={{ background: '#E1F5EE', borderRadius: 12, padding: '12px 14px' }}>
          <p style={{ fontSize: 22, fontWeight: 600, color: '#085041' }}>{nbPaye}</p>
          <p style={{ fontSize: 11, color: '#085041' }}>Payés</p>
        </div>
        <div style={{ background: '#FAEEDA', borderRadius: 12, padding: '12px 14px' }}>
          <p style={{ fontSize: 22, fontWeight: 600, color: '#854F0B' }}>{nbAttente}</p>
          <p style={{ fontSize: 11, color: '#854F0B' }}>En attente</p>
        </div>
        <div style={{ background: '#E1F5EE', borderRadius: 12, padding: '12px 14px' }}>
          <p style={{ fontSize: 16, fontWeight: 600, color: '#085041' }}>{montantCollecte.toLocaleString()}</p>
          <p style={{ fontSize: 11, color: '#085041' }}>FCFA collectés</p>
        </div>
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
          const sc = statutColor[ins.statut_paiement] || { bg: '#f0f0f0', color: '#666' }
          const du = getMontantDu(ins)
          const paye = ins.statut_paiement === 'payé' ? du : (ins.montant_paye || 0)
          const reste = Math.max(du - paye, 0)
          return (
            <div key={ins.id} onClick={() => ouvrirFiche(ins)}
              style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #e5e5e0', padding: '12px 14px', cursor: 'pointer' }}>
              <div className="flex items-center gap-3">
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#085041' }}>{ins.nom_complet?.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>{ins.nom_complet}</p>
                    {ins.montant_personnalise != null && (
                      <span style={{ fontSize: 9, background: '#EEEDFE', color: '#534AB7', borderRadius: 20, padding: '1px 6px' }}>Réduction</span>
                    )}
                  </div>
                  <div className="flex gap-2 mt-0.5 flex-wrap">
                    <p style={{ fontSize: 10, color: '#888' }}>{ins.telephone}</p>
                    <p style={{ fontSize: 10, color: '#888' }}>· {ins.tranche_age === 'Jeunes & Adultes' ? 'Jeune/Adulte' : 'Enfant/Ado'}</p>
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <span style={{ fontSize: 10, background: sc.bg, color: sc.color, borderRadius: 20, padding: '2px 8px', fontWeight: 500, display: 'block', marginBottom: 3 }}>
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
          <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 480, maxHeight: '85vh', overflowY: 'auto', padding: '20px 16px 32px' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 36, height: 3, background: '#e0e0e0', borderRadius: 2, margin: '0 auto 16px' }} />
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

            <div style={{ background: '#f8f8f6', borderRadius: 12, padding: '12px 14px', marginBottom: 14 }}>
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

            <p style={{ fontSize: 10, fontWeight: 600, color: '#085041', marginBottom: 8, letterSpacing: '0.05em' }}>PAIEMENT</p>
            <div style={{ background: '#E1F5EE', borderRadius: 10, padding: '10px 12px', marginBottom: 12 }}>
              <p style={{ fontSize: 11, color: '#085041' }}>
                Tarif standard : <strong>{ficheOuverte.tranche_age === 'Enfants & Adolescents' ? '25 000' : '30 000'} FCFA</strong>
              </p>
              {ficheOuverte.montant_personnalise != null && (
                <p style={{ fontSize: 11, color: '#534AB7', marginTop: 2 }}>
                  Réduction appliquée : <strong>{ficheOuverte.montant_personnalise.toLocaleString()} FCFA</strong>
                </p>
              )}
            </div>

            <div className="mb-3">
              <label className="block text-xs text-gray-500 mb-1">Montant personnalisé (réduction)</label>
              <input type="number" value={editMontantPerso} onChange={e => setEditMontantPerso(e.target.value)}
                placeholder="Laisser vide pour tarif standard"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400" />
            </div>

            <div className="mb-3">
              <label className="block text-xs text-gray-500 mb-1">Statut de paiement</label>
              <select value={editStatut} onChange={e => setEditStatut(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none">
                <option value="en attente">En attente</option>
                <option value="partiel">Partiel</option>
                <option value="payé">Payé</option>
              </select>
            </div>

            {editStatut === 'partiel' && (
              <div className="mb-3">
                <label className="block text-xs text-gray-500 mb-1">Montant déjà payé (FCFA)</label>
                <input type="number" value={editMontantPaye} onChange={e => setEditMontantPaye(e.target.value)}
                  placeholder="Ex : 15000"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400" />
              </div>
            )}

            <div style={{ background: '#FAEEDA', borderRadius: 10, padding: '10px 12px', marginBottom: 16 }}>
              <p style={{ fontSize: 11, color: '#854F0B' }}>
                Le paiement sera automatiquement enregistré dans la trésorerie.
              </p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => supprimerCampeur(ficheOuverte.id)}
                style={{ padding: '12px 16px', borderRadius: 12, background: '#FCEBEB', color: '#A32D2D', border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                Supprimer
              </button>
              <button onClick={saveFiche} disabled={saving}
                style={{ flex: 1, background: '#085041', color: '#fff', border: 'none', borderRadius: 12, padding: '12px', fontSize: 13, fontWeight: 500, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
