import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/admin/AdminLayout'

const VERT = '#1B3B2B'
const VERT_CLAIR = '#E8F5E8'

const EXT_CONFIG = {
  PDF:  { color: '#DC2626', bg: '#FEF2F2' },
  DOCX: { color: '#1D4ED8', bg: '#EFF6FF' },
  DOC:  { color: '#1D4ED8', bg: '#EFF6FF' },
  XLSX: { color: '#065F46', bg: '#ECFDF5' },
  XLS:  { color: '#065F46', bg: '#ECFDF5' },
  PPTX: { color: '#92400E', bg: '#FFFBEB' },
  PPT:  { color: '#92400E', bg: '#FFFBEB' },
}

function getExt(url) {
  if (!url) return 'PDF'
  return url.split('.').pop().split('?')[0].toUpperCase()
}

function ExtIcon({ ext }) {
  const cfg = EXT_CONFIG[ext] || { color: '#475569', bg: '#F1F5F9' }
  return (
    <div style={{ width: 38, height: 38, borderRadius: 10, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={cfg.color} strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
      </svg>
    </div>
  )
}

const EMPTY_DOC = { nom: '', description: '', dossier_id: '' }
const EMPTY_DOSSIER = { nom: '' }
const iS = { width: '100%', border: '1px solid #E2E8F0', borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none', background: '#fff', color: '#1E293B' }
const lS = { fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4, fontWeight: 500 }

export default function DocumentsAdminPage() {
  const [dossiers, setDossiers]     = useState([])
  const [documents, setDocuments]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [dossierOuvert, setDossierOuvert] = useState(null)
  const [showFormDoc, setShowFormDoc]     = useState(false)
  const [showFormDossier, setShowFormDossier] = useState(false)
  const [formDoc, setFormDoc]   = useState(EMPTY_DOC)
  const [formDossier, setFormDossier] = useState(EMPTY_DOSSIER)
  const [editDocId, setEditDocId]   = useState(null)
  const [editDossierId, setEditDossierId] = useState(null)
  const [fichier, setFichier]       = useState(null)
  const [saving, setSaving]         = useState(false)
  const [progress, setProgress]     = useState(0)
  const [erreur, setErreur]         = useState('')
  const [menuOuvert, setMenuOuvert] = useState(null)
  const menuRef = useRef(null)

  useEffect(() => { fetchAll() }, [])
  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOuvert(null)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function fetchAll() {
    const [{ data: d }, { data: docs }] = await Promise.all([
      supabase.from('dossiers_documents').select('*').order('ordre'),
      supabase.from('documents').select('*').order('created_at', { ascending: false }),
    ])
    setDossiers(d || [])
    setDocuments(docs || [])
    setLoading(false)
  }

  // ── Dossiers ──
  async function saveDossier() {
    if (!formDossier.nom) return
    setSaving(true)
    if (editDossierId) {
      await supabase.from('dossiers_documents').update({ nom: formDossier.nom }).eq('id', editDossierId)
    } else {
      await supabase.from('dossiers_documents').insert([{ nom: formDossier.nom, ordre: dossiers.length }])
    }
    setSaving(false); setShowFormDossier(false); setFormDossier(EMPTY_DOSSIER); setEditDossierId(null)
    fetchAll()
  }

  async function supprimerDossier(id) {
    if (!window.confirm('Supprimer ce dossier et tous ses documents ?')) return
    const docs = documents.filter(d => d.dossier_id === id)
    for (const doc of docs) {
      if (doc.lien_fichier) {
        const nom = doc.lien_fichier.split('/').pop()
        await supabase.storage.from('documents-camp').remove([nom])
      }
    }
    await supabase.from('documents').delete().eq('dossier_id', id)
    await supabase.from('dossiers_documents').delete().eq('id', id)
    setMenuOuvert(null); fetchAll()
  }

  function openEditDossier(dossier) {
    setFormDossier({ nom: dossier.nom })
    setEditDossierId(dossier.id)
    setShowFormDossier(true)
    setMenuOuvert(null)
  }

  // ── Documents ──
  function openNewDoc(dossierId = '') {
    setFormDoc({ ...EMPTY_DOC, dossier_id: dossierId })
    setEditDocId(null); setFichier(null); setErreur(''); setProgress(0)
    setShowFormDoc(true)
  }

  async function saveDoc() {
    if (!formDoc.nom || (!fichier && !editDocId)) return
    setSaving(true); setErreur(''); setProgress(10)
    let lien_fichier = editDocId ? documents.find(d => d.id === editDocId)?.lien_fichier : ''
    if (fichier) {
      const ext = fichier.name.split('.').pop().toLowerCase()
      const nomFichier = `${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('documents-camp').upload(nomFichier, fichier, { cacheControl: '3600', upsert: true })
      if (uploadError) { setErreur(`Erreur upload : ${uploadError.message}`); setSaving(false); setProgress(0); return }
      setProgress(70)
      const { data: urlData } = supabase.storage.from('documents-camp').getPublicUrl(nomFichier)
      lien_fichier = urlData.publicUrl
    }
    setProgress(90)
    const tailleMo = fichier ? (fichier.size / 1024 / 1024).toFixed(1) : null
    const payload = {
      nom: formDoc.nom,
      description: formDoc.description,
      dossier_id: formDoc.dossier_id || null,
      lien_fichier,
      taille: tailleMo && parseFloat(tailleMo) > 0 ? `${tailleMo} MB` : '',
    }
    if (editDocId) {
      await supabase.from('documents').update(payload).eq('id', editDocId)
    } else {
      await supabase.from('documents').insert([payload])
    }
    setProgress(100); setSaving(false); setShowFormDoc(false)
    setFormDoc(EMPTY_DOC); setEditDocId(null); setFichier(null); setProgress(0)
    fetchAll()
  }

  async function supprimerDocument(doc) {
    if (!window.confirm('Supprimer ce document ?')) return
    if (doc.lien_fichier) {
      const nomFichier = doc.lien_fichier.split('/').pop()
      await supabase.storage.from('documents-camp').remove([nomFichier])
    }
    await supabase.from('documents').delete().eq('id', doc.id)
    setMenuOuvert(null); fetchAll()
  }

  function openEditDoc(doc) {
    setFormDoc({ nom: doc.nom, description: doc.description || '', dossier_id: doc.dossier_id || '' })
    setEditDocId(doc.id); setFichier(null); setErreur(''); setProgress(0)
    setShowFormDoc(true); setMenuOuvert(null)
  }

  const docsSansDossier = documents.filter(d => !d.dossier_id)

  return (
    <AdminLayout>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#F8FAFC', overflow: 'hidden' }}>

        {/* ── HEADER FIXE ── */}
        <div style={{ flexShrink: 0, padding: '14px 14px 10px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC', zIndex: 2, position: 'relative', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1E293B', margin: 0 }}>Documents</h1>
              <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 0' }}>{dossiers.length} dossier(s) · {documents.length} document(s)</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => { setShowFormDossier(!showFormDossier); setShowFormDoc(false); setEditDossierId(null); setFormDossier(EMPTY_DOSSIER) }}
                style={{ height: 32, borderRadius: 10, background: showFormDossier ? '#FEF2F2' : '#F1F5F9', color: showFormDossier ? '#DC2626' : '#475569', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: '0 12px' }}>
                {showFormDossier ? '×' : '+ Dossier'}
              </button>
              <button type="button" onClick={() => { setShowFormDoc(!showFormDoc); setShowFormDossier(false); setEditDocId(null); setFormDoc(EMPTY_DOC) }}
                style={{ width: 32, height: 32, borderRadius: '50%', background: showFormDoc && !editDocId ? '#FEF2F2' : VERT, color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 300 }}>
                {showFormDoc && !editDocId ? '×' : '+'}
              </button>
            </div>
          </div>
        </div>

        {/* ── ZONE SCROLLABLE ── */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '12px 14px 14px' }} ref={menuRef}>

          {/* Formulaire nouveau dossier */}
          {showFormDossier && (
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: 14, marginBottom: 12 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', margin: '0 0 10px' }}>
                {editDossierId ? 'Renommer le dossier' : 'Nouveau dossier'}
              </p>
              <div style={{ marginBottom: 12 }}>
                <label style={lS}>Nom du dossier *</label>
                <input type="text" value={formDossier.nom}
                  onChange={e => setFormDossier({ nom: e.target.value })}
                  placeholder="Ex : Inscriptions, Finances, Programme..."
                  style={iS} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => { setShowFormDossier(false); setEditDossierId(null); setFormDossier(EMPTY_DOSSIER) }}
                  style={{ flex: 1, background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 10, padding: 10, fontSize: 13, cursor: 'pointer' }}>
                  Annuler
                </button>
                <button type="button" onClick={saveDossier} disabled={saving || !formDossier.nom}
                  style={{ flex: 1, background: VERT, color: '#fff', border: 'none', borderRadius: 10, padding: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving || !formDossier.nom ? 0.7 : 1 }}>
                  {saving ? '...' : editDossierId ? 'Renommer' : 'Créer'}
                </button>
              </div>
            </div>
          )}

          {/* Formulaire nouveau document */}
          {showFormDoc && (
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: 14, marginBottom: 12 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', margin: '0 0 10px' }}>
                {editDocId ? 'Modifier le document' : 'Nouveau document'}
              </p>
              <div style={{ marginBottom: 10 }}>
                <label style={lS}>Nom du document *</label>
                <input type="text" value={formDoc.nom} onChange={e => setFormDoc(f => ({ ...f, nom: e.target.value }))}
                  placeholder="Ex : Liste des campeurs 2026" style={iS} />
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={lS}>Description</label>
                <input type="text" value={formDoc.description} onChange={e => setFormDoc(f => ({ ...f, description: e.target.value }))}
                  placeholder="Ex : Document officiel mis à jour le 15 juin" style={iS} />
              </div>
              <div style={{ marginBottom: 10 }}>
                <label style={lS}>Ranger dans un dossier</label>
                <select value={formDoc.dossier_id} onChange={e => setFormDoc(f => ({ ...f, dossier_id: e.target.value }))} style={iS}>
                  <option value="">-- Sans dossier --</option>
                  {dossiers.map(d => <option key={d.id} value={d.id}>{d.nom}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={lS}>Fichier {!editDocId && '*'}</label>
                <div style={{ border: '1px dashed #CBD5E1', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
                  {fichier ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, background: VERT_CLAIR, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke={VERT} strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                        </div>
                        <p style={{ fontSize: 12, color: '#1E293B', margin: 0 }}>{fichier.name.slice(0, 30)}</p>
                      </div>
                      <button type="button" onClick={() => setFichier(null)} style={{ fontSize: 11, color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer' }}>Retirer</button>
                    </div>
                  ) : (
                    <label style={{ cursor: 'pointer', display: 'block' }}>
                      <svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="#CBD5E1" strokeWidth="1.5" style={{ margin: '0 auto 6px' }}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                      <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>Appuyer pour sélectionner un fichier</p>
                      <p style={{ fontSize: 10, color: '#CBD5E1', margin: '3px 0 0' }}>PDF, Word, Excel — max 50 MB</p>
                      <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" style={{ display: 'none' }} onChange={e => setFichier(e.target.files[0])} />
                    </label>
                  )}
                </div>
                {editDocId && <p style={{ fontSize: 10, color: VERT, margin: '4px 0 0' }}>Fichier existant conservé si pas de nouveau fichier</p>}
              </div>
              {saving && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94A3B8', marginBottom: 4 }}>
                    <span>Upload en cours...</span><span>{progress}%</span>
                  </div>
                  <div style={{ background: '#F1F5F9', borderRadius: 4, height: 3 }}>
                    <div style={{ background: VERT, height: 3, borderRadius: 4, width: `${progress}%`, transition: 'width .3s' }} />
                  </div>
                </div>
              )}
              {erreur && <p style={{ fontSize: 11, color: '#DC2626', background: '#FEF2F2', borderRadius: 8, padding: '8px 12px', marginBottom: 10 }}>{erreur}</p>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => { setShowFormDoc(false); setEditDocId(null); setFormDoc(EMPTY_DOC) }}
                  style={{ flex: 1, background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 10, padding: 10, fontSize: 13, cursor: 'pointer' }}>
                  Annuler
                </button>
                <button type="button" onClick={saveDoc} disabled={saving || !formDoc.nom || (!fichier && !editDocId)}
                  style={{ flex: 1, background: VERT, color: '#fff', border: 'none', borderRadius: 10, padding: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving || !formDoc.nom || (!fichier && !editDocId) ? 0.7 : 1 }}>
                  {saving ? 'Upload...' : editDocId ? 'Modifier' : 'Publier'}
                </button>
              </div>
            </div>
          )}

          {loading && <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '20px 0' }}>Chargement...</p>}

          {!loading && dossiers.length === 0 && documents.length === 0 && (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: 28, textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: '#94A3B8', margin: '0 0 10px' }}>Aucun document pour l'instant.</p>
              <button type="button" onClick={() => setShowFormDossier(true)}
                style={{ fontSize: 13, color: VERT, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                + Créer le premier dossier
              </button>
            </div>
          )}

          {/* ── DOSSIERS ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {dossiers.map(dossier => {
              const docsInDossier = documents.filter(d => d.dossier_id === dossier.id)
              const ouvert = dossierOuvert === dossier.id
              return (
                <div key={dossier.id} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${ouvert ? '#CBD5E1' : '#E2E8F0'}` }}>
                  {/* En-tête dossier */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', cursor: 'pointer' }}
                    onClick={() => setDossierOuvert(prev => prev === dossier.id ? null : dossier.id)}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: ouvert ? VERT : VERT_CLAIR, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .2s' }}>
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={ouvert ? '#fff' : VERT} strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d={ouvert
                          ? "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                          : "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"} />
                      </svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', margin: 0 }}>{dossier.nom}</p>
                      <p style={{ fontSize: 11, color: '#94A3B8', margin: '1px 0 0' }}>{docsInDossier.length} document(s)</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#94A3B8" strokeWidth="2"
                        style={{ transition: 'transform .25s', transform: ouvert ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                      </svg>
                      {/* Menu dossier */}
                      <div style={{ position: 'relative' }}>
                        <button type="button" onClick={e => { e.stopPropagation(); setMenuOuvert(menuOuvert === `d-${dossier.id}` ? null : `d-${dossier.id}`) }}
                          style={{ width: 28, height: 28, borderRadius: 8, background: '#F8FAFC', border: '1px solid #E2E8F0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#94A3B8' }}>
                          ···
                        </button>
                        {menuOuvert === `d-${dossier.id}` && (
                          <div style={{ position: 'absolute', right: 0, top: 32, background: '#fff', borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', zIndex: 20, minWidth: 155, overflow: 'hidden' }}>
                            <button type="button" onClick={e => { e.stopPropagation(); openEditDossier(dossier) }}
                              style={{ width: '100%', padding: '9px 14px', fontSize: 13, color: '#1E293B', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}>
                              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                              Renommer
                            </button>
                            <div style={{ height: 1, background: '#F1F5F9' }} />
                            <button type="button" onClick={e => { e.stopPropagation(); openNewDoc(dossier.id) }}
                              style={{ width: '100%', padding: '9px 14px', fontSize: 13, color: VERT, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}>
                              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
                              Ajouter un doc
                            </button>
                            <div style={{ height: 1, background: '#F1F5F9' }} />
                            <button type="button" onClick={e => { e.stopPropagation(); supprimerDossier(dossier.id) }}
                              style={{ width: '100%', padding: '9px 14px', fontSize: 13, color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}>
                              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                              Supprimer
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Documents du dossier */}
                  {ouvert && (
                    <div style={{ borderTop: '1px solid #F1F5F9' }}>
                      {docsInDossier.length === 0 ? (
                        <div style={{ padding: '14px', textAlign: 'center' }}>
                          <p style={{ fontSize: 12, color: '#94A3B8', margin: '0 0 8px' }}>Dossier vide</p>
                          <button type="button" onClick={() => openNewDoc(dossier.id)}
                            style={{ fontSize: 12, color: VERT, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                            + Ajouter un document
                          </button>
                        </div>
                      ) : (
                        docsInDossier.map((doc, i) => (
                          <DocLigne key={doc.id} doc={doc} isLast={i === docsInDossier.length - 1}
                            menuOuvert={menuOuvert} setMenuOuvert={setMenuOuvert}
                            onEdit={openEditDoc} onDelete={supprimerDocument} />
                        ))
                      )}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Documents sans dossier */}
            {docsSansDossier.length > 0 && (
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '4px 0 8px' }}>
                  Sans dossier ({docsSansDossier.length})
                </p>
                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                  {docsSansDossier.map((doc, i) => (
                    <DocLigne key={doc.id} doc={doc} isLast={i === docsSansDossier.length - 1}
                      menuOuvert={menuOuvert} setMenuOuvert={setMenuOuvert}
                      onEdit={openEditDoc} onDelete={supprimerDocument} />
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>{/* fin zone scrollable */}
      </div>{/* fin conteneur absolu */}
    </AdminLayout>
  )
}

function DocLigne({ doc, isLast, menuOuvert, setMenuOuvert, onEdit, onDelete }) {
  const ext = getExt(doc.lien_fichier)
  const date = new Date(doc.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  const taille = doc.taille && doc.taille !== '0.0 MB' ? doc.taille : ''
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderBottom: isLast ? 'none' : '1px solid #F1F5F9' }}>
      <ExtIcon ext={ext} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: '#1E293B', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.nom}</p>
        <p style={{ fontSize: 10, color: '#94A3B8', margin: 0 }}>{[date, taille].filter(Boolean).join(' · ')}</p>
        {doc.description && <p style={{ fontSize: 10, color: '#64748B', margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.description}</p>}
      </div>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <button type="button" onClick={() => setMenuOuvert(menuOuvert === doc.id ? null : doc.id)}
          style={{ width: 28, height: 28, borderRadius: 8, background: '#F8FAFC', border: '1px solid #E2E8F0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#94A3B8' }}>
          ···
        </button>
        {menuOuvert === doc.id && (
          <div style={{ position: 'absolute', right: 0, top: 32, background: '#fff', borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', zIndex: 20, minWidth: 155, overflow: 'hidden' }}>
            {doc.lien_fichier && (
              <>
                <a href={doc.lien_fichier} target="_blank" rel="noreferrer" onClick={() => setMenuOuvert(null)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', fontSize: 13, color: '#1E293B', textDecoration: 'none' }}>
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                  Télécharger
                </a>
                <div style={{ height: 1, background: '#F1F5F9' }} />
              </>
            )}
            <button type="button" onClick={() => onEdit(doc)}
              style={{ width: '100%', padding: '9px 14px', fontSize: 13, color: '#1E293B', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
              Modifier
            </button>
            <div style={{ height: 1, background: '#F1F5F9' }} />
            <button type="button" onClick={() => onDelete(doc)}
              style={{ width: '100%', padding: '9px 14px', fontSize: 13, color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              Supprimer
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
