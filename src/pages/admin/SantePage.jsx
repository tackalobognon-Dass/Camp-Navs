import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/admin/AdminLayout'

const STATUTS = ['En traitement', 'Guéri', 'Évacué']
const ROLES = ['Infirmier', 'Médecin', 'Autre']

const STATUT_CONFIG = {
  'En traitement': { bg: '#FFA500', color: '#fff' },
  'Guéri':         { bg: '#1A7A4A', color: '#fff' },
  'Évacué':        { bg: '#C0392B', color: '#fff' },
}

const EMPTY_FICHE = {
  nom_campeur: '', symptomes: '', traitement: '',
  statut: 'En traitement', hopital: '', accompagnateur: '',
  notes: '', personnel_id: '', nom_personnel: '',
}

const EMPTY_PERSONNEL = { nom: '', role: 'Infirmier', telephone: '' }

// Composant recherche médicaments
function MedicamentSelect({ medicaments, medsSelectionnes, onAjouter, onRetirer, onUpdateQte }) {
  const [recherche, setRecherche] = useState('')
  const [ouvert, setOuvert] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOuvert(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filtres = medicaments.filter(m =>
    m.nom.toLowerCase().includes(recherche.toLowerCase()) &&
    !medsSelectionnes.find(ms => ms.id === m.id)
  )

  return (
    <div ref={ref}>
      <div style={{ position: 'relative' }}>
        <input type="text" value={recherche} onChange={e => { setRecherche(e.target.value); setOuvert(true) }}
          onFocus={() => setOuvert(true)}
          placeholder="Rechercher un médicament..."
          style={{ width: '100%', border: '0.5px solid #ccc', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none' }} />
        {ouvert && filtres.length > 0 && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '0.5px solid #e0e0e0', borderRadius: 8, zIndex: 20, maxHeight: 160, overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            {filtres.map(m => {
              const restant = (m.quantite_initiale || 0) - (m.quantite_utilisee || 0)
              return (
                <div key={m.id} onClick={() => { onAjouter(m); setRecherche(''); setOuvert(false) }}
                  style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '0.5px solid #f5f5f5' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8f8f6'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                  <span style={{ fontSize: 13, color: '#1a1a1a' }}>{m.nom}</span>
                  <span style={{ fontSize: 11, color: restant <= 0 ? '#C0392B' : '#1A7A4A', fontWeight: 500 }}>
                    {restant} {m.unite || 'cp'}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Médicaments sélectionnés */}
      {medsSelectionnes.length > 0 && (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {medsSelectionnes.map(ms => (
            <div key={ms.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8f8f6', borderRadius: 8, padding: '6px 10px' }}>
              <span style={{ fontSize: 12, flex: 1, color: '#1a1a1a' }}>{ms.nom}</span>
              <input type="number" min="1" value={ms.qte}
                onChange={e => onUpdateQte(ms.id, e.target.value)}
                style={{ width: 48, border: '0.5px solid #ddd', borderRadius: 6, padding: '3px 6px', fontSize: 12, textAlign: 'center' }} />
              <span style={{ fontSize: 11, color: '#888' }}>{ms.unite || 'cp'}</span>
              <button onClick={() => onRetirer(ms.id)}
                style={{ fontSize: 12, color: '#C0392B', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function SantePage() {
  const [onglet, setOnglet] = useState('malades')
  const [fiches, setFiches] = useState([])
  const [medicaments, setMedicaments] = useState([])
  const [medUtilises, setMedUtilises] = useState([])
  const [personnel, setPersonnel] = useState([])
  const [loading, setLoading] = useState(true)

  const [showFiche, setShowFiche] = useState(false)
  const [showMed, setShowMed] = useState(false)
  const [showPersonnel, setShowPersonnel] = useState(false)
  const [fiche, setFiche] = useState(EMPTY_FICHE)
  const [editFicheId, setEditFicheId] = useState(null)
  const [medForm, setMedForm] = useState({ nom: '', quantite_initiale: 0, unite: 'comprimé(s)' })
  const [editMedId, setEditMedId] = useState(null)
  const [personnelForm, setPersonnelForm] = useState(EMPTY_PERSONNEL)
  const [editPersonnelId, setEditPersonnelId] = useState(null)
  const [medsSelectionnes, setMedsSelectionnes] = useState([])
  const [saving, setSaving] = useState(false)
  const [filtreStatut, setFiltreStatut] = useState('tous')
  const [menuOuvert, setMenuOuvert] = useState(null)
  const menuRef = useRef(null)

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOuvert(null)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function fetchData() {
    const [{ data: f }, { data: m }, { data: mu }, { data: p }] = await Promise.all([
      supabase.from('fiches_malades').select('*').order('date_heure', { ascending: false }),
      supabase.from('stocks_medicaments').select('*').order('nom'),
      supabase.from('medicaments_utilises').select('*'),
      supabase.from('personnel_medical').select('*').order('nom'),
    ])
    setFiches(f || [])
    setMedicaments(m || [])
    setMedUtilises(mu || [])
    setPersonnel(p || [])
    setLoading(false)
  }

  function setF(k, v) { setFiche(f => ({ ...f, [k]: v })) }
  function setM(k, v) { setMedForm(f => ({ ...f, [k]: v })) }
  function setP(k, v) { setPersonnelForm(f => ({ ...f, [k]: v })) }

  function openNouvelleFiche() {
    setFiche(EMPTY_FICHE)
    setEditFicheId(null)
    setMedsSelectionnes([])
    setShowFiche(true)
  }

  function openEditFiche(f) {
    setFiche({
      nom_campeur: f.nom_campeur, symptomes: f.symptomes,
      traitement: f.traitement || '', statut: f.statut,
      hopital: f.hopital || '', accompagnateur: f.accompagnateur || '',
      notes: f.notes || '', personnel_id: f.personnel_id || '',
      nom_personnel: f.nom_personnel || '',
    })
    setEditFicheId(f.id)
    setMedsSelectionnes([])
    setShowFiche(true)
    setMenuOuvert(null)
  }

  async function saveFiche() {
    if (!fiche.nom_campeur || !fiche.symptomes) return
    setSaving(true)
    let ficheId = editFicheId

    const payload = {
      nom_campeur: fiche.nom_campeur, symptomes: fiche.symptomes,
      traitement: fiche.traitement, statut: fiche.statut,
      hopital: fiche.hopital, accompagnateur: fiche.accompagnateur,
      notes: fiche.notes, personnel_id: fiche.personnel_id || null,
      nom_personnel: fiche.nom_personnel || '',
    }

    if (editFicheId) {
      await supabase.from('fiches_malades').update(payload).eq('id', editFicheId)
    } else {
      const { data } = await supabase.from('fiches_malades').insert([payload]).select().single()
      ficheId = data?.id
    }

    for (const ms of medsSelectionnes) {
      await supabase.from('medicaments_utilises').insert([{
        fiche_id: ficheId, medicament_id: ms.id,
        nom_medicament: ms.nom, quantite: ms.qte,
      }])
      const med = medicaments.find(m => m.id === ms.id)
      if (med) {
        await supabase.from('stocks_medicaments').update({
          quantite_utilisee: (med.quantite_utilisee || 0) + parseInt(ms.qte)
        }).eq('id', ms.id)
      }
    }

    setSaving(false)
    setShowFiche(false)
    setEditFicheId(null)
    setFiche(EMPTY_FICHE)
    setMedsSelectionnes([])
    fetchData()
  }

  async function saveMedicament() {
    if (!medForm.nom) return
    setSaving(true)
    const payload = {
      nom: medForm.nom,
      quantite_initiale: parseInt(medForm.quantite_initiale) || 0,
      quantite: parseInt(medForm.quantite_initiale) || 0,
      unite: medForm.unite,
      statut: 'disponible',
      quantite_utilisee: 0,
    }
    if (editMedId) {
      await supabase.from('stocks_medicaments').update({ nom: medForm.nom, quantite_initiale: parseInt(medForm.quantite_initiale) || 0, unite: medForm.unite }).eq('id', editMedId)
    } else {
      await supabase.from('stocks_medicaments').insert([payload])
    }
    setSaving(false)
    setShowMed(false)
    setEditMedId(null)
    setMedForm({ nom: '', quantite_initiale: 0, unite: 'comprimé(s)' })
    fetchData()
  }

  async function savePersonnel() {
    if (!personnelForm.nom) return
    setSaving(true)
    if (editPersonnelId) {
      await supabase.from('personnel_medical').update(personnelForm).eq('id', editPersonnelId)
    } else {
      await supabase.from('personnel_medical').insert([personnelForm])
    }
    setSaving(false)
    setShowPersonnel(false)
    setEditPersonnelId(null)
    setPersonnelForm(EMPTY_PERSONNEL)
    fetchData()
  }

  async function supprimerFiche(id) {
    if (!window.confirm('Supprimer cette fiche ?')) return
    await supabase.from('fiches_malades').delete().eq('id', id)
    setMenuOuvert(null)
    fetchData()
  }

  async function supprimerMed(id) {
    if (!window.confirm('Supprimer ce médicament ?')) return
    await supabase.from('stocks_medicaments').delete().eq('id', id)
    fetchData()
  }

  async function supprimerPersonnel(id) {
    if (!window.confirm('Supprimer ce membre du personnel ?')) return
    await supabase.from('personnel_medical').delete().eq('id', id)
    fetchData()
  }

  // Stats
  const totalMalades = fiches.length
  const enTraitement = fiches.filter(f => f.statut === 'En traitement').length
  const gueris = fiches.filter(f => f.statut === 'Guéri').length
  const evacues = fiches.filter(f => f.statut === 'Évacué').length

  const filtresFiches = fiches.filter(f => filtreStatut === 'tous' || f.statut === filtreStatut)

  const inputStyle = { width: '100%', border: '0.5px solid #ccc', borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none', background: '#fff' }
  const labelStyle = { display: 'block', fontSize: 11, color: '#555', marginBottom: 4, fontWeight: 500 }
  const btnPrimary = { background: '#054035', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }
  const btnSecondary = { background: '#f0f0ee', color: '#444', border: 'none', borderRadius: 8, padding: '10px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }
  const btnDanger = { background: '#C0392B', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }

  return (
    <AdminLayout>
      {/* Header */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 500, color: '#1a1a1a' }}>Santé</h1>
          <p style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{totalMalades} fiche(s) · {medicaments.length} médicament(s) · {personnel.length} personnel</p>
        </div>
        <button style={{ ...btnDanger, display: 'flex', alignItems: 'center', gap: 6 }}
          onClick={() => {/* export PDF */}}>
          <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Rapport PDF
        </button>
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, borderBottom: '1px solid #e0e0e0', paddingBottom: 0 }}>
        {[
          { key: 'malades', label: 'Malades' },
          { key: 'medicaments', label: 'Médicaments' },
          { key: 'personnel', label: 'Personnel' },
          { key: 'rapport', label: 'Rapport' },
        ].map(o => (
          <button key={o.key} onClick={() => setOnglet(o.key)}
            style={{ padding: '8px 14px', fontSize: 13, fontWeight: onglet === o.key ? 600 : 400, color: onglet === o.key ? '#054035' : '#666', background: 'none', border: 'none', borderBottom: onglet === o.key ? '2px solid #054035' : '2px solid transparent', cursor: 'pointer', marginBottom: -1 }}>
            {o.label}
          </button>
        ))}
      </div>

      {/* MALADES */}
      {onglet === 'malades' && (
        <>
          <button onClick={() => { setShowFiche(!showFiche); if (showFiche) { setEditFicheId(null); setFiche(EMPTY_FICHE) } else openNouvelleFiche() }}
            style={{ ...btnPrimary, width: '100%', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 14 }}>
            <svg style={{ width: 15, height: 15 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showFiche && !editFicheId ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"} /></svg>
            {showFiche && !editFicheId ? 'Fermer' : 'Nouvelle fiche malade'}
          </button>

          {showFiche && (
            <div style={{ background: '#fff', border: '0.5px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', marginBottom: 14 }}>{editFicheId ? 'Modifier la fiche' : 'Nouvelle fiche malade'}</p>

              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Nom du campeur *</label>
                <input type="text" value={fiche.nom_campeur} onChange={e => setF('nom_campeur', e.target.value)}
                  placeholder="Ex : YAO Jean-Pierre" style={inputStyle} />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Personnel médical</label>
                <select value={fiche.personnel_id} onChange={e => {
                  const p = personnel.find(p => p.id === e.target.value)
                  setF('personnel_id', e.target.value)
                  setF('nom_personnel', p ? p.nom : '')
                }} style={inputStyle}>
                  <option value="">-- Sélectionner --</option>
                  {personnel.map(p => <option key={p.id} value={p.id}>{p.nom} ({p.role})</option>)}
                </select>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Symptômes *</label>
                <textarea value={fiche.symptomes} onChange={e => setF('symptomes', e.target.value)}
                  placeholder="Décrivez les symptômes..." rows={3}
                  style={{ ...inputStyle, resize: 'none' }} />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Traitement administré</label>
                <textarea value={fiche.traitement} onChange={e => setF('traitement', e.target.value)}
                  placeholder="Traitement donné..." rows={2}
                  style={{ ...inputStyle, resize: 'none' }} />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Médicaments utilisés</label>
                <MedicamentSelect
                  medicaments={medicaments}
                  medsSelectionnes={medsSelectionnes}
                  onAjouter={m => setMedsSelectionnes(prev => [...prev, { ...m, qte: 1 }])}
                  onRetirer={id => setMedsSelectionnes(prev => prev.filter(m => m.id !== id))}
                  onUpdateQte={(id, qte) => setMedsSelectionnes(prev => prev.map(m => m.id === id ? { ...m, qte: parseInt(qte) || 1 } : m))}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Statut</label>
                <select value={fiche.statut} onChange={e => setF('statut', e.target.value)} style={inputStyle}>
                  {STATUTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              {fiche.statut === 'Évacué' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                  <div>
                    <label style={labelStyle}>Hôpital</label>
                    <input type="text" value={fiche.hopital} onChange={e => setF('hopital', e.target.value)}
                      placeholder="Ex : CHU de Bingerville" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Accompagnateur</label>
                    <input type="text" value={fiche.accompagnateur} onChange={e => setF('accompagnateur', e.target.value)}
                      placeholder="Nom de l'accompagnateur" style={inputStyle} />
                  </div>
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Notes</label>
                <textarea value={fiche.notes} onChange={e => setF('notes', e.target.value)}
                  placeholder="Observations..." rows={2}
                  style={{ ...inputStyle, resize: 'none' }} />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setShowFiche(false); setEditFicheId(null) }} style={{ ...btnSecondary, flex: 1 }}>Annuler</button>
                <button onClick={saveFiche} disabled={saving} style={{ ...btnPrimary, flex: 1, opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Enregistrement...' : editFicheId ? 'Modifier' : 'Enregistrer'}
                </button>
              </div>
            </div>
          )}

          {/* Filtres statut */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {['tous', ...STATUTS].map(s => (
              <button key={s} onClick={() => setFiltreStatut(s)}
                style={{ flexShrink: 0, padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500, border: `1.5px solid ${filtreStatut === s ? '#054035' : '#ddd'}`, background: filtreStatut === s ? '#054035' : '#fff', color: filtreStatut === s ? '#fff' : '#555', cursor: 'pointer' }}>
                {s === 'tous' ? 'Tous' : s}
              </button>
            ))}
          </div>

          {loading && <p style={{ fontSize: 13, color: '#888', textAlign: 'center', padding: 24 }}>Chargement...</p>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} ref={menuRef}>
            {filtresFiches.map(f => {
              const sc = STATUT_CONFIG[f.statut] || STATUT_CONFIG['En traitement']
              const medsF = medUtilises.filter(mu => mu.fiche_id === f.id)
              return (
                <div key={f.id} style={{ background: '#fff', borderRadius: 8, border: `0.5px solid ${f.statut === 'Évacué' ? '#C0392B' : '#ddd'}`, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{f.nom_campeur}</p>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 3, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, background: sc.bg, color: sc.color, borderRadius: 4, padding: '2px 8px', fontWeight: 500 }}>{f.statut}</span>
                        {f.nom_personnel && <span style={{ fontSize: 11, color: '#555' }}>Dr/Inf : {f.nom_personnel}</span>}
                        <span style={{ fontSize: 11, color: '#888' }}>
                          {new Date(f.date_heure).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {/* Menu ... */}
                    <div style={{ position: 'relative' }}>
                      <button onClick={() => setMenuOuvert(menuOuvert === f.id ? null : f.id)}
                        style={{ width: 30, height: 30, borderRadius: 6, background: '#f5f5f3', border: 'none', cursor: 'pointer', fontSize: 16, color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        ···
                      </button>
                      {menuOuvert === f.id && (
                        <div style={{ position: 'absolute', right: 0, top: 34, background: '#fff', borderRadius: 8, border: '0.5px solid #ddd', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', zIndex: 20, minWidth: 130, overflow: 'hidden' }}>
                          <button onClick={() => openEditFiche(f)}
                            style={{ width: '100%', padding: '9px 14px', fontSize: 13, color: '#1a1a1a', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                            Modifier
                          </button>
                          <div style={{ height: '0.5px', background: '#f0f0f0' }} />
                          <button onClick={() => supprimerFiche(f.id)}
                            style={{ width: '100%', padding: '9px 14px', fontSize: 13, color: '#C0392B', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                            Supprimer
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ background: '#f8f8f6', borderRadius: 6, padding: '8px 10px', marginBottom: 6 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: '#054035', marginBottom: 3 }}>Symptômes</p>
                    <p style={{ fontSize: 12, color: '#333' }}>{f.symptomes}</p>
                  </div>

                  {f.traitement && (
                    <div style={{ background: '#E8F5E9', borderRadius: 6, padding: '8px 10px', marginBottom: 6 }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: '#1A7A4A', marginBottom: 3 }}>Traitement</p>
                      <p style={{ fontSize: 12, color: '#333' }}>{f.traitement}</p>
                    </div>
                  )}

                  {medsF.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 6 }}>
                      {medsF.map(mu => (
                        <span key={mu.id} style={{ fontSize: 11, background: '#E3F2FD', color: '#1565C0', borderRadius: 4, padding: '2px 8px', fontWeight: 500 }}>
                          {mu.nom_medicament} x{mu.quantite}
                        </span>
                      ))}
                    </div>
                  )}

                  {f.statut === 'Évacué' && (
                    <div style={{ background: '#FFEBEE', borderRadius: 6, padding: '8px 10px' }}>
                      <p style={{ fontSize: 11, fontWeight: 600, color: '#C0392B', marginBottom: 3 }}>Évacuation</p>
                      <p style={{ fontSize: 12, color: '#333' }}>{f.hopital} — {f.accompagnateur}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* MÉDICAMENTS */}
      {onglet === 'medicaments' && (
        <>
          <button onClick={() => { setShowMed(!showMed); setEditMedId(null); setMedForm({ nom: '', quantite_initiale: 0, unite: 'comprimé(s)' }) }}
            style={{ ...btnPrimary, width: '100%', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 14 }}>
            <svg style={{ width: 15, height: 15 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showMed ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"} /></svg>
            {showMed ? 'Fermer' : 'Ajouter un médicament'}
          </button>

          {showMed && (
            <div style={{ background: '#fff', border: '0.5px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 14 }}>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Nom *</label>
                <input type="text" value={medForm.nom} onChange={e => setM('nom', e.target.value)}
                  placeholder="Ex : Paracétamol" style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>Quantité initiale</label>
                  <input type="number" min="0" value={medForm.quantite_initiale}
                    onChange={e => setM('quantite_initiale', e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Unité</label>
                  <select value={medForm.unite} onChange={e => setM('unite', e.target.value)} style={inputStyle}>
                    {['comprimé(s)', 'sachet(s)', 'flacon(s)', 'ampoule(s)', 'tube(s)', 'boîte(s)'].map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowMed(false)} style={{ ...btnSecondary, flex: 1 }}>Annuler</button>
                <button onClick={saveMedicament} disabled={saving} style={{ ...btnPrimary, flex: 1, opacity: saving ? 0.6 : 1 }}>
                  {saving ? '...' : editMedId ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {medicaments.map(m => {
              const initial = m.quantite_initiale || 0
              const utilise = m.quantite_utilisee || 0
              const restant = initial - utilise
              const pct = initial > 0 ? (restant / initial) * 100 : 100
              const alerte = pct <= 0
              const warning = pct > 0 && pct <= 20
              return (
                <div key={m.id} style={{ background: '#fff', borderRadius: 8, border: `0.5px solid ${alerte ? '#C0392B' : warning ? '#E65100' : '#ddd'}`, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{m.nom}</p>
                      {alerte && <span style={{ fontSize: 10, background: '#C0392B', color: '#fff', borderRadius: 4, padding: '1px 7px', fontWeight: 600 }}>ÉPUISÉ</span>}
                      {warning && <span style={{ fontSize: 10, background: '#E65100', color: '#fff', borderRadius: 4, padding: '1px 7px', fontWeight: 600 }}>FAIBLE</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => { setMedForm({ nom: m.nom, quantite_initiale: m.quantite_initiale || 0, unite: m.unite || 'comprimé(s)' }); setEditMedId(m.id); setShowMed(true) }}
                        style={{ width: 28, height: 28, borderRadius: 6, background: '#E8F5E9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg style={{ width: 13, height: 13, color: '#1A7A4A' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => supprimerMed(m.id)}
                        style={{ width: 28, height: 28, borderRadius: 6, background: '#FFEBEE', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg style={{ width: 13, height: 13, color: '#C0392B' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: '#555' }}>Initial : <strong>{initial}</strong></span>
                    <span style={{ fontSize: 12, color: '#C0392B' }}>Utilisé : <strong>{utilise}</strong></span>
                    <span style={{ fontSize: 12, color: alerte ? '#C0392B' : '#1A7A4A', fontWeight: 600 }}>Restant : {restant}</span>
                    <span style={{ fontSize: 12, color: '#888' }}>{m.unite}</span>
                  </div>
                  <div style={{ background: '#f0f0ee', borderRadius: 4, height: 6 }}>
                    <div style={{ background: alerte ? '#C0392B' : warning ? '#E65100' : '#1A7A4A', borderRadius: 4, height: 6, width: `${Math.max(0, pct)}%`, transition: 'width .3s' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* PERSONNEL */}
      {onglet === 'personnel' && (
        <>
          <button onClick={() => { setShowPersonnel(!showPersonnel); setEditPersonnelId(null); setPersonnelForm(EMPTY_PERSONNEL) }}
            style={{ ...btnPrimary, width: '100%', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 14 }}>
            <svg style={{ width: 15, height: 15 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showPersonnel ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"} /></svg>
            {showPersonnel ? 'Fermer' : 'Ajouter du personnel'}
          </button>

          {showPersonnel && (
            <div style={{ background: '#fff', border: '0.5px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 14 }}>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Nom *</label>
                <input type="text" value={personnelForm.nom} onChange={e => setP('nom', e.target.value)}
                  placeholder="Ex : Dr KOUASSI Ange" style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>Rôle</label>
                  <select value={personnelForm.role} onChange={e => setP('role', e.target.value)} style={inputStyle}>
                    {ROLES.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Téléphone</label>
                  <input type="text" value={personnelForm.telephone} onChange={e => setP('telephone', e.target.value)}
                    placeholder="07 XX XX XX XX" style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowPersonnel(false)} style={{ ...btnSecondary, flex: 1 }}>Annuler</button>
                <button onClick={savePersonnel} disabled={saving} style={{ ...btnPrimary, flex: 1, opacity: saving ? 0.6 : 1 }}>
                  {saving ? '...' : editPersonnelId ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {personnel.length === 0 && !loading && (
              <div style={{ background: '#fff', borderRadius: 8, border: '0.5px solid #ddd', padding: 24, textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: '#888' }}>Aucun personnel enregistré.</p>
              </div>
            )}
            {personnel.map(p => (
              <div key={p.id} style={{ background: '#fff', borderRadius: 8, border: '0.5px solid #ddd', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#054035', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{p.nom?.charAt(0)}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{p.nom}</p>
                  <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                    <span style={{ fontSize: 11, background: p.role === 'Médecin' ? '#1565C0' : '#1A7A4A', color: '#fff', borderRadius: 4, padding: '1px 7px', fontWeight: 500 }}>{p.role}</span>
                    {p.telephone && <span style={{ fontSize: 11, color: '#666' }}>{p.telephone}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => { setPersonnelForm({ nom: p.nom, role: p.role, telephone: p.telephone || '' }); setEditPersonnelId(p.id); setShowPersonnel(true) }}
                    style={{ width: 28, height: 28, borderRadius: 6, background: '#E8F5E9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg style={{ width: 13, height: 13, color: '#1A7A4A' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button onClick={() => supprimerPersonnel(p.id)}
                    style={{ width: 28, height: 28, borderRadius: 6, background: '#FFEBEE', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg style={{ width: 13, height: 13, color: '#C0392B' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* RAPPORT */}
      {onglet === 'rapport' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Header rapport avec bouton outline */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.06em', margin: 0 }}>RAPPORT D'INFIRMERIE</p>
            <button style={{ background: 'transparent', color: '#6B7280', border: '0.5px solid #D1D5DB', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg style={{ width: 13, height: 13 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Exporter PDF
            </button>
          </div>

          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Total malades', val: totalMalades, iconBg: '#EFF6FF', iconColor: '#2563EB', valColor: '#1D4ED8',
                icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
              { label: 'Guéris', val: gueris, iconBg: '#ECFDF5', iconColor: '#059669', valColor: '#065F46',
                icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
              { label: 'En traitement', val: enTraitement, iconBg: '#FFFBEB', iconColor: '#D97706', valColor: '#92400E',
                icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
              { label: 'Évacués', val: evacues, iconBg: '#FEF2F2', iconColor: '#DC2626', valColor: '#991B1B',
                icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> },
            ].map(s => (
              <div key={s.label} style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #F3F4F6', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: 14 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: s.iconBg, color: s.iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                  {s.icon}
                </div>
                <p style={{ fontSize: 24, fontWeight: 700, color: s.valColor, margin: 0, lineHeight: 1 }}>{s.val}</p>
                <p style={{ fontSize: 11, color: '#6B7280', margin: '4px 0 0' }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Évacuations */}
          {evacues > 0 && (
            <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #FCA5A5', padding: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#DC2626', marginBottom: 10, letterSpacing: '0.06em' }}>ÉVACUATIONS</p>
              {fiches.filter(f => f.statut === 'Évacué').map(f => (
                <div key={f.id} style={{ background: '#FEF2F2', borderRadius: 10, padding: '10px 12px', marginBottom: 6 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#991B1B', margin: '0 0 4px' }}>{f.nom_campeur}</p>
                  <p style={{ fontSize: 11, color: '#555', margin: '0 0 2px' }}>Hôpital : {f.hopital || '-'}</p>
                  <p style={{ fontSize: 11, color: '#555', margin: 0 }}>Accompagnateur : {f.accompagnateur || '-'}</p>
                </div>
              ))}
            </div>
          )}

          {/* Stock médicaments avec jauges */}
          <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #F3F4F6', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', marginBottom: 12, letterSpacing: '0.06em' }}>STOCK MÉDICAMENTS</p>
            {medicaments.length === 0 && <p style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center' }}>Aucun médicament enregistré.</p>}
            {medicaments.map((m, i) => {
              const initial = m.quantite_initiale || 0
              const utilise = m.quantite_utilisee || 0
              const restant = initial - utilise
              const pct = initial > 0 ? (restant / initial) * 100 : 0
              const epuise = restant <= 0
              const critique = pct > 0 && pct <= 20
              const couleur = epuise ? '#DC2626' : critique ? '#D97706' : '#059669'
              return (
                <div key={m.id} style={{ marginBottom: i < medicaments.length - 1 ? 14 : 0, paddingBottom: i < medicaments.length - 1 ? 14 : 0, borderBottom: i < medicaments.length - 1 ? '0.5px solid #F9FAFB' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{m.nom}</span>
                      {epuise && <span style={{ fontSize: 10, background: '#FEF2F2', color: '#DC2626', borderRadius: 4, padding: '1px 7px', fontWeight: 600 }}>Épuisé</span>}
                      {critique && <span style={{ fontSize: 10, background: '#FFFBEB', color: '#D97706', borderRadius: 4, padding: '1px 7px', fontWeight: 600 }}>Critique</span>}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: couleur }}>{restant} {m.unite || 'cp'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 10, color: '#9CA3AF' }}>Initial : {initial}</span>
                    <span style={{ fontSize: 10, color: '#9CA3AF' }}>Utilisé : {utilise}</span>
                  </div>
                  <div style={{ background: '#F3F4F6', borderRadius: 8, height: 6 }}>
                    <div style={{ background: couleur, borderRadius: 8, height: 6, width: `${Math.max(pct, 0)}%`, transition: 'width .3s' }} />
                  </div>
                </div>
              )
            })}
          </div>

        </div>
      )}

    </AdminLayout>
  )
}
