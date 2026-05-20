import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/admin/AdminLayout'

export default function DocumentsAdminPage() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [nom, setNom] = useState('')
  const [description, setDescription] = useState('')
  const [fichier, setFichier] = useState(null)
  const [saving, setSaving] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => { fetchDocuments() }, [])

  async function fetchDocuments() {
    const { data } = await supabase.from('documents').select('*').order('created_at', { ascending: false })
    setDocuments(data || [])
    setLoading(false)
  }

  async function handleAjouter() {
    if (!nom || !fichier) return
    setSaving(true)
    setProgress(10)
    const ext = fichier.name.split('.').pop()
    const nomFichier = `${Date.now()}_${nom.replace(/\s+/g, '_')}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('documents-camp')
      .upload(nomFichier, fichier, { cacheControl: '3600', upsert: false })
    setProgress(70)
    if (uploadError) { setSaving(false); return }
    const { data: urlData } = supabase.storage.from('documents-camp').getPublicUrl(nomFichier)
    const tailleMo = (fichier.size / 1024 / 1024).toFixed(1)
    await supabase.from('documents').insert([{
      nom,
      description,
      lien_fichier: urlData.publicUrl,
      taille: `${tailleMo} MB`,
    }])
    setProgress(100)
    setNom('')
    setDescription('')
    setFichier(null)
    setProgress(0)
    setSaving(false)
    setShowForm(false)
    fetchDocuments()
  }

  async function supprimerDocument(doc) {
    if (!window.confirm('Supprimer ce document ?')) return
    if (doc.lien_fichier) {
      const nomFichier = doc.lien_fichier.split('/').pop()
      await supabase.storage.from('documents-camp').remove([nomFichier])
    }
    await supabase.from('documents').delete().eq('id', doc.id)
    fetchDocuments()
  }

  const getExt = (url) => {
    if (!url) return 'PDF'
    return url.split('.').pop().toUpperCase()
  }

  const extColor = { PDF: '#A32D2D', DOC: '#185FA5', DOCX: '#185FA5', XLS: '#3B6D11', XLSX: '#3B6D11', PPT: '#854F0B', PPTX: '#854F0B' }
  const extBg = { PDF: '#FCEBEB', DOC: '#E6F1FB', DOCX: '#E6F1FB', XLS: '#EAF3DE', XLSX: '#EAF3DE', PPT: '#FAEEDA', PPTX: '#FAEEDA' }

  return (
    <AdminLayout>
      <div className="mb-5 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-medium text-gray-800">Documents</h1>
          <p className="text-sm text-gray-400 mt-0.5">{documents.length} document(s) publié(s)</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-xl flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showForm ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"} />
          </svg>
          {showForm ? 'Fermer' : 'Ajouter un document'}
        </button>
      </div>

      {/* Formulaire caché */}
      {showForm && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-5">
          <h2 className="text-sm font-medium text-gray-700 mb-4">Nouveau document</h2>

          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-1">Nom du document *</label>
            <input type="text" value={nom} onChange={e => setNom(e.target.value)}
              placeholder="Ex : Manuel du Camp-Navs 2026"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400" />
          </div>

          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-1">Description</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Ex : Document officiel du camp"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400" />
          </div>

          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-1">Fichier *</label>
            <div className="border border-dashed border-gray-300 rounded-xl p-4 text-center">
              {fichier ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-700 truncate max-w-40">{fichier.name}</span>
                  </div>
                  <button onClick={() => setFichier(null)} className="text-red-400 text-xs">Retirer</button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <p className="text-sm text-gray-400">Appuyez pour sélectionner un fichier</p>
                  <p className="text-xs text-gray-300 mt-1">PDF, Word, Excel — max 50 MB</p>
                  <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" className="hidden"
                    onChange={e => setFichier(e.target.files[0])} />
                </label>
              )}
            </div>
          </div>

          {/* Barre de progression */}
          {saving && (
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Upload en cours...</span>
                <span>{progress}%</span>
              </div>
              <div className="bg-gray-100 rounded-full h-1.5">
                <div className="bg-emerald-700 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setShowForm(false)}
              className="flex-1 bg-gray-100 text-gray-600 text-sm font-medium py-3 rounded-xl">
              Annuler
            </button>
            <button onClick={handleAjouter} disabled={saving || !nom || !fichier}
              className="flex-1 bg-emerald-700 text-white text-sm font-medium py-3 rounded-xl disabled:opacity-60">
              {saving ? 'Upload...' : 'Publier'}
            </button>
          </div>
        </div>
      )}

      {/* Liste documents */}
      {loading && <p className="text-sm text-gray-400 text-center py-8">Chargement...</p>}

      {!loading && documents.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-6 text-center">
          <p className="text-sm text-gray-400">Aucun document publié.</p>
          <button onClick={() => setShowForm(true)} className="mt-3 text-sm text-emerald-700 font-medium">
            + Ajouter le premier document
          </button>
        </div>
      )}

      <div className="space-y-2">
        {documents.map(doc => {
          const ext = getExt(doc.lien_fichier)
          const bg = extBg[ext] || '#F1EFE8'
          const color = extColor[ext] || '#5F5E5A'
          return (
            <div key={doc.id} className="bg-white border border-gray-100 rounded-xl p-3 flex items-center gap-3">
              <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg style={{ width: 20, height: 20, color }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-gray-800 truncate">{doc.nom}</p>
                  <span style={{ fontSize: 8, fontWeight: 600, padding: '1px 5px', borderRadius: 20, background: bg, color }}>{ext}</span>
                </div>
                {doc.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{doc.description}</p>}
                <p className="text-xs text-gray-300 mt-0.5">
                  {doc.taille ? `${doc.taille} · ` : ''}
                  {new Date(doc.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                {doc.lien_fichier && (
                  <a href={doc.lien_fichier} target="_blank" rel="noreferrer"
                    style={{ width: 32, height: 32, borderRadius: 8, background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg style={{ width: 14, height: 14, color: '#085041' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </a>
                )}
                <button onClick={() => supprimerDocument(doc)}
                  style={{ width: 32, height: 32, borderRadius: 8, background: '#FCEBEB', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg style={{ width: 14, height: 14, color: '#A32D2D' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </AdminLayout>
  )
}
