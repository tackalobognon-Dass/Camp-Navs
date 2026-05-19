import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

function Countdown() {
  const [time, setTime] = useState({ j: '00', h: '00', m: '00', s: '00' })
  useEffect(() => {
    function tick() {
      const t = new Date('2026-08-23T00:00:00') - new Date()
      if (t <= 0) return
      setTime({
        j: String(Math.floor(t / 86400000)).padStart(2, '0'),
        h: String(Math.floor((t % 86400000) / 3600000)).padStart(2, '0'),
        m: String(Math.floor((t % 3600000) / 60000)).padStart(2, '0'),
        s: String(Math.floor((t % 60000) / 1000)).padStart(2, '0'),
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <div className="grid grid-cols-4 gap-1.5 mt-3">
      {[{ v: time.j, l: 'JOURS' }, { v: time.h, l: 'HEURES' }, { v: time.m, l: 'MIN' }, { v: time.s, l: 'SEC' }].map(({ v, l }, i) => (
        <div key={l} className="bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg py-1.5 text-center">
          <div className={`text-xl font-bold text-white leading-none ${i === 3 ? 'animate-pulse' : ''}`}>{v}</div>
          <div className="text-gray-300 mt-1" style={{ fontSize: '6px', letterSpacing: '0.05em' }}>{l}</div>
        </div>
      ))}
    </div>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const [annonces, setAnnonces] = useState([])
  const [places, setPlaces] = useState({ jeunes: 0, enfants: 0 })
  const [plusOpen, setPlusOpen] = useState(false)

  useEffect(() => {
    async function fetchData() {
      const [{ data: ann }, { data: insc }] = await Promise.all([
        supabase.from('annonces').select('*').eq('publie', true).order('created_at', { ascending: false }),
        supabase.from('inscriptions').select('tranche_age'),
      ])
      setAnnonces(ann || [])
      const jeunes = (insc || []).filter(i => i.tranche_age === 'Jeunes & Adultes').length
      const enfants = (insc || []).filter(i => i.tranche_age === 'Enfants & Adolescents').length
      setPlaces({ jeunes, enfants })
    }
    fetchData()
  }, [])

  const tagGradients = {
    Nouveau: 'linear-gradient(140deg,#054035,#1D9E75)',
    Important: 'linear-gradient(140deg,#8B2500,#D94F1E)',
    Document: 'linear-gradient(140deg,#2C1F6B,#6B4FBB)',
    Info: 'linear-gradient(140deg,#6B4A00,#C48A00)',
  }

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto flex flex-col">

      {/* HERO */}
      <div className="relative overflow-hidden px-4 pt-10 pb-4" style={{ background: 'linear-gradient(160deg,#054035 0%,#085041 50%,#0F6E56 100%)' }}>
        <div className="absolute w-40 h-40 rounded-full top-0 right-0 -translate-y-1/2 translate-x-1/2" style={{ border: '1px solid rgba(255,255,255,0.07)' }} />

        {/* Logo */}
        <div className="flex items-center gap-3 mb-3">
          <img src="/logo-navs.jpg" alt="Navigateurs CI" className="h-9 w-auto rounded-lg bg-white p-0.5" />
          <div>
            <div className="text-xs font-bold text-white">NAVIGATEURS</div>
            <div className="text-xs italic" style={{ color: '#9FE1CB' }}>Côte d'Ivoire</div>
          </div>
        </div>

        <div className="text-2xl font-bold text-white mb-1">Camp-Navs 2026</div>
        <div className="text-xs leading-relaxed italic pl-2 mb-3" style={{ color: 'rgba(255,255,255,0.72)', borderLeft: '2px solid #C9A84C' }}>
          Les familles et réseaux relationnels pour une expansion naturelle de l'Évangile
        </div>

        <Countdown />
      </div>

      {/* PLACES */}
      <div className="grid grid-cols-2 gap-3 px-4 py-3">
        <div className="bg-white rounded-xl border border-gray-100 p-3">
          <p className="text-xs text-gray-400 mb-1">Jeunes & Adultes</p>
          <p className="text-lg font-medium text-emerald-700">{places.jeunes}<span className="text-xs text-gray-400 font-normal"> / 100</span></p>
          <div className="bg-emerald-50 rounded h-1 mt-2">
            <div className="bg-emerald-700 rounded h-1 transition-all" style={{ width: `${Math.min((places.jeunes / 100) * 100, 100)}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-1">30 000 FCFA</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-3">
          <p className="text-xs text-gray-400 mb-1">Enfants & Ados</p>
          <p className="text-lg font-medium text-emerald-700">{places.enfants}<span className="text-xs text-gray-400 font-normal"> / 50</span></p>
          <div className="bg-emerald-50 rounded h-1 mt-2">
            <div className="bg-emerald-700 rounded h-1 transition-all" style={{ width: `${Math.min((places.enfants / 50) * 100, 100)}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-1">25 000 FCFA</p>
        </div>
      </div>

      {/* ACTIONS RAPIDES */}
      <div className="px-4 pb-3">
        <p className="text-xs font-medium text-gray-400 tracking-wider mb-2">ACTIONS RAPIDES</p>
        <div className="grid grid-cols-2 gap-3">
          <div onClick={() => navigate('/inscription')} className="bg-emerald-700 rounded-xl p-3 cursor-pointer active:opacity-80">
            <svg className="w-5 h-5 text-white mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            <div className="text-xs font-medium text-white">S'inscrire</div>
            <div className="text-xs mt-0.5" style={{ color: '#9FE1CB' }}>Réservez votre place</div>
            <div className="mt-2 text-xs font-medium text-white rounded-full px-2 py-0.5 inline-block" style={{ background: 'rgba(255,255,255,0.2)' }}>Go</div>
          </div>
          <div onClick={() => navigate('/suivi')} className="rounded-xl p-3 cursor-pointer active:opacity-80" style={{ background: '#FAEEDA' }}>
            <svg className="w-5 h-5 mb-1" style={{ color: '#854F0B' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <div className="text-xs font-medium" style={{ color: '#412402' }}>Mon inscription</div>
            <div className="text-xs mt-0.5" style={{ color: '#854F0B' }}>Voir mon statut</div>
            <div className="mt-2 text-xs font-medium rounded-full px-2 py-0.5 inline-block" style={{ background: 'rgba(0,0,0,0.08)', color: '#412402' }}>Go</div>
          </div>
        </div>
      </div>

      {/* ACTUALITES */}
      <div className="px-4 pb-28">
        <p className="text-xs font-medium text-gray-400 tracking-wider mb-2">ACTUALITES</p>
        {annonces.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
            <p className="text-sm text-gray-400">Aucune actualité pour le moment.</p>
          </div>
        )}
        <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
          {annonces.map((a) => (
            <div key={a.id} className="flex-shrink-0 w-48 rounded-2xl p-3 relative overflow-hidden"
              style={{ background: tagGradients[a.tag] || tagGradients['Info'] }}>
              <div className="absolute w-20 h-20 rounded-full -top-5 -right-5" style={{ background: 'rgba(255,255,255,0.07)' }} />
              <span className="text-xs font-semibold rounded-full px-2 py-0.5 inline-block mb-2" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
                {a.tag}
              </span>
              <div className="text-xs font-medium text-white leading-snug mb-1">{a.titre}</div>
              {a.contenu && <div className="text-xs leading-relaxed line-clamp-2" style={{ color: 'rgba(255,255,255,0.78)' }}>{a.contenu}</div>}
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {new Date(a.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </span>
                <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MENU PLUS */}
      {plusOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-20" onClick={() => setPlusOpen(false)}>
          <div className="absolute bottom-14 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 rounded-t-2xl px-4 pt-3 pb-5 shadow-xl"
            onClick={e => e.stopPropagation()}>
            <div className="w-8 h-1 bg-gray-200 rounded mx-auto mb-3" />
            <p className="text-xs font-medium text-gray-400 tracking-wider mb-3">PLUS DE SECTIONS</p>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Documents', path: '/documents', bg: '#FAECE7', ic: '#993C1D', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg> },
                { label: 'Discussion', path: '/discussion', bg: '#E1F5EE', ic: '#085041', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg> },
                { label: 'Contact', path: '/contact', bg: '#EEEDFE', ic: '#534AB7', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg> },
                { label: 'Lieu', path: '/lieu', bg: '#E6F1FB', ic: '#185FA5', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
              ].map(item => (
                <div key={item.label} onClick={() => { navigate(item.path); setPlusOpen(false) }}
                  className="flex flex-col items-center gap-1.5 cursor-pointer">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: item.bg, color: item.ic }}>
                    {item.icon}
                  </div>
                  <span className="text-xs text-gray-500">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 flex z-30">
        {[
          { label: 'Accueil', path: '/', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" /></svg> },
          { label: 'Planning', path: '/programme', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
          { label: 'Chants', path: '/chants', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg> },
          { label: "S'inscrire", path: '/inscription', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
        ].map(item => (
          <button key={item.label} onClick={() => navigate(item.path)} className="flex-1 flex flex-col items-center py-2 text-gray-400">
            {item.icon}
            <span className="text-xs mt-0.5">{item.label}</span>
          </button>
        ))}
        <button onClick={() => setPlusOpen(!plusOpen)} className="flex-1 flex flex-col items-center py-2 text-gray-400">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
          <span className="text-xs mt-0.5">Plus</span>
        </button>
      </nav>
    </div>
  )
}
