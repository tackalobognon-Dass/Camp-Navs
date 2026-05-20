import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

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

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto">

      {/* Header */}
      <div className="bg-emerald-700 text-white px-5 pt-10 pb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-emerald-200 text-sm mb-4">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          Retour
        </button>
        <h1 className="text-xl font-medium">Documents du camp</h1>
        <p className="text-sm text-emerald-200 mt-1">Téléchargez les ressources officielles</p>
      </div>

      {/* Liste */}
      <div className="px-4 py-5 pb-10">
        {loading && <p className="text-sm text-gray-400 text-center py-8">Chargement...</p>}

        {!loading && documents.length === 0 && (
          <div className="bg-white border border-gray-100 rounded-xl p-6 text-center">
            <p className="text-sm text-gray-400">Aucun document disponible pour le moment.</p>
            <p className="text-xs text-gray-300 mt-1">Les documents seront publiés prochainement.</p>
          </div>
        )}

        <div className="space-y-3">
          {documents.map((doc) => (
            <div key={doc.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{doc.nom}</p>
                {doc.description && <p className="text-xs text-gray-400 mt-0.5">{doc.description}</p>}
                {doc.taille && <p className="text-xs text-gray-300 mt-0.5">{doc.taille}</p>}
              </div>
              {doc.lien_fichier && (
                <a href={doc.lien_fichier} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs bg-emerald-700 text-white px-3 py-2 rounded-lg flex-shrink-0">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Télécharger
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
