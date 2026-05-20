import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const TYPE_CONFIG = {
  'pdf':  { badge: 'PDF',  bg: '#FCEBEB', color: '#A32D2D', icon: '📄' },
  'doc':  { badge: 'WORD', bg: '#E6F1FB', color: '#185FA5', icon: '📝' },
  'docx': { badge: 'WORD', bg: '#E6F1FB', color: '#185FA5', icon: '📝' },
  'xls':  { badge: 'EXCEL', bg: '#EAF3DE', color: '#3B6D11', icon: '📊' },
  'xlsx': { badge: 'EXCEL', bg: '#EAF3DE', color: '#3B6D11', icon: '📊' },
  'ppt':  { badge: 'PPT',  bg: '#FAEEDA', color: '#854F0B', icon: '📊' },
  'pptx': { badge: 'PPT',  bg: '#FAEEDA', color: '#854F0B', icon: '📊' },
}

function getExt(url) {
  if (!url) return 'pdf'
  const parts = url.split('.')
  return parts[parts.length - 1].toLowerCase()
}

function getTypeConfig(url) {
  const ext = getExt(url)
  return TYPE_CONFIG[ext] || TYPE_CONFIG['pdf']
}

function formatDate(str) {
  return new Date(str).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function DownloadBtn({ url, label }) {
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    if (!url) return
    setLoading(true)
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = label || 'document'
      a.click()
    } catch {
      window.open(url, '_blank')
    }
    setLoading(false)
  }

  return (
    <button onClick={handleDownload} disabled={loading}
      style={{ background: '#085041', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 10, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, opacity: loading ? 0.7 : 1 }}>
      {loading ? '...' : (
        <>
          <svg style={{ width: 12, height: 12 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Télécharger
        </>
      )}
    </button>
  )
}

export default function DocumentsPage() {
  const navigate = useNavigate()
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDocuments() {
      const { data } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false })
      setDocuments(data || [])
      setLoading(false)
    }
    fetchDocuments()
  }, [])

  const featured = documents[0]
  const secondary = documents.slice(1, 3)
  const rest = documents.slice(3)

  return (
    <div style={{ minHeight: '100vh', background: '#f8f8f6', maxWidth: 480, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(160deg,#054035,#085041)', padding: '44px 16px 16px', color: '#fff' }}>
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#9FE1CB', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 10 }}>
          ← Retour
        </button>
        <div style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 2 }}>Documents du camp</div>
        <div style={{ fontSize: 10, color: '#9FE1CB' }}>Téléchargez les ressources officielles</div>
      </div>

      <div style={{ padding: '12px 14px 80px' }}>

        {loading && <p style={{ textAlign: 'center', fontSize: 13, color: '#888', padding: '30px 0' }}>Chargement...</p>}

        {!loading && documents.length === 0 && (
          <div style={{ background: '#fff', borderRadius: 16, border: '0.5px solid #e5e5e0', padding: 24, textAlign: 'center', marginTop: 8 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📂</div>
            <p style={{ fontSize: 13, color: '#888' }}>Aucun document disponible pour le moment.</p>
            <p style={{ fontSize: 11, color: '#bbb', marginTop: 4 }}>Les documents seront publiés prochainement.</p>
          </div>
        )}

        {/* Document mis en avant */}
        {featured && (
          <div style={{ background: 'linear-gradient(140deg,#054035,#1D9E75)', borderRadius: 14, padding: '12px 14px', marginBottom: 10, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', top: -20, right: -20 }} />
            <span style={{ fontSize: 8, fontWeight: 600, background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: 20, padding: '2px 8px', display: 'inline-block', marginBottom: 6 }}>NOUVEAU</span>
            <div style={{ fontSize: 24, marginBottom: 6 }}>📖</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 3 }}>{featured.nom}</div>
            {featured.description && <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', marginBottom: 3 }}>{featured.description}</div>}
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', marginBottom: 10 }}>
              {featured.taille ? `${featured.taille} · ` : ''}{formatDate(featured.created_at)}
            </div>
            <button onClick={async () => {
              if (!featured.lien_fichier) return
              try {
                const res = await fetch(featured.lien_fichier)
                const blob = await res.blob()
                const a = document.createElement('a')
                a.href = URL.createObjectURL(blob)
                a.download = featured.nom
                a.click()
              } catch { window.open(featured.lien_fichier, '_blank') }
            }} style={{ background: '#fff', color: '#085041', border: 'none', borderRadius: 10, padding: '7px 14px', fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg style={{ width: 13, height: 13 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Télécharger
            </button>
          </div>
        )}

        {/* Grille 2 colonnes */}
        {secondary.length > 0 && (
          <>
            <div style={{ fontSize: 9, fontWeight: 500, color: '#888780', letterSpacing: '0.06em', marginBottom: 7 }}>AUTRES DOCUMENTS</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
              {secondary.map(doc => {
                const tc = getTypeConfig(doc.lien_fichier)
                return (
                  <div key={doc.id} style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #e5e5e0', padding: '10px' }}>
                    <div style={{ fontSize: 20, marginBottom: 6 }}>{tc.icon}</div>
                    <div style={{ fontSize: 10, fontWeight: 500, color: '#1a1a1a', marginBottom: 3, lineHeight: 1.3 }}>{doc.nom}</div>
                    <div style={{ fontSize: 8, color: '#888', marginBottom: 8 }}>
                      {doc.taille || ''} {doc.taille ? '·' : ''} {formatDate(doc.created_at)}
                    </div>
                    <DownloadBtn url={doc.lien_fichier} label={doc.nom} />
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Liste tous les documents */}
        {rest.length > 0 && (
          <>
            <div style={{ fontSize: 9, fontWeight: 500, color: '#888780', letterSpacing: '0.06em', marginBottom: 7 }}>TOUS LES DOCUMENTS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {rest.map(doc => {
                const tc = getTypeConfig(doc.lien_fichier)
                return (
                  <div key={doc.id} style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #e5e5e0', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: tc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>
                      {tc.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 500, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>{doc.nom}</span>
                        <span style={{ fontSize: 7, fontWeight: 600, padding: '1px 5px', borderRadius: 20, background: tc.bg, color: tc.color, flexShrink: 0 }}>{tc.badge}</span>
                      </div>
                      <div style={{ fontSize: 9, color: '#888', marginTop: 2 }}>
                        {doc.taille ? `${doc.taille} · ` : ''}{formatDate(doc.created_at)}
                      </div>
                    </div>
                    <div style={{ flexShrink: 0 }}>
                      <DownloadBtn url={doc.lien_fichier} label={doc.nom} />
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Bottom nav */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: 480, margin: '0 auto', background: '#fff', borderTop: '0.5px solid #e5e5e0', display: 'flex', zIndex: 30 }}>
        {[
          { label: 'Accueil', path: '/', icon: <svg style={{ width: 20, height: 20 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" /></svg> },
          { label: 'Planning', path: '/programme', icon: <svg style={{ width: 20, height: 20 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
          { label: 'Chants', path: '/chants', icon: <svg style={{ width: 20, height: 20 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg> },
          { label: "S'inscrire", path: '/inscription', icon: <svg style={{ width: 20, height: 20 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
        ].map(item => (
          <button key={item.label} onClick={() => navigate(item.path)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0 10px', color: '#888780', background: 'none', border: 'none', cursor: 'pointer' }}>
            {item.icon}
            <span style={{ fontSize: 10, marginTop: 2 }}>{item.label}</span>
          </button>
        ))}
        <button onClick={() => navigate('/')}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0 10px', color: '#888780', background: 'none', border: 'none', cursor: 'pointer' }}>
          <svg style={{ width: 20, height: 20 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
          <span style={{ fontSize: 10, marginTop: 2 }}>Plus</span>
        </button>
      </nav>
    </div>
  )
}
