import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function ProgrammePage() {
  const [programme, setProgramme] = useState([])
  const [loading, setLoading] = useState(true)
  const [jourActif, setJourActif] = useState('')

  const jours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

  useEffect(() => {
    async function fetchProgramme() {
      const { data } = await supabase
        .from('programme_camp')
        .select('*')
        .order('heure_debut', { ascending: true })
      setProgramme(data || [])
      if (data && data.length > 0) {
        setJourActif(data[0].jour)
      } else {
        setJourActif('Lundi')
      }
      setLoading(false)
    }
    fetchProgramme()
  }, [])

  const joursDisponibles = [...new Set(programme.map(p => p.jour))]
  const affichage = joursDisponibles.length > 0 ? joursDisponibles : jours
  const activitesDuJour = programme.filter(p => p.jour === jourActif)

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
        <h1 className="text-xl font-medium">Programme du camp</h1>
        <p className="text-sm text-emerald-100 mt-1">23 – 29 août 2026 · La Sablière, Bingerville</p>
      </div>

      {/* Sélecteur de jour */}
      <div className="flex overflow-x-auto gap-2 px-5 py-4 bg-white border-b border-gray-100">
        {affichage.map((jour) => (
          <button
            key={jour}
            onClick={() => setJourActif(jour)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all ${
              jourActif === jour
                ? 'bg-emerald-700 text-white'
                : 'bg-gray-100 text-gray-500'
            }`}
          >
            {jour}
          </button>
        ))}
      </div>

      {/* Activités */}
      <div className="px-5 py-5 pb-24">
        {loading && (
          <p className="text-sm text-gray-400 text-center py-8">Chargement...</p>
        )}

        {!loading && activitesDuJour.length === 0 && (
          <div className="bg-white border border-gray-100 rounded-xl p-6 text-center">
            <p className="text-sm text-gray-400">Programme non disponible pour ce jour.</p>
            <p className="text-xs text-gray-300 mt-1">Revenez bientôt.</p>
          </div>
        )}

        {activitesDuJour.map((item, index) => (
          <div key={item.id} className="flex gap-4 mb-4">
            <div className="flex flex-col items-center">
              <div className="w-2 h-2 rounded-full bg-emerald-700 mt-1.5 flex-shrink-0"></div>
              {index < activitesDuJour.length - 1 && (
                <div className="w-0.5 bg-gray-200 flex-1 mt-1"></div>
              )}
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-4 flex-1 mb-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-emerald-700 font-medium">
                  {item.heure_debut}{item.heure_fin ? ` – ${item.heure_fin}` : ''}
                </span>
                {item.lieu && (
                  <span className="text-xs text-gray-400">{item.lieu}</span>
                )}
              </div>
              <p className="text-sm font-medium text-gray-800">{item.activite}</p>
              {item.responsable && (
                <p className="text-xs text-gray-400 mt-1">{item.responsable}</p>
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
        <a href="/programme" className="flex-1 flex flex-col items-center py-2 text-emerald-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          <span className="text-xs mt-0.5 font-medium">Planning</span>
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
