import { useEffect, useState } from 'react'
import BottomNav from '../../components/public/BottomNav'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const TYPE_CONFIG = {
  'pdf':  { badge: 'PDF',   bg: '#FEF2F2', color: '#991B1B', borderColor: '#FCA5A5' },
  'doc':  { badge: 'WORD',  bg: '#EFF6FF', color: '#1D4ED8', borderColor: '#93C5FD' },
  'docx': { badge: 'WORD',  bg: '#EFF6FF', color: '#1D4ED8', borderColor: '#93C5FD' },
  'xls':  { badge: 'EXCEL', bg: '#F0FDF4', color: '#166534', borderColor: '#86EFAC' },
  'xlsx': { badge: 'EXCEL', bg: '#F0FDF4', color: '#166534', borderColor: '#86EFAC' },
  'ppt':  { badge: 'PPT',   bg: '#FFFBEB', color: '#92400E', borderColor: '#FCD34D' },
  'pptx': { badge: 'PPT',   bg: '#FFFBEB', color: '#92400E', borderColor: '#FCD34D' },
}

function getExt(url) {
  if (!url) return 'pdf'
  return url.split('.').pop().split('?')[0].toLowerCase()
}

function getTypeConfig(url) {
  const ext = getExt(url)
  return TYPE_CONFIG[ext] || { badge: 'DOC', bg: '#F1F5F9', color: '#475569', borderColor: '#CBD5E1' }
}

