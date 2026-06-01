import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/admin/AdminLayout'

const VERT = '#1B3B2B'
const STATUTS = ['En traitement', 'Guéri', 'Évacué']
const ROLES = ['Infirmier', 'Médecin', 'Autre']

const STATUT_CONFIG = {
  'En traitement': { bg: '#FEF9C3', color: '#854D0E' },
  'Guéri':         { bg: '#DCFCE7', color: '#166534' },
  'Évacué':        { bg: '#FEE2E2', color: '#991B1B' },
}

const EMPTY_FICHE = { nom_campeur: '', symptomes: '', traitement: '', statut: 'En traitement', hopital: '', accompagnateur: '', notes: '', personnel_id: '', nom_personnel: '' }
const EMPTY_PERSONNEL = { nom: '', role: 'Infirmier', telephone: '' }

function MedicamentSelect({ medicaments, medsSelectionnes, onAjouter, onRetirer, onUpdateQte }) {
  const [recherche, setRecherche] = useState('')
  const [ouvert, setOuvert] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOuvert(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])
  const filtres = medicaments.filter(m => m.nom.toLowerCase().includes(recherche.toLowerCase()) && !medsSelectionnes.find(ms => ms.id === m.id))
  return (
    <div ref={ref}>
      <div style={{ position: 'relative' }}>
        <input type="text" value={recherche} onChange={e => { setRecherche(e.target.value); setOuvert(true) }} onFocus={() => setOuvert(true)}
          placeholder="Rechercher un médicament..."
          style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', color: '#1E293B' }} />
        {ouvert && filtres.length > 0 && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, zIndex: 20, maxHeight: 140, overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            {filtres.map(m => {
              const restant = (m.quantite_initiale || 0) - (m.quantite_utilisee || 0)
              return (
                <div key={m.id} onClick={() => { onAjouter(m); setRecherche(''); setOuvert(false) }}
                  style={{ padding: '8px 12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', fontSize: 13, color: '#1E293B' }}>
                  {m.nom}
                  <span style={{ fontSize: 11, color: restant <= 0 ? '#DC2626' : '#065F46', fontWeight: 600 }}>{restant}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
      {medsSelectionnes.length > 0 && (
        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {medsSelectionnes.map(ms => (
            <div key={ms.id} style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#DBEAFE', borderRadius: 20, padding: '3px 10px' }}>
              <span style={{ fontSize: 12, color: '#1E40AF', fontWeight: 500 }}>{ms.nom}</span>
              <input type="number" min="1" value={ms.qte} onChange={e => onUpdateQte(ms.id, e.target.value)}
                style={{ width: 36, border: 'none', background: 'transparent', fontSize: 12, color: '#1E40AF', textAlign: 'center', outline: 'none' }} />
              <button type="button" onClick={() => onRetirer(ms.id)} style={{ color: '#1E40AF', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const inputStyle = { width: '100%', border: '1px solid #E2E8F0', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', background: '#fff', color: '#1E293B' }
const labelStyle = { display: 'block', fontSize: 11, color: '#64748B', marginBottom: 4, fontWeight: 500 }

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
    function handleClick(e) { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOuvert(null) }
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
    setFiches(f || []); setMedicaments(m || []); setMedUtilises(mu || []); setPersonnel(p || [])
    setLoading(false)
  }

  function setF(k, v) { setFiche(f => ({ ...f, [k]: v })) }
  function openNouvelleFiche() { setFiche(EMPTY_FICHE); setEditFicheId(null); setMedsSelectionnes([]); setShowFiche(true) }
  function openEditFiche(f) { setFiche({ nom_campeur: f.nom_campeur, symptomes: f.symptomes, traitement: f.traitement || '', statut: f.statut, hopital: f.hopital || '', accompagnateur: f.accompagnateur || '', notes: f.notes || '', personnel_id: f.personnel_id || '', nom_personnel: f.nom_personnel || '' }); setEditFicheId(f.id); setMedsSelectionnes([]); setShowFiche(true); setMenuOuvert(null) }

  async function saveFiche() {
    if (!fiche.nom_campeur || !fiche.symptomes) return
    setSaving(true)
    let ficheId = editFicheId
    const payload = { nom_campeur: fiche.nom_campeur, symptomes: fiche.symptomes, traitement: fiche.traitement, statut: fiche.statut, hopital: fiche.hopital, accompagnateur: fiche.accompagnateur, notes: fiche.notes, personnel_id: fiche.personnel_id || null, nom_personnel: fiche.nom_personnel || '' }
    if (editFicheId) { await supabase.from('fiches_malades').update(payload).eq('id', editFicheId) }
    else { const { data } = await supabase.from('fiches_malades').insert([payload]).select().single(); ficheId = data?.id }
    for (const ms of medsSelectionnes) {
      await supabase.from('medicaments_utilises').insert([{ fiche_id: ficheId, medicament_id: ms.id, nom_medicament: ms.nom, quantite: ms.qte }])
      const med = medicaments.find(m => m.id === ms.id)
      if (med) await supabase.from('stocks_medicaments').update({ quantite_utilisee: (med.quantite_utilisee || 0) + parseInt(ms.qte) }).eq('id', ms.id)
    }
    setSaving(false); setShowFiche(false); setEditFicheId(null); setFiche(EMPTY_FICHE); setMedsSelectionnes([]); fetchData()
  }

  async function saveMedicament() {
    if (!medForm.nom) return
    setSaving(true)
    if (editMedId) { await supabase.from('stocks_medicaments').update({ nom: medForm.nom, quantite_initiale: parseInt(medForm.quantite_initiale) || 0, unite: medForm.unite }).eq('id', editMedId) }
    else { await supabase.from('stocks_medicaments').insert([{ nom: medForm.nom, quantite_initiale: parseInt(medForm.quantite_initiale) || 0, quantite: parseInt(medForm.quantite_initiale) || 0, unite: medForm.unite, statut: 'disponible', quantite_utilisee: 0 }]) }
    setSaving(false); setShowMed(false); setEditMedId(null); setMedForm({ nom: '', quantite_initiale: 0, unite: 'comprimé(s)' }); fetchData()
  }

  async function savePersonnel() {
    if (!personnelForm.nom) return
    setSaving(true)
    if (editPersonnelId) { await supabase.from('personnel_medical').update(personnelForm).eq('id', editPersonnelId) }
    else { await supabase.from('personnel_medical').insert([personnelForm]) }
    setSaving(false); setShowPersonnel(false); setEditPersonnelId(null); setPersonnelForm(EMPTY_PERSONNEL); fetchData()
  }

  async function supprimerFiche(id) { if (!window.confirm('Supprimer cette fiche ?')) return; await supabase.from('fiches_malades').delete().eq('id', id); setMenuOuvert(null); fetchData() }
  async function supprimerMed(id) { if (!window.confirm('Supprimer ?')) return; await supabase.from('stocks_medicaments').delete().eq('id', id); fetchData() }
  async function supprimerPersonnel(id) { if (!window.confirm('Supprimer ?')) return; await supabase.from('personnel_medical').delete().eq('id', id); fetchData() }

  const totalMalades = fiches.length
  const enTraitement = fiches.filter(f => f.statut === 'En traitement').length
  const gueris = fiches.filter(f => f.statut === 'Guéri').length
  const evacues = fiches.filter(f => f.statut === 'Évacué').length
  const filtresFiches = fiches.filter(f => filtreStatut === 'tous' || f.statut === filtreStatut)

  const chipStyle = (active) => ({ flexShrink: 0, padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 500, cursor: 'pointer', border: `1px solid ${active ? VERT : '#E2E8F0'}`, background: active ? VERT : '#fff', color: active ? '#fff' : '#64748B' })

  const FormulaireFiche = () => (
    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: '12px', marginBottom: 12 }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', margin: '0 0 10px' }}>{editFicheId ? 'Modifier la fiche' : 'Nouvelle fiche'}</p>
      <div style={{ marginBottom: 8 }}><label style={labelStyle}>Nom du campeur *</label><input type="text" value={fiche.nom_campeur} onChange={e => setF('nom_campeur', e.target.value)} placeholder="YAO Jean-Pierre" style={inputStyle} /></div>
      <div style={{ marginBottom: 8 }}><label style={labelStyle}>Personnel médical</label>
        <select value={fiche.personnel_id} onChange={e => { const p = personnel.find(p => p.id === e.target.value); setF('personnel_id', e.target.value); setF('nom_personnel', p ? p.nom : '') }} style={inputStyle}>
          <option value="">-- Sélectionner --</option>
          {personnel.map(p => <option key={p.id} value={p.id}>{p.nom} ({p.role})</option>)}
        </select>
      </div>
      <div style={{ marginBottom: 8 }}><label style={labelStyle}>Symptômes *</label><textarea value={fiche.symptomes} onChange={e => setF('symptomes', e.target.value)} placeholder="Symptômes..." rows={2} style={{ ...inputStyle, resize: 'none' }} /></div>
      <div style={{ marginBottom: 8 }}><label style={labelStyle}>Traitement</label><textarea value={fiche.traitement} onChange={e => setF('traitement', e.target.value)} placeholder="Traitement..." rows={2} style={{ ...inputStyle, resize: 'none' }} /></div>
      <div style={{ marginBottom: 8 }}><label style={labelStyle}>Médicaments</label><MedicamentSelect medicaments={medicaments} medsSelectionnes={medsSelectionnes} onAjouter={m => setMedsSelectionnes(p => [...p, { ...m, qte: 1 }])} onRetirer={id => setMedsSelectionnes(p => p.filter(m => m.id !== id))} onUpdateQte={(id, qte) => setMedsSelectionnes(p => p.map(m => m.id === id ? { ...m, qte: parseInt(qte) || 1 } : m))} /></div>
      <div style={{ marginBottom: 8 }}><label style={labelStyle}>Statut</label>
        <select value={fiche.statut} onChange={e => setF('statut', e.target.value)} style={inputStyle}>{STATUTS.map(s => <option key={s}>{s}</option>)}</select>
      </div>
      {fiche.statut === 'Évacué' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
          <div><label style={labelStyle}>Hôpital</label><input type="text" value={fiche.hopital} onChange={e => setF('hopital', e.target.value)} style={inputStyle} /></div>
          <div><label style={labelStyle}>Accompagnateur</label><input type="text" value={fiche.accompagnateur} onChange={e => setF('accompagnateur', e.target.value)} style={inputStyle} /></div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button type="button" onClick={() => { setShowFiche(false); setEditFicheId(null) }} style={{ flex: 1, background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 8, padding: '9px', fontSize: 13, cursor: 'pointer' }}>Annuler</button>
        <button type="button" onClick={saveFiche} disabled={saving} style={{ flex: 1, background: VERT, color: '#fff', border: 'none', borderRadius: 8, padding: '9px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? '...' : editFicheId ? 'Modifier' : 'Enregistrer'}</button>
      </div>
    </div>
  )

  return (
    <AdminLayout>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1E293B', margin: 0 }}>Santé</h1>
          <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 0' }}>{totalMalades} fiche(s) · {medicaments.length} médicament(s)</p>
        </div>
        <button type="button" onClick={() => {}}
          style={{ width: 32, height: 32, borderRadius: 8, background: '#FEF2F2', border: '1px solid #FCA5A5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#DC2626" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
        </button>
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12, borderBottom: '1px solid #E2E8F0', paddingBottom: 0 }}>
        {[{ key: 'malades', label: 'Malades' }, { key: 'medicaments', label: 'Médicaments' }, { key: 'personnel', label: 'Personnel' }, { key: 'rapport', label: 'Rapport' }].map(o => (
          <button key={o.key} type="button" onClick={() => setOnglet(o.key)}
            style={{ padding: '7px 12px', fontSize: 12, fontWeight: onglet === o.key ? 700 : 400, color: onglet === o.key ? VERT : '#64748B', background: 'none', border: 'none', borderBottom: onglet === o.key ? `2px solid ${VERT}` : '2px solid transparent', cursor: 'pointer', marginBottom: -1 }}>
            {o.label}
          </button>
        ))}
      </div>

      {/* ── MALADES ── */}
      {onglet === 'malades' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
              {['tous', ...STATUTS].map(s => (
                <button key={s} type="button" onClick={() => setFiltreStatut(s)} style={chipStyle(filtreStatut === s)}>
                  {s === 'tous' ? 'Tous' : s}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => showFiche && !editFicheId ? setShowFiche(false) : openNouvelleFiche()}
              style={{ width: 30, height: 30, borderRadius: '50%', background: showFiche && !editFicheId ? '#FEF2F2' : VERT, color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 300, flexShrink: 0, marginLeft: 8 }}>
              {showFiche && !editFicheId ? '×' : '+'}
            </button>
          </div>

          {showFiche && <FormulaireFiche />}

          {loading && <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '16px 0' }}>Chargement...</p>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} ref={menuRef}>
            {filtresFiches.map(f => {
              const sc = STATUT_CONFIG[f.statut] || STATUT_CONFIG['En traitement']
              const medsF = medUtilises.filter(mu => mu.fiche_id === f.id)
              return (
                <div key={f.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: '10px 12px' }}>
                  {/* Ligne 1 — nom + menu */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', margin: 0 }}>{f.nom_campeur}</p>
                    <div style={{ position: 'relative' }}>
                      <button type="button" onClick={() => setMenuOuvert(menuOuvert === f.id ? null : f.id)}
                        style={{ width: 26, height: 26, borderRadius: 7, background: '#F8FAFC', border: '1px solid #E2E8F0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#94A3B8' }}>···</button>
                      {menuOuvert === f.id && (
                        <div style={{ position: 'absolute', right: 0, top: 30, background: '#fff', borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', zIndex: 20, minWidth: 130, overflow: 'hidden' }}>
                          <button type="button" onClick={() => openEditFiche(f)} style={{ width: '100%', padding: '9px 14px', fontSize: 13, color: '#1E293B', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>Modifier</button>
                          <div style={{ height: 1, background: '#F1F5F9' }} />
                          <button type="button" onClick={() => supprimerFiche(f.id)} style={{ width: '100%', padding: '9px 14px', fontSize: 13, color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>Supprimer</button>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Ligne 2 — badge + médecin + heure */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, fontWeight: 600, background: sc.bg, color: sc.color, borderRadius: 20, padding: '2px 8px' }}>{f.statut}</span>
                    {f.nom_personnel && <span style={{ fontSize: 11, color: '#64748B' }}>{f.nom_personnel}</span>}
                    <span style={{ fontSize: 10, color: '#CBD5E1' }}>{new Date(f.date_heure).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  {/* Ligne 3 — symptômes | traitement */}
                  <div style={{ display: 'grid', gridTemplateColumns: f.traitement ? '1fr 1fr' : '1fr', gap: 6, marginBottom: medsF.length > 0 ? 7 : 0 }}>
                    <p style={{ fontSize: 11, color: '#475569', margin: 0, lineHeight: 1.4 }}>
                      <span style={{ fontWeight: 600, color: '#1E293B' }}>Symptômes : </span>{f.symptomes}
                    </p>
                    {f.traitement && (
                      <p style={{ fontSize: 11, color: '#475569', margin: 0, lineHeight: 1.4 }}>
                        <span style={{ fontWeight: 600, color: '#065F46' }}>Traitement : </span>{f.traitement}
                      </p>
                    )}
                  </div>
                  {/* Médicaments micro-tags */}
                  {medsF.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {medsF.map(mu => (
                        <span key={mu.id} style={{ fontSize: 10, fontWeight: 600, background: '#DBEAFE', color: '#1E40AF', borderRadius: 20, padding: '2px 8px' }}>
                          {mu.nom_medicament} x{mu.quantite}
                        </span>
                      ))}
                    </div>
                  )}
                  {f.statut === 'Évacué' && (f.hopital || f.accompagnateur) && (
                    <p style={{ fontSize: 11, color: '#991B1B', margin: '6px 0 0', background: '#FEF2F2', borderRadius: 6, padding: '4px 8px' }}>
                      {f.hopital && `Hôpital : ${f.hopital}`}{f.hopital && f.accompagnateur && ' · '}{f.accompagnateur && `Accomp. : ${f.accompagnateur}`}
                    </p>
                  )}
                </div>
              )
            })}
            {filtresFiches.length === 0 && !loading && <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '16px' }}>Aucune fiche.</p>}
          </div>
        </>
      )}

      {/* ── MÉDICAMENTS ── */}
      {onglet === 'medicaments' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', margin: 0 }}>STOCK ({medicaments.length})</p>
            <button type="button" onClick={() => { setShowMed(!showMed); setEditMedId(null); setMedForm({ nom: '', quantite_initiale: 0, unite: 'comprimé(s)' }) }}
              style={{ width: 30, height: 30, borderRadius: '50%', background: showMed ? '#FEF2F2' : VERT, color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 300 }}>
              {showMed ? '×' : '+'}
            </button>
          </div>

          {showMed && (
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: '12px', marginBottom: 12 }}>
              <div style={{ marginBottom: 8 }}><label style={labelStyle}>Nom *</label><input type="text" value={medForm.nom} onChange={e => setMedForm(f => ({ ...f, nom: e.target.value }))} placeholder="Ex : Paracétamol" style={inputStyle} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                <div><label style={labelStyle}>Quantité initiale</label><input type="number" min="0" value={medForm.quantite_initiale} onChange={e => setMedForm(f => ({ ...f, quantite_initiale: e.target.value }))} style={inputStyle} /></div>
                <div><label style={labelStyle}>Unité</label>
                  <select value={medForm.unite} onChange={e => setMedForm(f => ({ ...f, unite: e.target.value }))} style={inputStyle}>
                    {['comprimé(s)', 'sachet(s)', 'flacon(s)', 'ampoule(s)', 'tube(s)', 'boîte(s)'].map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => setShowMed(false)} style={{ flex: 1, background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 8, padding: '9px', fontSize: 13, cursor: 'pointer' }}>Annuler</button>
                <button type="button" onClick={saveMedicament} disabled={saving} style={{ flex: 1, background: VERT, color: '#fff', border: 'none', borderRadius: 8, padding: '9px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? '...' : editMedId ? 'Modifier' : 'Ajouter'}</button>
              </div>
            </div>
          )}

          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            {medicaments.length === 0 && <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '16px', margin: 0 }}>Aucun médicament.</p>}
            {medicaments.map((m, i) => {
              const initial = m.quantite_initiale || 0
              const utilise = m.quantite_utilisee || 0
              const restant = initial - utilise
              const pct = initial > 0 ? (restant / initial) * 100 : 0
              const epuise = restant <= 0
              const warning = pct > 0 && pct <= 20
              const couleur = epuise ? '#DC2626' : warning ? '#D97706' : '#065F46'
              return (
                <div key={m.id} style={{ padding: '10px 14px', borderBottom: i < medicaments.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', margin: 0 }}>{m.nom}</p>
                        <span style={{ fontSize: 10, color: '#94A3B8' }}>Initial : {initial} · Utilisé : {utilise} · <strong style={{ color: couleur }}>Restant : {restant}</strong></span>
                      </div>
                      <div style={{ background: '#F1F5F9', borderRadius: 4, height: 3, marginTop: 5 }}>
                        <div style={{ background: couleur, borderRadius: 4, height: 3, width: `${Math.max(pct, 0)}%`, transition: 'width .3s' }} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 5, marginLeft: 10, flexShrink: 0 }}>
                      <button type="button" onClick={() => { setMedForm({ nom: m.nom, quantite_initiale: m.quantite_initiale || 0, unite: m.unite || 'comprimé(s)' }); setEditMedId(m.id); setShowMed(true) }}
                        style={{ width: 26, height: 26, borderRadius: 7, background: '#ECFDF5', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#065F46" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      </button>
                      <button type="button" onClick={() => supprimerMed(m.id)}
                        style={{ width: 26, height: 26, borderRadius: 7, background: '#FEF2F2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#DC2626" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ── PERSONNEL ── */}
      {onglet === 'personnel' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', margin: 0 }}>ÉQUIPE ({personnel.length})</p>
            <button type="button" onClick={() => { setShowPersonnel(!showPersonnel); setEditPersonnelId(null); setPersonnelForm(EMPTY_PERSONNEL) }}
              style={{ width: 30, height: 30, borderRadius: '50%', background: showPersonnel ? '#FEF2F2' : VERT, color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 300 }}>
              {showPersonnel ? '×' : '+'}
            </button>
          </div>

          {showPersonnel && (
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: '12px', marginBottom: 12 }}>
              <div style={{ marginBottom: 8 }}><label style={labelStyle}>Nom *</label><input type="text" value={personnelForm.nom} onChange={e => setPersonnelForm(f => ({ ...f, nom: e.target.value }))} placeholder="Dr KOUASSI Ange" style={inputStyle} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                <div><label style={labelStyle}>Rôle</label><select value={personnelForm.role} onChange={e => setPersonnelForm(f => ({ ...f, role: e.target.value }))} style={inputStyle}>{ROLES.map(r => <option key={r}>{r}</option>)}</select></div>
                <div><label style={labelStyle}>Téléphone</label><input type="text" value={personnelForm.telephone} onChange={e => setPersonnelForm(f => ({ ...f, telephone: e.target.value }))} placeholder="07 XX XX XX XX" style={inputStyle} /></div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => setShowPersonnel(false)} style={{ flex: 1, background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 8, padding: '9px', fontSize: 13, cursor: 'pointer' }}>Annuler</button>
                <button type="button" onClick={savePersonnel} disabled={saving} style={{ flex: 1, background: VERT, color: '#fff', border: 'none', borderRadius: 8, padding: '9px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>{saving ? '...' : editPersonnelId ? 'Modifier' : 'Ajouter'}</button>
              </div>
            </div>
          )}

          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            {personnel.length === 0 && <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '16px', margin: 0 }}>Aucun personnel.</p>}
            {personnel.map((p, i) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderBottom: i < personnel.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#E8F5E8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: VERT }}>{p.nom?.charAt(0)}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nom}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, background: '#DCFCE7', color: '#166534', borderRadius: 20, padding: '2px 8px' }}>{p.role}</span>
                    {p.telephone && <span style={{ fontSize: 11, color: '#64748B' }}>{p.telephone}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                  <button type="button" onClick={() => { setPersonnelForm({ nom: p.nom, role: p.role, telephone: p.telephone || '' }); setEditPersonnelId(p.id); setShowPersonnel(true) }}
                    style={{ width: 26, height: 26, borderRadius: 7, background: '#ECFDF5', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#065F46" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  </button>
                  <button type="button" onClick={() => supprimerPersonnel(p.id)}
                    style={{ width: 26, height: 26, borderRadius: 7, background: '#FEF2F2', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#DC2626" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── RAPPORT ── */}
      {onglet === 'rapport' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', margin: 0 }}>RAPPORT D'INFIRMERIE</p>
            <button type="button" style={{ background: 'transparent', color: '#64748B', border: '1px solid #E2E8F0', borderRadius: 8, padding: '5px 10px', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
              PDF
            </button>
          </div>

          {/* 4 KPI compact horizontaux */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
            {[
              { label: 'Total', val: totalMalades, bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
              { label: 'Guéris', val: gueris, bg: '#ECFDF5', color: '#065F46', border: '#6EE7B7' },
              { label: 'Traitement', val: enTraitement, bg: '#FFFBEB', color: '#92400E', border: '#FCD34D' },
              { label: 'Évacués', val: evacues, bg: '#FEF2F2', color: '#991B1B', border: '#FCA5A5' },
            ].map(s => (
              <div key={s.label} style={{ background: '#fff', borderRadius: 10, border: `1px solid ${s.border}`, padding: '8px 6px', textAlign: 'center' }}>
                <p style={{ fontSize: 22, fontWeight: 700, color: s.color, margin: '0 0 2px', lineHeight: 1 }}>{s.val}</p>
                <p style={{ fontSize: 9, color: '#94A3B8', margin: 0 }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Évacuations si applicable */}
          {evacues > 0 && (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #FCA5A5', overflow: 'hidden' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#DC2626', letterSpacing: '0.1em', padding: '8px 14px', margin: 0, borderBottom: '1px solid #FEE2E2' }}>ÉVACUATIONS</p>
              {fiches.filter(f => f.statut === 'Évacué').map((f, i, arr) => (
                <div key={f.id} style={{ padding: '8px 14px', borderBottom: i < arr.length - 1 ? '1px solid #FEE2E2' : 'none' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#991B1B', margin: '0 0 2px' }}>{f.nom_campeur}</p>
                  <p style={{ fontSize: 11, color: '#64748B', margin: 0 }}>{f.hopital || '—'} · {f.accompagnateur || '—'}</p>
                </div>
              ))}
            </div>
          )}

          {/* Stock médicaments */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', padding: '8px 14px', margin: 0, borderBottom: '1px solid #F1F5F9' }}>STOCK MÉDICAMENTS</p>
            {medicaments.map((m, i) => {
              const initial = m.quantite_initiale || 0
              const utilise = m.quantite_utilisee || 0
              const restant = initial - utilise
              const pct = initial > 0 ? (restant / initial) * 100 : 0
              const epuise = restant <= 0
              const couleur = epuise ? '#DC2626' : pct <= 20 ? '#D97706' : '#065F46'
              return (
                <div key={m.id} style={{ padding: '8px 14px', borderBottom: i < medicaments.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#1E293B' }}>{m.nom}</span>
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>Initial : {initial} · Utilisé : {utilise} · <strong style={{ color: couleur }}>{restant}</strong></span>
                  </div>
                  <div style={{ background: '#F1F5F9', borderRadius: 4, height: 3 }}>
                    <div style={{ background: couleur, borderRadius: 4, height: 3, width: `${Math.max(pct, 0)}%`, transition: 'width .3s' }} />
                  </div>
                </div>
              )
            })}
            {medicaments.length === 0 && <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '12px', margin: 0 }}>Aucun médicament.</p>}
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
