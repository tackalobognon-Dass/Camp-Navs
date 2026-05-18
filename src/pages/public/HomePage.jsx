import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function HomePage() {
  const [annonces, setAnnonces] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAnnonces() {
      const { data } = await supabase
        .from('annonces')
        .select('*')
        .eq('publie', true)
        .order('created_at', { ascending: false })
      setAnnonces(data || [])
      setLoading(false)
    }
    fetchAnnonces()
  }, [])

  const tagColors = {
    Nouveau: 'bg-emerald-50 text-emerald-800',
    Important: 'bg-amber-50 text-amber-800',
    Document: 'bg-blue-50 text-blue-800',
    Info: 'bg-gray-100 text-gray-700',
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <div className="bg-emerald-700 text-white px-5 pt-10 pb-8">
        <p className="text-xs tracking-widest text-emerald-200 uppercase mb-2">
          Mission Évangélique des Navigateurs — CI
        </p>
        <h1 className="text-2xl font-medium leading-snug mb-1">
          Camp-Navs 2026
        </h1>
        <p className="text-sm text-emerald-100 leading-relaxed">
          Les familles et réseaux relationnels pour une expansion naturelle de l'Évangile et du Royaume de Dieu
        </p>

        {/* Infos clés */}
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="flex items-center gap-1 bg-emerald-600 rounded-full px-3 py-1 text-xs">
            23 – 29 août 2026
          </span>
          <span className="flex items-center gap-1 bg-emerald-600 rounded-full px-3 py-1 text-xs">
            La Sablière, Bingerville
          </span>
          <span className="flex items-center gap-1 bg-emerald-600 rounded-full px-3 py-1 text-xs">
            150 participants
          </span>
        </div>

        {/* Boutons CTA */}
        <div className="flex gap-3 mt-5">
          <a
            href="/inscription"
            className="flex-1 text-center bg-white text-emerald-700 font-medium text-sm py-2 rounded-lg"
          >
            S'inscrire
          </a>
          <a
            href="/programme"
            className="flex-1 text-center border border-white text-white text-sm py-2 rounded-lg"
          >
            Programme
          </a>
        </div>
      </div>

      {/* Frais de participation */}
      <div className="px-5 mt-5">
        <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
          Frais de participation
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">Jeunes & Adultes</p>
            <p className="text-lg font-medium text-emerald-700">30 000 <span className="text-sm font-normal text-gray-400">FCFA</span></p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-xs text-gray-400 mb-1">Enfants & Ados</p>
            <p className="text-lg font-medium text-emerald-700">25 000 <span className="text-sm font-normal text-gray-400">FCFA</span></p>
          </div>
        </div>
      </div>

      {/* Actualités */}
      <div className="px-5 mt-6 pb-24">
        <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
          Actualités du camp
        </h2>

        {loading && (
          <p className="text-sm text-gray-400 text-center py-8">Chargement...</p>
        )}

        {!loading && annonces.length === 0 && (
          <div className="bg-white border border-gray-100 rounded-xl p-6 text-center">
            <p className="text-sm text-gray-400">Aucune actualité pour le moment.</p>
            <p className="text-xs text-gray-300 mt-1">Revenez bientôt !</p>
          </div>
        )}

        {annonces.map((annonce) => (
          <div
            key={annonce.id}
            className="bg-white border border-gray-100 rounded-xl p-4 mb-3"
          >
            {annonce.tag && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full inline-block mb-2 ${tagColors[annonce.tag] || tagColors['Info']}`}>
                {annonce.tag}
              </span>
            )}
            <h3 className="text-sm font-medium text-gray-800 mb-1">{annonce.titre}</h3>
            {annonce.contenu && (
              <p className="text-xs text-gray-500 leading-relaxed">{annonce.contenu}</p>
            )}
            <p className="text-xs text-gray-300 mt-2">
              {new Date(annonce.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'long', year: 'numeric'
              })}
            </p>
          </div>
        ))}
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex">
        <a href="/" className="flex-1 flex flex-col items-center py-2 text-emerald-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" /></svg>
          <span className="text-xs mt-0.5 font-medium">Accueil</span>
        </a>
        <a href="/programme" className="flex-1 flex flex-col items-center py-2 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          <span className="text-xs mt-0.5">Planning</span>
        </a>
        <a href="/chants" className="flex-1 flex flex-col items-center py-2 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
          <span className="text-xs mt-0.5">Chants</span>
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
