import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import BottomNav from '../../components/public/BottomNav'

const PAR_PAGE = 5

export default function TemoignagesPage() {
  const navigate = useNavigate()
  const [temoignages, setTemoignages] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ nom: '', contenu: '', anonyme: false })
  const [saving, setSaving] = useState(false)
  const [succes, setSucces] = useState(false)
  const [recherche, setRecherche] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => { fetchTemoignages() }, [])

  async function fetchTemoignages() {
    const { data } = await supabase
      .from('temoignages')
      .select('*')
      .eq('statut', 'approuve')
      .order('created_at', { ascending: false })
    setTemoignages(data || [])
    setLoading(false)
  }

  async function handleSoumettre() {
    if (!form.contenu.trim()) return
    setSaving(true)
    await supabase.from('temoignages').insert([{
      nom: form.anonyme ? null : (form.nom.trim() || null),
      anonyme: form.anonyme,
      contenu: form.contenu.trim(),
      statut: 'en_attente',
    }])
    setSaving(false)
    setSucces(true)
    setForm({ nom: '', contenu: '', anonyme: false })
    setShowForm(false)
    setTimeout(() => setSucces(false), 5000)
  }

  function partagerWhatsApp(t) {
    const nom = t.anonyme ? 'Anonyme' : (t.nom || 'Anonyme')
    const message = `Témoignage de ${nom} :\n\n"${t.contenu}"\n\nPartagé depuis l'app Camp-Navs 2026 👉 https://camp-navs.vercel.app/temoignages`
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
  }

  function partagerNatif(t) {
    const nom = t.anonyme ? 'Anonyme' : (t.nom || 'Anonyme')
    if (navigator.share) {
      navigator.share({
        title: 'Témoignage — Camp-Navs 2026',
        text: `Témoignage de ${nom} :\n\n"${t.contenu}"`,
        url: 'https://camp-navs.vercel.app/temoignages',
      })
    } else {
      navigator.clipboard.writeText(`https://camp-navs.vercel.app/temoignages`)
      alert('Lien copié !')
    }
  }

  // Filtrage + pagination
  const filtres = temoignages.filter(t =>
    t.contenu.toLowerCase().includes(recherche.toLowerCase()) ||
    (!t.anonyme && t.nom && t.nom.toLowerCase().includes(recherche.toLowerCase()))
  )
  const totalPages = Math.ceil(filtres.length / PAR_PAGE)
  const affiches = filtres.slice(0, page * PAR_PAGE)
  const aEncore = page * PAR_PAGE < filtres.length

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', maxWidth: 480, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ background: '#054035', padding: '44px 16px 20px' }}>
        <button onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.6)', fontSize: 11, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 12 }}>
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          Retour
        </button>
        <p style={{ fontSize: 20, fontWeight: 500, color: '#fff', margin: '0 0 3px' }}>Témoignages</p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
          {temoignages.length} témoignage(s) partagé(s)
        </p>
      </div>

      <div style={{ padding: '16px 14px 80px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Message succès */}
        {succes && (
          <div style={{ background: '#E1F5EE', border: '0.5px solid #9FE1CB', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#059669" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, color: '#065F46', margin: 0 }}>Témoignage envoyé !</p>
              <p style={{ fontSize: 11, color: '#6B7280', margin: '3px 0 0' }}>Il sera visible après validation par un administrateur.</p>
            </div>
          </div>
        )}

        {/* Bouton partager témoignage */}
        <button onClick={() => setShowForm(!showForm)}
          style={{ width: '100%', background: '#054035', color: '#fff', border: 'none', borderRadius: 16, padding: '14px', fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
          {showForm ? 'Annuler' : 'Partager mon témoignage'}
        </button>

        {/* Formulaire */}
        {showForm && (
          <div style={{ background: '#fff', borderRadius: 16, border: '0.5px solid #E5E7EB', padding: 18 }}>
            <p style={{ fontSize: 14, fontWeight: 500, color: '#111827', margin: '0 0 14px' }}>Mon témoignage</p>

            {/* Anonyme toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, background: '#F9FAFB', borderRadius: 10, padding: '10px 14px' }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#111827', margin: 0 }}>Publier anonymement</p>
                <p style={{ fontSize: 11, color: '#9CA3AF', margin: '2px 0 0' }}>Votre nom ne sera pas affiché</p>
              </div>
              <button onClick={() => setForm(f => ({ ...f, anonyme: !f.anonyme }))}
                style={{ width: 44, height: 24, borderRadius: 12, background: form.anonyme ? '#054035' : '#D1D5DB', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background .2s' }}>
                <div style={{ position: 'absolute', width: 18, height: 18, borderRadius: '50%', background: '#fff', top: 3, left: form.anonyme ? 23 : 3, transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
              </button>
            </div>

            {/* Nom */}
            {!form.anonyme && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 5 }}>Votre nom</label>
                <input type="text" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                  placeholder="Ex : YAO Kouamé"
                  style={{ width: '100%', border: '0.5px solid #E5E7EB', borderRadius: 10, padding: '10px 12px', fontSize: 13, outline: 'none', background: '#F9FAFB' }} />
              </div>
            )}

            {/* Témoignage */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: '#6B7280', display: 'block', marginBottom: 5 }}>Votre témoignage *</label>
              <textarea value={form.contenu} onChange={e => setForm(f => ({ ...f, contenu: e.target.value }))}
                placeholder="Partagez ce que Dieu a fait dans votre vie..."
                rows={5}
                style={{ width: '100%', border: '0.5px solid #E5E7EB', borderRadius: 10, padding: '10px 12px', fontSize: 13, outline: 'none', resize: 'none', background: '#F9FAFB', lineHeight: 1.6 }} />
              <p style={{ fontSize: 10, color: '#9CA3AF', margin: '4px 0 0', textAlign: 'right' }}>{form.contenu.length} caractères</p>
            </div>

            <button onClick={handleSoumettre} disabled={saving || !form.contenu.trim()}
              style={{ width: '100%', background: '#054035', color: '#fff', border: 'none', borderRadius: 12, padding: '13px', fontSize: 14, fontWeight: 500, cursor: 'pointer', opacity: saving || !form.contenu.trim() ? 0.6 : 1 }}>
              {saving ? 'Envoi...' : 'Envoyer le témoignage'}
            </button>

            <p style={{ fontSize: 10, color: '#9CA3AF', textAlign: 'center', marginTop: 10 }}>
              Votre témoignage sera visible après validation par un administrateur.
            </p>
          </div>
        )}

        {/* Recherche */}
        {temoignages.length > 0 && (
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#9CA3AF' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input type="text" value={recherche} onChange={e => { setRecherche(e.target.value); setPage(1) }}
              placeholder="Rechercher un témoignage..."
              style={{ width: '100%', border: '0.5px solid #F3F4F6', borderRadius: 14, padding: '11px 12px 11px 36px', fontSize: 13, outline: 'none', background: '#fff', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }} />
          </div>
        )}

        {loading && <p style={{ textAlign: 'center', fontSize: 13, color: '#9CA3AF', padding: '20px 0' }}>Chargement...</p>}

        {!loading && temoignages.length === 0 && (
          <div style={{ background: '#fff', borderRadius: 16, border: '0.5px solid #F3F4F6', padding: '28px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 32, margin: '0 0 10px' }}>✨</p>
            <p style={{ fontSize: 14, fontWeight: 500, color: '#374151', margin: '0 0 6px' }}>Soyez le premier à témoigner</p>
            <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0 }}>Partagez ce que Dieu a fait dans votre vie.</p>
          </div>
        )}

        {recherche && filtres.length === 0 && (
          <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #F3F4F6', padding: 20, textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: '#9CA3AF' }}>Aucun résultat pour "{recherche}"</p>
          </div>
        )}

        {/* Liste témoignages */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {affiches.map(t => {
            const nom = t.anonyme ? 'Un campeur discret' : (t.nom || 'Anonyme')
            const initiale = (t.anonyme ? 'A' : (t.nom || 'A')).charAt(0).toUpperCase()
            const date = new Date(t.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
            return (
              <div key={t.id} style={{ background: '#fff', borderRadius: 18, border: '0.5px solid #F3F4F6', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: '18px 16px 14px', position: 'relative', overflow: 'hidden' }}>

                {/* Grand guillemet décoratif */}
                <div style={{ position: 'absolute', top: 12, right: 16, fontSize: 56, lineHeight: 1, color: '#F0FDF4', fontFamily: 'Georgia, serif', fontWeight: 700, userSelect: 'none', pointerEvents: 'none' }}>"</div>

                {/* Header auteur */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                    background: t.anonyme ? '#F3F4F6' : '#E1F5EE',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {t.anonyme ? (
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#9CA3AF" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    ) : (
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#054035' }}>{initiale}</span>
                    )}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0 }}>{nom}</p>
                    <p style={{ fontSize: 10, color: '#9CA3AF', margin: '2px 0 0' }}>{date}</p>
                  </div>
                </div>

                {/* Texte du témoignage */}
                <p style={{
                  fontSize: 14, color: '#1F2937', lineHeight: 1.85,
                  margin: '0 0 16px', fontStyle: 'italic',
                  position: 'relative', zIndex: 1,
                }}>
                  {t.contenu}
                </p>

                {/* Séparateur */}
                <div style={{ height: '0.5px', background: '#F3F4F6', marginBottom: 12 }} />

                {/* Boutons partage */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => partagerWhatsApp(t)}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'transparent', color: '#16A34A', border: '1px solid #16A34A', borderRadius: 10, padding: '8px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.859L.057 23.625a.5.5 0 00.612.612l5.766-1.476A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.9 0-3.7-.514-5.253-1.408l-.375-.223-3.886.995 1.013-3.786-.244-.388A9.955 9.955 0 012 12c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10z"/>
                    </svg>
                    WhatsApp
                  </button>
                  <button onClick={() => partagerNatif(t)}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'transparent', color: '#6B7280', border: '1px solid #E5E7EB', borderRadius: 10, padding: '8px 10px', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                    </svg>
                    Partager
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Voir plus */}
        {aEncore && (
          <button onClick={() => setPage(p => p + 1)}
            style={{ width: '100%', background: '#fff', color: '#054035', border: '0.5px solid #054035', borderRadius: 12, padding: '12px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            Voir plus ({filtres.length - page * PAR_PAGE} restant(s))
          </button>
        )}

        {!aEncore && filtres.length > PAR_PAGE && (
          <p style={{ textAlign: 'center', fontSize: 11, color: '#9CA3AF' }}>Tous les témoignages sont affichés.</p>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
