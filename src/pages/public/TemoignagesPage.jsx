import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import BottomNav from '../../components/public/BottomNav'

const VERT = '#054035'
const PAR_PAGE = 5

const COULEURS = [
  { bg: '#E1F5EE', color: '#054035' },
  { bg: '#EFF6FF', color: '#1D4ED8' },
  { bg: '#F5F3FF', color: '#6D28D9' },
  { bg: '#FEF9C3', color: '#92400E' },
  { bg: '#FEE2E2', color: '#991B1B' },
  { bg: '#ECFDF5', color: '#065F46' },
]

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
  const [expanded, setExpanded] = useState({})
  const [copie, setCopie] = useState('')

  useEffect(() => { fetchTemoignages() }, [])

  async function fetchTemoignages() {
    const { data } = await supabase.from('temoignages').select('*').eq('statut', 'approuve').order('created_at', { ascending: false })
    setTemoignages(data || [])
    setLoading(false)
  }

  async function handleSoumettre() {
    if (!form.contenu.trim()) return
    setSaving(true)
    await supabase.from('temoignages').insert([{ nom: form.anonyme ? null : (form.nom.trim() || null), anonyme: form.anonyme, contenu: form.contenu.trim(), statut: 'en_attente' }])
    setSaving(false); setSucces(true); setForm({ nom: '', contenu: '', anonyme: false }); setShowForm(false)
    setTimeout(() => setSucces(false), 5000)
  }

  function partagerWhatsApp(t) {
    const nom = t.anonyme ? 'Anonyme' : (t.nom || 'Anonyme')
    const msg = `Témoignage de ${nom} au Camp-Navs 2026 :\n\n"${t.contenu}"\n\n👉 https://camp-navs.vercel.app/temoignages`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  function copierTexte(t) {
    const nom = t.anonyme ? 'Anonyme' : (t.nom || 'Anonyme')
    const texte = `Témoignage de ${nom} :\n\n"${t.contenu}"\n\nCamp-Navs 2026`
    navigator.clipboard.writeText(texte).catch(() => {})
    setCopie(t.id)
    setTimeout(() => setCopie(''), 2000)
  }

  const filtres = temoignages.filter(t =>
    t.contenu.toLowerCase().includes(recherche.toLowerCase()) ||
    (!t.anonyme && t.nom && t.nom.toLowerCase().includes(recherche.toLowerCase()))
  )
  const affiches = filtres.slice(0, page * PAR_PAGE)
  const aEncore  = page * PAR_PAGE < filtres.length

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', maxWidth: 480, margin: '0 auto' }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px) } to { opacity:1; transform:translateY(0) } }
        @keyframes spin { to { transform:rotate(360deg) } }
      `}</style>

      {/* Header */}
      <div style={{ background: `linear-gradient(160deg, ${VERT} 0%, #0A6B50 100%)`, padding: '44px 16px 20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: 160, height: 160, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)', top: -50, right: -40 }} />
        <button onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.6)', fontSize: 11, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 14 }}>
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          Retour
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
          </div>
          <div>
            <p style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 0 3px' }}>Témoignages</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', margin: 0 }}>{temoignages.length} témoignage(s) partagé(s) · Camp-Navs 2026</p>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 14px 90px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Succès */}
        {succes && (
          <div style={{ background: '#ECFDF5', border: '1px solid #6EE7B7', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, animation: 'fadeUp .3s ease' }}>
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#059669" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#065F46', margin: 0 }}>Témoignage envoyé !</p>
              <p style={{ fontSize: 11, color: '#6B7280', margin: '2px 0 0' }}>Il sera visible après validation par un administrateur.</p>
            </div>
          </div>
        )}

        {/* Bouton partager */}
        <button type="button" onClick={() => setShowForm(!showForm)}
          style={{ width: '100%', background: showForm ? '#FEF2F2' : VERT, color: showForm ? '#DC2626' : '#fff', border: showForm ? '1px solid #FCA5A5' : 'none', borderRadius: 14, padding: '14px', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all .2s' }}>
          {showForm
            ? <><svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>Annuler</>
            : <><svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>Partager mon témoignage</>
          }
        </button>



        {/* Recherche */}
        {temoignages.length > 2 && (
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#94A3B8" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input type="text" value={recherche} onChange={e => { setRecherche(e.target.value); setPage(1) }}
              placeholder="Rechercher un témoignage..."
              style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: 12, padding: '11px 12px 11px 34px', fontSize: 13, outline: 'none', background: '#fff', boxSizing: 'border-box' }} />
          </div>
        )}

        {loading && <p style={{ textAlign: 'center', fontSize: 13, color: '#94A3B8', padding: '30px 0' }}>Chargement...</p>}

        {!loading && temoignages.length === 0 && (
          <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #F1F5F9', padding: '32px 20px', textAlign: 'center' }}>
            <p style={{ fontSize: 36, margin: '0 0 12px' }}>✨</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#1E293B', margin: '0 0 6px' }}>Soyez le premier à témoigner</p>
            <p style={{ fontSize: 12, color: '#94A3B8', margin: 0, lineHeight: 1.6 }}>Partagez ce que Dieu a fait dans votre vie au Camp-Navs 2026.</p>
          </div>
        )}
        {!loading && temoignages.length > 0 && temoignages.length < 4 && (
          <div style={{ background: 'linear-gradient(135deg, #054035, #0A6B50)', borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 24, flexShrink: 0 }}>🙏</span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: '0 0 3px' }}>Encouragez la communauté !</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.5 }}>Seulement {temoignages.length} témoignage(s) pour l'instant. Partagez le vôtre pour inspirer les autres campeurs.</p>
            </div>
          </div>
        )}

        {recherche && filtres.length === 0 && (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #F1F5F9', padding: '20px', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>Aucun résultat pour "{recherche}"</p>
          </div>
        )}

        {/* ── LISTE ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {affiches.map((t, idx) => {
            const nom = t.anonyme ? 'Anonyme' : (t.nom || 'Anonyme')
            const initiale = nom.charAt(0).toUpperCase()
            const date = new Date(t.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
            const couleur = COULEURS[idx % COULEURS.length]
            const contenuLong = t.contenu.length > 220
            const contenuAffiche = contenuLong && !expanded[t.id] ? t.contenu.slice(0, 220) + '…' : t.contenu
            return (
              <div key={t.id} style={{ background: '#fff', borderRadius: 18, border: '1px solid #F1F5F9', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', padding: '20px 18px 16px', position: 'relative', overflow: 'hidden', animation: 'fadeUp .4s ease' }}>
                {/* Guillemet décoratif — discret */}
                <div style={{ position: 'absolute', top: 8, right: 14, fontSize: 72, lineHeight: 1, color: 'rgba(5,64,53,0.04)', fontFamily: 'Georgia, serif', fontWeight: 700, userSelect: 'none', pointerEvents: 'none' }}>"</div>

                {/* Auteur */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: '50%', flexShrink: 0, background: t.anonyme ? '#F1F5F9' : couleur.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${t.anonyme ? '#E2E8F0' : couleur.bg}` }}>
                    {t.anonyme
                      ? <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#94A3B8" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                      : <span style={{ fontSize: 16, fontWeight: 700, color: couleur.color }}>{initiale}</span>
                    }
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', margin: 0 }}>{nom}</p>
                    <p style={{ fontSize: 10, color: '#94A3B8', margin: '2px 0 0' }}>{date}</p>
                  </div>
                </div>

                {/* Contenu */}
                <div style={{ marginBottom: 14, position: 'relative', zIndex: 1 }}>
                  <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.85, margin: 0, fontStyle: 'italic' }}>
                    "{contenuAffiche}"
                  </p>
                  {contenuLong && (
                    <button type="button" onClick={() => setExpanded(e => ({ ...e, [t.id]: !e[t.id] }))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: VERT, padding: '6px 0 0', display: 'block' }}>
                      {expanded[t.id] ? 'Voir moins ↑' : 'Voir la suite ↓'}
                    </button>
                  )}
                </div>

                {/* Séparateur */}
                <div style={{ height: 1, background: '#F8FAFC', marginBottom: 12 }} />

                {/* Actions partage */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => partagerWhatsApp(t)}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#F0FDF4', color: '#16A34A', border: '1px solid #86EFAC', borderRadius: 10, padding: '9px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.859L.057 23.625a.5.5 0 00.612.612l5.766-1.476A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.9 0-3.7-.514-5.253-1.408l-.375-.223-3.886.995 1.013-3.786-.244-.388A9.955 9.955 0 012 12c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10z"/></svg>
                    WhatsApp
                  </button>
                  <button type="button" onClick={() => copierTexte(t)}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: copie === t.id ? '#ECFDF5' : '#F8FAFC', color: copie === t.id ? '#065F46' : '#64748B', border: `1px solid ${copie === t.id ? '#6EE7B7' : '#E2E8F0'}`, borderRadius: 10, padding: '9px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .2s' }}>
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                    {copie === t.id ? 'Copié !' : 'Copier'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Voir plus */}
        {aEncore && (
          <button type="button" onClick={() => setPage(p => p + 1)}
            style={{ width: '100%', background: '#fff', color: VERT, border: `1px solid ${VERT}`, borderRadius: 12, padding: '12px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Voir plus ({filtres.length - page * PAR_PAGE} restant(s))
          </button>
        )}
        {!aEncore && filtres.length > PAR_PAGE && (
          <p style={{ textAlign: 'center', fontSize: 11, color: '#94A3B8' }}>Tous les témoignages sont affichés.</p>
        )}
      </div>

      <BottomNav />

      {/* ── FORMULAIRE BOTTOM SHEET ── */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={() => setShowForm(false)}>
          <div style={{ background: '#fff', borderRadius: '22px 22px 0 0', width: '100%', maxWidth: 480, maxHeight: '85vh', overflowY: 'auto', paddingBottom: 32 }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 36, height: 3, background: '#E2E8F0', borderRadius: 2, margin: '14px auto 0' }} />
            <div style={{ padding: '16px 18px 0' }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#1E293B', margin: '0 0 16px' }}>Partager mon témoignage</p>

              {/* Toggle anonyme */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC', borderRadius: 12, padding: '10px 14px', marginBottom: 12 }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', margin: 0 }}>Publier anonymement</p>
                  <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 0' }}>Votre nom ne sera pas affiché</p>
                </div>
                <button type="button" onClick={() => setForm(f => ({ ...f, anonyme: !f.anonyme }))}
                  style={{ width: 44, height: 24, borderRadius: 12, background: form.anonyme ? VERT : '#D1D5DB', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', width: 18, height: 18, borderRadius: '50%', background: '#fff', top: 3, left: form.anonyme ? 23 : 3, transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </button>
              </div>

              {/* Nom */}
              {!form.anonyme && (
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 5, fontWeight: 500 }}>Votre nom</label>
                  <input type="text" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="Ex : YAO Kouamé"
                    style={{ width: '100%', border: '1px solid #E2E8F0', borderRadius: 10, padding: '10px 12px', fontSize: 13, outline: 'none', background: '#F8FAFC', boxSizing: 'border-box' }} />
                </div>
              )}

              {/* Contenu avec limite 500 */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <label style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>Votre témoignage *</label>
                  <span style={{ fontSize: 10, color: form.contenu.length > 450 ? '#DC2626' : '#94A3B8', fontWeight: form.contenu.length > 450 ? 600 : 400 }}>
                    {form.contenu.length}/500
                  </span>
                </div>
                <textarea value={form.contenu} onChange={e => { if (e.target.value.length <= 500) setForm(f => ({ ...f, contenu: e.target.value })) }}
                  placeholder="Partagez ce que Dieu a fait dans votre vie au Camp-Navs..."
                  rows={5}
                  style={{ width: '100%', border: `1px solid ${form.contenu.length > 450 ? '#FCA5A5' : '#E2E8F0'}`, borderRadius: 10, padding: '10px 12px', fontSize: 13, outline: 'none', resize: 'none', background: '#F8FAFC', lineHeight: 1.7, boxSizing: 'border-box', transition: 'border .2s' }} />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ flex: 1, background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 10, padding: '13px', fontSize: 13, cursor: 'pointer' }}>
                  Annuler
                </button>
                <button type="button" onClick={handleSoumettre} disabled={saving || !form.contenu.trim()}
                  style={{ flex: 2, background: saving || !form.contenu.trim() ? '#94A3B8' : VERT, color: '#fff', border: 'none', borderRadius: 10, padding: '13px', fontSize: 13, fontWeight: 700, cursor: saving || !form.contenu.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {saving ? <><div style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin .8s linear infinite' }} />Envoi...</> : 'Envoyer'}
                </button>
              </div>
              <p style={{ fontSize: 10, color: '#94A3B8', textAlign: 'center', margin: '10px 0 0' }}>Visible après validation par un administrateur.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
