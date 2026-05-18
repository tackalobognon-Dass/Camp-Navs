import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function ChantsPage() {
  const [chants, setChants] = useState([])
  const [loading, setLoading] = useState(true)
  const [recherche, setRecherche] = useState('')

  useEffect(() => {
    async function fetchChants() {
      const { data } = await supabase
        .from('chants')
        .select('*')
        .order('ordre', { ascending: true })
      setChants(data || [])
      setLoading(false)
    }
    fetchChants()
  }, [])

  const filtres = chants.filter(c =>
    c.titre.toLowerCase().includes(recherche.toLowerCase()) ||
    (c.artiste && c.artiste.toLowerCase().includes(recherche.toLowerCase()))
  )

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
        <h1 className="text-xl font-medium">Répertoire de chants</h1>
        <p className="text-sm text-emerald-100 mt-1">Camp-Navs 2026</p>
      </div>

      {/* Recherche */}
      <div className="px-5 py-4">
        <input
          type="text"
          value={recherche}
          onChange={e => setRecherche(e.target.value)}
          placeholder="Rechercher un chant..."
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 bg-white outline-none focus:border-emerald-400"
        />
      </div>

      {/* Liste */}
      <div className="px-5 pb-24">
        {loading && (
          <p className="text-sm text-gray-400 text-center py-8">Chargement...</p>
        )}

        {!loading && filtres.length === 0 && (
          <div className="bg-white border border-gray-100 rounded-xl p-6 text-center">
            <p className="text-sm text-gray-400">Aucun chant disponible pour le moment.</p>
          </div>
        )}

        {filtres.map((chant, index) => (
          <div key={chant.id} className="bg-white border border-gray-100 rounded-xl p-4 mb-3">
            <div className="flex items-center gap-4">
              <span className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium flex items-center justify-center flex-shrink-0">
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{chant.titre}</p>
                {chant.artiste && (
                  <p className="text-xs text-gray-400 mt-0.5">{chant.artiste}</p>
                )}
              </div>
              <div className="flex gap-2">
                {chant.lien_paroles && (
                  <a
                    href={chant.lien_paroles}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs border border-gray-200 text-gray-500 px-3 py-1.5 rounded-lg"
                  >
                    Paroles
                  </a>
                )}
                {chant.lien_audio && (
                  <a
                    href={chant.lien_audio}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs bg-emerald-700 text-white px-3 py-1.5 rounded-lg"
                  >
                    Ecouter
                  </a>
                )}
              </div>
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
        <a href="/chants" className="flex-1 flex flex-col items-center py-2 text-emerald-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
          <span className="text-xs mt-0.5 font-medium">Chants</span>
        </a>
        <a href="/documents" className="flex-1 flex flex-col items-center py-2 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          <span className="text-xs mt-0.5">Docs</span>
        </a>
        <a href="/inscription" className="flex-1 flex flex-col items-center py-2 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          <span className="text-xs mt-0.5">S'inscrire</span>
        </a>
      </nav>
    </div>
  )
}
