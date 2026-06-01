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
    <div style={{ width: 40, height: 40, borderRadius: 10, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke={cfg.color} strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
      </svg>
    </div>
  )
}

export default function DocumentsAdminPage() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [nom, setNom] = useState('')
  const [description, setDescription] = useState('')
  const [fichier, setFichier] = useState(null)
  const [saving, setSaving] = useState(false)
  const [progress, setProgress] = useState(0)
  const [erreur, setErreur] = useState('')
  const [menuOuvert, setMenuOuvert] = useState(null)
  const menuRef = useRef(null)

  useEffect(() => { fetchDocuments() }, [])
  useEffect(() => {
    function handleClick(e) { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOuvert(null) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function fetchDocuments() {
    const { data } = await supabase.from('documents').select('*').order('created_at', { ascending: false })
    setDocuments(data || [])
    setLoading(false)
  }

  async function handleAjouter() {
    if (!nom || !fichier) return
    setSaving(true); setErreur(''); setProgress(10)
    const ext = fichier.name.split('.').pop().toLowerCase()
    const nomFichier = `${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage.from('documents-camp').upload(nomFichier, fichier, { cacheControl: '3600', upsert: true })
    if (uploadError) { setErreur(`Erreur upload : ${uploadError.message}`); setSaving(false); setProgress(0); return }
    setProgress(70)
    const { data: urlData } = supabase.storage.from('documents-camp').getPublicUrl(nomFichier)
    const tailleMo = (fichier.size / 1024 / 1024).toFixed(1)
    const { error: insertError } = await supabase.from('documents').insert([{ nom, description, lien_fichier: urlData.publicUrl, taille: parseFloat(tailleMo) > 0 ? `${tailleMo} MB` : '' }])
    if (insertError) { setErreur(`Erreur : ${insertError.message}`); setSaving(false); setProgress(0); return }
    setProgress(100); setNom(''); setDescription(''); setFichier(null); setProgress(0); setSaving(false); setShowForm(false)
    fetchDocuments()
  }

  async function supprimerDocument(doc) {
    if (!window.confirm('Supprimer ce document ?')) return
    if (doc.lien_fichier) { const nomFichier = doc.lien_fichier.split('/').pop(); await supabase.storage.from('documents-camp').remove([nomFichier]) }
    await supabase.from('documents').delete().eq('id', doc.id)
    setMenuOuvert(null); fetchDocuments()
  }

  const inputStyle = { width: '100%', border: '1px solid #E2E8F0', borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none', background: '#fff', color: '#1E293B' }
  const labelStyle = { fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4, fontWeight: 500 }

  return (
    <AdminLayout>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1E293B', margin: 0 }}>Documents</h1>
          <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 0' }}>{documents.length} document(s) publié(s)</p>
        </div>
        <button type="button" onClick={() => setShowForm(!showForm)}
          style={{ width: 32, height: 32, borderRadius: '50%', background: showForm ? '#FEF2F2' : VERT, color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 300 }}>
          {showForm ? '×' : '+'}
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: '14px', marginBottom: 14 }}>
          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>Nom du document *</label>
            <input type="text" value={nom} onChange={e => setNom(e.target.value)} placeholder="Ex : Manuel du Camp-Navs 2026" style={inputStyle} />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>Description</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex : Document officiel du camp" style={inputStyle} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Fichier *</label>
            <div style={{ border: '1px dashed #CBD5E1', borderRadius: 10, padding: '14px', textAlign: 'center' }}>
              {fichier ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 30, height: 30, background: VERT_CLAIR, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke={VERT} strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                    </div>
                    <span style={{ fontSize: 13, color: '#1E293B', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fichier.name}</span>
                  </div>
                  <button type="button" onClick={() => setFichier(null)} style={{ fontSize: 12, color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer' }}>Retirer</button>
                </div>
              ) : (
                <label style={{ cursor: 'pointer', display: 'block' }}>
                  <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#CBD5E1" strokeWidth="1.5" style={{ margin: '0 auto 6px' }}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                  <p style={{ fontSize: 13, color: '#94A3B8', margin: '0 0 3px' }}>Appuyez pour sélectionner un fichier</p>
                  <p style={{ fontSize: 11, color: '#CBD5E1', margin: 0 }}>PDF, Word, Excel — max 50 MB</p>
                  <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" style={{ display: 'none' }} onChange={e => setFichier(e.target.files[0])} />
                </label>
              )}
            </div>
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
          {erreur && <p style={{ fontSize: 12, color: '#DC2626', background: '#FEF2F2', borderRadius: 8, padding: '8px 12px', marginBottom: 10 }}>{erreur}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => setShowForm(false)} style={{ flex: 1, background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 10, padding: '10px', fontSize: 13, cursor: 'pointer' }}>Annuler</button>
            <button type="button" onClick={handleAjouter} disabled={saving || !nom || !fichier} style={{ flex: 1, background: VERT, color: '#fff', border: 'none', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving || !nom || !fichier ? 0.7 : 1 }}>{saving ? 'Upload...' : 'Publier'}</button>
          </div>
        </div>
      )}

      {loading && <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '20px 0' }}>Chargement...</p>}

      {!loading && documents.length === 0 && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: '28px', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: '#94A3B8', margin: '0 0 10px' }}>Aucun document publié.</p>
          <button type="button" onClick={() => setShowForm(true)} style={{ fontSize: 13, color: VERT, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
            + Ajouter le premier document
          </button>
        </div>
      )}

      {/* Liste — style divider */}
      <div ref={menuRef} style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        {documents.map((doc, i) => {
          const ext = getExt(doc.lien_fichier)
          const date = new Date(doc.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
          const taille = doc.taille && doc.taille !== '0.0 MB' ? doc.taille : ''
          const meta = [date, taille].filter(Boolean).join(' • ')
          return (
            <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderBottom: i < documents.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
              <ExtIcon ext={ext} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.nom}</p>
                <p style={{ fontSize: 11, color: '#94A3B8', margin: 0 }}>{meta}</p>
                {doc.description && <p style={{ fontSize: 11, color: '#64748B', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.description}</p>}
              </div>

              {/* Menu ··· */}
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
                          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                          Télécharger
                        </a>
                        <div style={{ height: 1, background: '#F1F5F9' }} />
                      </>
                    )}
                    <button type="button" onClick={() => supprimerDocument(doc)}
                      style={{ width: '100%', padding: '9px 14px', fontSize: 13, color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                      Supprimer
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </AdminLayout>
  )
}
