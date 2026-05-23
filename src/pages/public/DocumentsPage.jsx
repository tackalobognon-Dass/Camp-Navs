import { useEffect, useState } from 'react'
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
  'mp3':  { badge: 'AUDIO', bg: '#F5F3FF', color: '#5B21B6', borderColor: '#C4B5FD' },
  'mp4':  { badge: 'VIDEO', bg: '#F5F3FF', color: '#5B21B6', borderColor: '#C4B5FD' },
}

const CATEGORIES = ['Tous', 'Études', 'Planning', 'Chants', 'Formulaires', 'Autres']

function getExt(url) {
  if (!url) return 'pdf'
  return url.split('.').pop().toLowerCase()
}

function getTypeConfig(url) {
  const ext = getExt(url)
  return TYPE_CONFIG[ext] || TYPE_CONFIG['pdf']
}

function formatDate(str) {
  return new Date(str).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Icône fichier selon le type
function FileIcon({ url, size = 20 }) {
  const ext = getExt(url)
  const tc = getTypeConfig(url)

  const icons = {
    pdf: (
      <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke={tc.color} strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    doc: (
      <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke={tc.color} strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    xls: (
      <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke={tc.color} strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18M10 3v18M6 3h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2z" />
      </svg>
    ),
    default: (
      <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke={tc.color} strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
      </svg>
    ),
  }

  if (ext === 'doc' || ext === 'docx') return icons.doc
  if (ext === 'xls' || ext === 'xlsx') return icons.xls
  if (ext === 'pdf') return icons.pdf
  return icons.default
}

// Bouton téléchargement icône circulaire
function DownloadIconBtn({ url, label, large = false }) {
  const [loading, setLoading] = useState(false)

  function handleDownload() {
    if (!url) return
    setLoading(true)
    const a = document.createElement('a')
    a.href = url
    a.download = label || 'document'
    a.target = '_blank'
    a.click()
    setTimeout(() => setLoading(false), 800)
  }

  if (large) {
    return (
      <button onClick={handleDownload} disabled={loading}
        style={{ background: '#fff', color: '#054035', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: loading ? 0.7 : 1 }}>
        {loading ? '...' : (
          <>
            <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Télécharger
          </>
        )}
      </button>
    )
  }

  return (
    <button onClick={handleDownload} disabled={loading}
      style={{ width: 32, height: 32, borderRadius: '50%', background: '#F3F4F6', border: '0.5px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, opacity: loading ? 0.7 : 1 }}>
      {loading ? (
        <div style={{ width: 10, height: 10, borderRadius: '50%', border: '1.5px solid #9CA3AF', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      ) : (
        <svg style={{ width: 14, height: 14, color: '#6B7280' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      )}
    </button>
  )
}

export default function DocumentsPage() {
  const navigate = useNavigate()
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [categorie, setCategorie] = useState('Tous')

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
  const listeDocuments = documents.slice(1).filter(doc => {
    if (categorie === 'Tous') return true
    return doc.categorie === categorie
  })

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
            <svg style={{ width: 36, height: 36, color: '#D1D5DB', margin: '0 auto 10px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" /></svg>
            <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 4px' }}>Aucun document disponible.</p>
            <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>Les documents seront publiés prochainement.</p>
          </div>
        )}

        {/* Document mis en avant */}
        {featured && (
          <div onClick={async () => {
            if (!featured.lien_fichier) return
            try {
                const a = document.createElement('a')
                a.href = featured.lien_fichier
                a.download = featured.nom
                a.target = '_blank'
                a.click()
          }}
            style={{ background: 'linear-gradient(140deg,#054035,#0D7A5A)', borderRadius: 20, padding: '18px 16px', marginBottom: 16, position: 'relative', overflow: 'hidden', cursor: 'pointer' }}>
            <div style={{ position: 'absolute', width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', top: -30, right: -20 }} />
            <div style={{ position: 'absolute', width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', bottom: -10, left: 100 }} />

            <span style={{ fontSize: 9, fontWeight: 600, background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: 20, padding: '2px 10px', display: 'inline-block', marginBottom: 10, letterSpacing: '0.05em' }}>NOUVEAU</span>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#fff', margin: '0 0 4px', lineHeight: 1.3 }}>{featured.nom}</p>
                {featured.description && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)', margin: '0 0 4px', lineHeight: 1.4 }}>{featured.description}</p>}
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', margin: 0 }}>
                  {featured.taille ? `${featured.taille} · ` : ''}{formatDate(featured.created_at)}
                </p>
              </div>
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', color: '#054035', borderRadius: 10, padding: '8px 16px', fontSize: 12, fontWeight: 600 }}>
              <svg style={{ width: 13, height: 13 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Télécharger
            </div>
          </div>
        )}

        {/* Filtres catégories */}
        {documents.length > 1 && (
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 14, scrollbarWidth: 'none', paddingBottom: 2 }}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategorie(cat)}
                style={{ flexShrink: 0, padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, cursor: 'pointer', border: `0.5px solid ${categorie === cat ? '#054035' : '#E5E7EB'}`, background: categorie === cat ? '#054035' : '#fff', color: categorie === cat ? '#fff' : '#6B7280', whiteSpace: 'nowrap' }}>
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Liste unifiée */}
        {listeDocuments.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {listeDocuments.map(doc => {
              const tc = getTypeConfig(doc.lien_fichier)
              return (
                <div key={doc.id} style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #F3F4F6', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* Icône fichier */}
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: tc.bg, border: `0.5px solid ${tc.borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FileIcon url={doc.lien_fichier} size={18} />
                  </div>

                  {/* Infos */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: '#111827', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.nom}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 7px', borderRadius: 20, background: tc.bg, color: tc.color, border: `0.5px solid ${tc.borderColor}` }}>
                        {tc.badge}
                      </span>
                      <span style={{ fontSize: 10, color: '#9CA3AF' }}>
                        {doc.taille ? `${doc.taille} · ` : ''}{formatDate(doc.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Bouton téléchargement icône */}
                  <DownloadIconBtn url={doc.lien_fichier} label={doc.nom} />
                </div>
              )
            })}
          </div>
        )}

        {!loading && listeDocuments.length === 0 && documents.length > 1 && (
          <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #F3F4F6', padding: '20px', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>Aucun document dans cette catégorie.</p>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: 480, margin: '0 auto', background: '#fff', borderTop: '0.5px solid #E5E7EB', display: 'flex', zIndex: 30 }}>
        {[
          { label: 'Accueil', path: '/', icon: <svg style={{ width: 20, height: 20 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" /></svg> },
          { label: 'Planning', path: '/programme', icon: <svg style={{ width: 20, height: 20 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
          { label: 'Chants', path: '/chants', icon: <svg style={{ width: 20, height: 20 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg> },
          { label: "S'inscrire", path: '/inscription', icon: <svg style={{ width: 20, height: 20 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
          { label: 'Plus', path: null, icon: <svg style={{ width: 20, height: 20 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg> },
        ].map(item => (
          <button key={item.label} onClick={() => item.path && navigate(item.path)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0 10px', color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer' }}>
            {item.icon}
            <span style={{ fontSize: 10, marginTop: 2 }}>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
