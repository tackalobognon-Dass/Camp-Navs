import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import BottomNav from '../../components/public/BottomNav'

const VERT = '#054035'

const SOURCES = [
  {
    key: 'annonces',
    table: 'annonces',
    label: 'Annonce',
    filtre: { colonne: 'publie', valeur: true },
    couleur: '#E8F5E8', textColor: '#054035',
    icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/></svg>,
    path: '/',
    getTitle: item => item.titre,
    getSub: item => item.contenu?.slice(0, 60) + (item.contenu?.length > 60 ? '...' : ''),
  },
  {
    key: 'documents',
    table: 'documents',
    label: 'Document',
    couleur: '#FFF4E6', textColor: '#C2410C',
    icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>,
    path: '/documents',
    getTitle: item => item.nom,
    getSub: item => item.description || 'Nouveau document disponible',
  },
  {
    key: 'chants',
    table: 'chants',
    label: 'Chant',
    couleur: '#F5F3FF', textColor: '#6D28D9',
    icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"/></svg>,
    path: '/chants',
    getTitle: item => item.titre,
    getSub: item => item.artiste || 'Nouveau chant ajouté au répertoire',
  },
  {
    key: 'temoignages',
    table: 'temoignages',
    label: 'Témoignage',
    filtre: { colonne: 'statut', valeur: 'approuve' },
    couleur: '#EFF6FF', textColor: '#1D4ED8',
    icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>,
    path: '/temoignages',
    getTitle: item => item.anonyme ? 'Nouveau témoignage anonyme' : `Témoignage de ${item.nom}`,
    getSub: item => item.contenu?.slice(0, 60) + (item.contenu?.length > 60 ? '...' : ''),
  },
  {
    key: 'programme',
    table: 'programme_camp',
    label: 'Programme',
    couleur: '#FEF3C7', textColor: '#D97706',
    icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>,
    path: '/programme',
    getTitle: item => item.activite,
    getSub: item => `${item.jour}${item.heure_debut ? ' · ' + item.heure_debut : ''}`,
  },
]

function formatDate(str) {
  return new Date(str).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function NotificationsPage() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastSeen, setLastSeen] = useState(() => {
    return localStorage.getItem('navs_last_seen') || new Date(0).toISOString()
  })

  useEffect(() => {
    async function fetchAll() {
      const results = []
      for (const source of SOURCES) {
        let query = supabase.from(source.table).select('*').order('created_at', { ascending: false }).limit(20)
        if (source.filtre) {
          query = query.eq(source.filtre.colonne, source.filtre.valeur)
        }
        const { data } = await query
        ;(data || []).forEach(item => {
          results.push({
            id: `${source.key}-${item.id}`,
            source,
            item,
            date: item.created_at,
            isNew: new Date(item.created_at) > new Date(lastSeen),
          })
        })
      }
      results.sort((a, b) => new Date(b.date) - new Date(a.date))
      setNotifications(results)
      setLoading(false)
    }
    fetchAll()
  }, [])

  function marquerLu() {
    const now = new Date().toISOString()
    localStorage.setItem('navs_last_seen', now)
    setLastSeen(now)
    setNotifications(n => n.map(item => ({ ...item, isNew: false })))
  }

  const nbNouveaux = notifications.filter(n => n.isNew).length

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', maxWidth: 480, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ background: VERT, padding: '44px 16px 18px', flexShrink: 0 }}>
        <button onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,0.7)', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 14 }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          Retour
        </button>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 3px' }}>Notifications</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
              {nbNouveaux > 0 ? `${nbNouveaux} nouvelle(s) info(s)` : 'Tout est à jour'}
            </p>
          </div>
          {nbNouveaux > 0 && (
            <button onClick={marquerLu}
              style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 10, padding: '8px 12px', fontSize: 11, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
              Tout marquer lu
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: '12px 14px 80px', display: 'flex', flexDirection: 'column', gap: 8 }}>

        {loading && (
          <p style={{ textAlign: 'center', fontSize: 13, color: '#9CA3AF', padding: '30px 0' }}>Chargement...</p>
        )}

        {!loading && notifications.length === 0 && (
          <div style={{ background: '#fff', borderRadius: 16, padding: '32px 20px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <p style={{ fontSize: 32, margin: '0 0 10px' }}>🔔</p>
            <p style={{ fontSize: 14, fontWeight: 500, color: '#374151', margin: '0 0 4px' }}>Aucune notification</p>
            <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>Les nouvelles infos apparaîtront ici.</p>
          </div>
        )}

        {notifications.map(({ id, source, item, date, isNew }) => (
          <div key={id} onClick={() => navigate(source.path)}
            style={{ background: '#fff', borderRadius: 14, border: `0.5px solid ${isNew ? '#054035' : '#F3F4F6'}`, boxShadow: '0 1px 4px rgba(0,0,0,0.05)', padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', position: 'relative' }}>

            {/* Icône */}
            <div style={{ width: 40, height: 40, borderRadius: 12, background: source.couleur, color: source.textColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {source.icon}
            </div>

            {/* Contenu */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: source.couleur, color: source.textColor }}>{source.label}</span>
                <span style={{ fontSize: 10, color: '#9CA3AF' }}>{formatDate(date)}</span>
              </div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {source.getTitle(item)}
              </p>
              <p style={{ fontSize: 11, color: '#6B7280', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {source.getSub(item)}
              </p>
            </div>

            {/* Point rouge si nouveau */}
            {isNew && (
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', flexShrink: 0, marginTop: 4 }} />
            )}
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  )
}
