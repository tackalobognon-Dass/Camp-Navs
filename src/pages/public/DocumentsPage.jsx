import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function DocumentsPage() {
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
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-emerald-700 text-white px-5 pt-10 pb-6">
        <a href="/" className="flex items-center gap-2 text-emerald-200 text-sm mb-4">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          Retour
        </a>
        <h1 className="text-xl font-medium">Documents du camp</h1>
        <p className="text-sm text-emerald-100 mt-1">Téléchargez les ressources officielles</p>
      </div>

      {/* Liste */}
      <div className="px-5 py-6 pb-24">
        {loading && (
          <p className="text-sm text-gray-400 text-center py-8">Chargement...</p>
        )}

        {!loading && documents.length === 0 && (
          <div className="bg-white border border-gray-100 rounded-xl p-6 text-center">
            <p className="text-sm text-gray-400">Aucun document disponible pour le moment.</p>
            <p className="text-xs text-gray-300 mt-1">Les documents seront publiés prochainement.</p>
          </div>
        )}

        {documents.map((doc) => (
          <div key={doc.id} className="bg-white border border-gray-100 rounded-xl p-4 mb-3">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{doc.nom}</p>
                {doc.description && (
                  <p className="text-xs text-gray-400 mt-0.5">{doc.description}</p>
                )}
                {doc.taille && (
                  <p className="text-xs text-gray-300 mt-0.5">{doc.taille}</p>
                )}
              </div>
              {doc.lien_fichier && (
                <a
                  href={doc.lien_fichier}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs bg-emerald-700 text-white px-3 py-2 rounded-lg flex-shrink-0"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Télécharger
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex">
        <a href="/" className="flex-1 flex flex-col items-center py-2 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" /></svg>
          <span className="text-xs mt-0.5">Accueil</span>
        </a>
        <a href="/programme" className="flex-1 flex flex-col items-center py-2 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          <span className="text-xs mt-0.5">Planning</span>
        </a>
        <a href="/chants" className="flex-1 flex flex-col items-center py-2 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
          <span className="text-xs mt-0.5">Chants</span>
        </a>
        <a href="/documents" className="flex-1 flex flex-col items-center py-2 text-emerald-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          <span className="text-xs mt-0.5 font-medium">Docs</span>
        </a>
        <a href="/inscription" className="flex-1 flex flex-col items-center py-2 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          <span className="text-xs mt-0.5">S'inscrire</span>
        </a>
      </nav>
    </div>
  )
}