function formatDate(str) {
  return new Date(str).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function FileIcon({ url, size = 18 }) {
  const tc = getTypeConfig(url)
  return (
    <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke={tc.color} strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
    </svg>
  )
}

function DownloadBtn({ url, label, large = false }) {
  const [loading, setLoading] = useState(false)
  function handleDownload() {
    if (!url) return
    setLoading(true)
    const a = document.createElement('a')
    a.href = url; a.download = label || 'document'; a.target = '_blank'; a.click()
    setTimeout(() => setLoading(false), 800)
  }
  if (large) {
    return (
      <button onClick={handleDownload} disabled={loading}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', color: '#054035', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
        {loading ? '...' : 'Télécharger'}
      </button>
    )
  }
  return (
    <button onClick={handleDownload} disabled={loading}
      style={{ width: 32, height: 32, borderRadius: '50%', background: '#F3F4F6', border: '0.5px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, opacity: loading ? 0.7 : 1 }}>
      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#6B7280" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
    </button>
  )
}

function DocLigne({ doc }) {
  const tc = getTypeConfig(doc.lien_fichier)
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #F3F4F6', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: tc.bg, border: `0.5px solid ${tc.borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <FileIcon url={doc.lien_fichier} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 500, color: '#111827', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.nom}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 7px', borderRadius: 20, background: tc.bg, color: tc.color, border: `0.5px solid ${tc.borderColor}` }}>{tc.badge}</span>
          <span style={{ fontSize: 10, color: '#9CA3AF' }}>{doc.taille ? `${doc.taille} · ` : ''}{formatDate(doc.created_at)}</span>
        </div>
        {doc.description && <p style={{ fontSize: 10, color: '#6B7280', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.description}</p>}
      </div>
      <DownloadBtn url={doc.lien_fichier} label={doc.nom} />
    </div>
  )
}

export default function DocumentsPage() {
  const navigate = useNavigate()
  const [dossiers,  setDossiers]  = useState([])
  const [documents, setDocuments] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [dossierOuvert, setDossierOuvert] = useState(null)

  useEffect(() => {
    async function fetchData() {
      const [{ data: d }, { data: docs }] = await Promise.all([
        supabase.from('dossiers_documents').select('*').order('ordre'),
        supabase.from('documents').select('*').eq('est_public', true).order('ordre', { ascending: true }),
      ])
      setDossiers(d || [])
      setDocuments(docs || [])
      // Ouvrir le premier dossier par défaut
      if (d && d.length > 0) setDossierOuvert(d[0].id)
      setLoading(false)
    }
    fetchData()
  }, [])

  // Premier document public (mis en avant)
  const featured = documents[0]
  const autresDocuments = documents.slice(1)

  // Dossiers qui ont au moins un doc public
  const dossiersAvecDocs = dossiers.filter(d =>
    documents.some(doc => doc.dossier_id === d.id)
  )

  const docsSansDossier = autresDocuments.filter(d => !d.dossier_id)

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', maxWidth: 480, margin: '0 auto' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {/* Header */}
      <div style={{ background: '#054035', padding: '44px 16px 20px' }}>
        <button onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.6)', fontSize: 11, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 12 }}>
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          Retour
        </button>
        <p style={{ fontSize: 20, fontWeight: 500, color: '#fff', margin: '0 0 3px' }}>Documents du camp</p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: 0 }}>Ressources officielles · Camp-Navs 2026</p>
      </div>

      <div style={{ padding: '16px 14px 80px' }}>

        {loading && <p style={{ textAlign: 'center', fontSize: 13, color: '#9CA3AF', padding: '30px 0' }}>Chargement...</p>}

        {!loading && documents.length === 0 && (
          <div style={{ background: '#fff', borderRadius: 16, border: '0.5px solid #F3F4F6', padding: 28, textAlign: 'center', marginTop: 8 }}>
            <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="#D1D5DB" style={{ display: 'block', margin: '0 auto 10px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z"/>
            </svg>
            <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 4px' }}>Aucun document disponible.</p>
            <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>Les documents seront publiés prochainement.</p>
          </div>
        )}

        {/* Document mis en avant */}
        {featured && (
          <div onClick={() => { if (!featured.lien_fichier) return; const a = document.createElement('a'); a.href = featured.lien_fichier; a.download = featured.nom; a.target = '_blank'; a.click() }}
            style={{ background: 'linear-gradient(140deg,#054035,#0D7A5A)', borderRadius: 20, padding: '18px 16px', marginBottom: 16, position: 'relative', overflow: 'hidden', cursor: 'pointer' }}>
            <div style={{ position: 'absolute', width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', top: -30, right: -20 }} />
            <div style={{ position: 'absolute', width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', bottom: -10, left: 100 }} />
            <span style={{ fontSize: 9, fontWeight: 600, background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: 20, padding: '2px 10px', display: 'inline-block', marginBottom: 10, letterSpacing: '0.05em' }}>
              EN AVANT
            </span>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: '0 0 4px', lineHeight: 1.3 }}>{featured.nom}</p>
                {featured.description && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', margin: '0 0 4px', lineHeight: 1.4 }}>{featured.description}</p>}
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', margin: 0 }}>{featured.taille ? `${featured.taille} · ` : ''}{formatDate(featured.created_at)}</p>
              </div>
            </div>
            <DownloadBtn url={featured.lien_fichier} label={featured.nom} large />
          </div>
        )}

        {/* Dossiers avec documents */}
        {dossiersAvecDocs.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 10 }}>
            {dossiersAvecDocs.map(dossier => {
              const docsInDossier = autresDocuments.filter(d => d.dossier_id === dossier.id)
              if (docsInDossier.length === 0) return null
              const ouvert = dossierOuvert === dossier.id
              return (
                <div key={dossier.id} style={{ background: '#fff', borderRadius: 14, border: `1px solid ${ouvert ? '#CBD5E1' : '#F3F4F6'}`, overflow: 'hidden' }}>
                  {/* En-tête dossier */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', cursor: 'pointer' }}
                    onClick={() => setDossierOuvert(prev => prev === dossier.id ? null : dossier.id)}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: ouvert ? '#054035' : '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .2s' }}>
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={ouvert ? '#fff' : '#166534'} strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
                      </svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0 }}>{dossier.nom}</p>
                      <p style={{ fontSize: 11, color: '#9CA3AF', margin: '1px 0 0' }}>{docsInDossier.length} document(s)</p>
                    </div>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#9CA3AF" strokeWidth="2"
                      style={{ transition: 'transform .25s', transform: ouvert ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </div>
                  {/* Documents du dossier */}
                  {ouvert && (
                    <div style={{ borderTop: '1px solid #F3F4F6', padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {docsInDossier.map(doc => <DocLigne key={doc.id} doc={doc} />)}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Documents sans dossier */}
        {docsSansDossier.length > 0 && (
          <div>
            {dossiersAvecDocs.length > 0 && (
              <p style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '4px 0 8px' }}>
                Autres documents
              </p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {docsSansDossier.map(doc => <DocLigne key={doc.id} doc={doc} />)}
            </div>
          </div>
        )}

      </div>
      <BottomNav />
    </div>
  )
}
