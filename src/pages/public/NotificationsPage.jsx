import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import BottomNav from '../../components/public/BottomNav'

const VERT = '#054035'

function formatDate(str) {
  return new Date(str).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function NotificationsPage() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastSeen] = useState(() => localStorage.getItem('navs_last_seen') || new Date(0).toISOString())

  useEffect(() => {
    async function fetchAll() {
      const results = []

      const sources = [
        { key: 'annonces', table: 'annonces', label: 'Annonce', couleur: '#E8F5E8', textColor: '#054035', path: '/', filtre: { col: 'publie', val: true }, getTitle: i => i.titre, getSub: i => (i.contenu || '').slice(0, 60) },
        { key: 'documents', table: 'documents', label: 'Document', couleur: '#FFF4E6', textColor: '#C2410C', path: '/documents', getTitle: i => i.nom, getSub: i => i.description || 'Nouveau document' },
        { key: 'chants', table: 'chants', label: 'Chant', couleur: '#F5F3FF', textColor: '#6D28D9', path: '/chants', getTitle: i => i.titre, getSub: i => i.artiste || 'Nouveau chant' },
        { key: 'temoignages', table: 'temoignages', label: 'Témoignage', couleur: '#EFF6FF', textColor: '#1D4ED8', path: '/temoignages', filtre: { col: 'statut', val: 'approuve' }, getTitle: i => i.anonyme ? 'Témoignage anonyme' : `Témoignage de ${i.nom}`, getSub: i => (i.contenu || '').slice(0, 60) },
        { key: 'programme', table: 'programme_camp', label: 'Programme', couleur: '#FEF3C7', textColor: '#D97706', path: '/programme', getTitle: i => i.activite, getSub: i => i.jour || '' },
      ]

      for (const src of sources) {
        let q = supabase.from(src.table).select('*').order('created_at', { ascending: false }).limit(15)
        if (src.filtre) q = q.eq(src.filtre.col, src.filtre.val)
        const { data } = await q
        for (const item of (data || [])) {
          results.push({
            id: src.key + '-' + item.id,
            label: src.label,
            couleur: src.couleur,
            textColor: src.textColor,
            path: src.path,
            title: src.getTitle(item),
            sub: src.getSub(item),
            date: item.created_at,
            isNew: new Date(item.created_at) > new Date(lastSeen),
          })
        }
      }

      results.sort((a, b) => new Date(b.date) - new Date(a.date))
      setNotifications(results)
      setLoading(false)
    }
    fetchAll()
  }, [])

  function marquerLu() {
    localStorage.setItem('navs_last_seen', new Date().toISOString())
    setNotifications(n => n.map(i => ({ ...i, isNew: false })))
  }

  const nbNouveaux = notifications.filter(n => n.isNew).length

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ background: VERT, padding: '44px 16px 18px' }}>
        <button onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,0.7)', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 14 }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          Retour
        </button>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 3px' }}>Notifications</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
              {nbNouveaux > 0 ? nbNouveaux + ' nouvelle(s) info(s)' : 'Tout est à jour'}
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
        {loading && <p style={{ textAlign: 'center', fontSize: 13, color: '#9CA3AF', padding: '30px 0' }}>Chargement...</p>}

        {!loading && notifications.length === 0 && (
          <div style={{ background: '#fff', borderRadius: 16, padding: '32px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>Aucune notification pour le moment.</p>
          </div>
        )}

        {notifications.map(n => (
          <div key={n.id} onClick={() => navigate(n.path)}
            style={{ background: '#fff', borderRadius: 14, border: '0.5px solid ' + (n.isNew ? VERT : '#F3F4F6'), padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: n.couleur, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: n.couleur, color: n.textColor }}>{n.label}</span>
                <span style={{ fontSize: 10, color: '#9CA3AF' }}>{formatDate(n.date)}</span>
              </div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</p>
              <p style={{ fontSize: 11, color: '#6B7280', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.sub}</p>
            </div>
            {n.isNew && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', flexShrink: 0 }} />}
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  )
}
