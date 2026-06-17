import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import BottomNav from '../../components/public/BottomNav'

const VERT = '#054035'
const OR   = '#C9A84C'
const TEL_TRESORIERE = '0709626265'
const TEL_AFFICHE    = '07 09 62 62 65'

function getMontantDu(ins) {
  if (ins.montant_personnalise != null) return ins.montant_personnalise
  return ins.tranche_age === 'Enfants & Adolescents' ? 25000 : 30000
}

function InfoBadge({ icon, label, valeur, color = '#475569', bg = '#F8FAFC' }) {
  if (!valeur) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: bg, borderRadius: 12, padding: '10px 14px', marginBottom: 8 }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: 10, color: '#94A3B8', margin: '0 0 1px', fontWeight: 500 }}>{label}</p>
        <p style={{ fontSize: 13, color, fontWeight: 600, margin: 0 }}>{valeur}</p>
      </div>
    </div>
  )
}

export default function SuiviPage() {
  const navigate = useNavigate()
  const [telephone, setTelephone] = useState('')
  const [inscription, setInscription] = useState(null)
  const [versements, setVersements] = useState([])
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState('')
  const [rechercheFaite, setRechercheFaite] = useState(false)
  const [copie, setCopie] = useState(false)

  // Normalise un numéro : garde uniquement les chiffres, retire
  // l'indicatif pays (225) et le 0 initial. Ainsi "07 09...",
  // "+225 709...", "0709..." et "709..." deviennent identiques.
  function normaliserTelephone(str) {
    if (!str) return ''
    let chiffres = String(str).replace(/\D/g, '')
    chiffres = chiffres.replace(/^225/, '')
    chiffres = chiffres.replace(/^0/, '')
    return chiffres
  }

  async function handleRecherche() {
    const saisie = telephone.trim()
    if (!saisie) { setErreur('Entrez votre numéro de téléphone.'); return }
    setLoading(true); setErreur(''); setInscription(null); setVersements([]); setRechercheFaite(false)

    const cible = normaliserTelephone(saisie)
    if (!cible) {
      setErreur('Numéro invalide.')
      setLoading(false); setRechercheFaite(true)
      return
    }

    // On récupère id + téléphone de toutes les inscriptions (léger)
    // et on compare après normalisation, ce qui tolère tous les
    // formats possibles (espaces, indicatif, 0 initial ou pas).
    const { data: liste, error } = await supabase
      .from('inscriptions')
      .select('id, telephone')

    if (error) {
      console.error('Erreur recherche inscription :', error)
      setErreur('Erreur de connexion. Réessayez.')
      setLoading(false); setRechercheFaite(true)
      return
    }

    const correspondance = (liste || []).find(ins => normaliserTelephone(ins.telephone) === cible)

    if (correspondance) {
      const { data: complet } = await supabase
        .from('inscriptions')
        .select('*')
        .eq('id', correspondance.id)
        .single()
      setInscription(complet)
      const { data: v } = await supabase
        .from('versements')
        .select('*')
        .eq('inscription_id', correspondance.id)
        .order('date_versement', { ascending: true })
      setVersements(v || [])
    } else {
      setErreur('Aucune inscription trouvée pour ce numéro.')
    }
    setLoading(false); setRechercheFaite(true)
  }

  function copierNumero() {
    navigator.clipboard.writeText(TEL_TRESORIERE).catch(() => {})
    setCopie(true)
    setTimeout(() => setCopie(false), 2000)
  }

  function handleWhatsApp() {
    if (!inscription) return
    const du    = getMontantDu(inscription)
    const paye  = versements.reduce((s, v) => s + v.montant, 0)
    const reste = Math.max(du - paye, 0)
    const msg = reste > 0
      ? `Bonjour Mme OBODJI, je suis ${inscription.nom_complet}, inscrit(e) au Camp-Navs 2026.\n\nIl me reste ${reste.toLocaleString()} FCFA à payer sur un total de ${du.toLocaleString()} FCFA.\n\nPouvez-vous me confirmer les modalités de paiement ? Merci.`
      : `Bonjour Mme OBODJI, je suis ${inscription.nom_complet}, inscrit(e) au Camp-Navs 2026. Mon paiement de ${du.toLocaleString()} FCFA est complet. Merci !`
    window.open(`https://wa.me/225${TEL_TRESORIERE}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  // Calculs paiement
  const du     = inscription ? getMontantDu(inscription) : 0
  const totalVerse = versements.reduce((s, v) => s + v.montant, 0)
  const reste  = Math.max(du - totalVerse, 0)
  const pct    = du > 0 ? Math.min(Math.round((totalVerse / du) * 100), 100) : 0
  const aReduction = inscription?.montant_personnalise != null
  const montantStandard = inscription ? (inscription.tranche_age === 'Enfants & Adolescents' ? 25000 : 30000) : 0

  return (
    <div style={{ minHeight: '100vh', background: '#F0F7F4', maxWidth: 480, margin: '0 auto' }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
        @keyframes spin { to { transform:rotate(360deg) } }
      `}</style>

      {/* Header compact */}
      <div style={{ background: `linear-gradient(160deg, ${VERT} 0%, #0A6B50 100%)`, padding: '44px 20px 20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: 160, height: 160, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)', top: -50, right: -40 }} />
        <button onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.6)', fontSize: 11, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 14 }}>
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          Retour
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 14, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          </div>
          <div>
            <p style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 0 3px' }}>Mon inscription</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', margin: 0 }}>Consultez votre fiche et votre statut de paiement</p>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 16px 100px' }}>

        {/* Carte recherche */}
        <div style={{ background: '#fff', borderRadius: 20, padding: 18, marginBottom: 14, boxShadow: '0 4px 20px rgba(5,64,53,0.08)', animation: 'fadeUp .4s ease' }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', margin: '0 0 3px' }}>Rechercher par téléphone</p>
          <p style={{ fontSize: 11, color: '#94A3B8', margin: '0 0 14px', lineHeight: 1.5 }}>Entrez le numéro utilisé lors de votre inscription.</p>

          <div style={{ position: 'relative', marginBottom: 10 }}>
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 15 }}>🇨🇮</span>
              <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>+225</span>
              <div style={{ width: 1, height: 14, background: '#E2E8F0' }} />
            </div>
            <input type="tel" inputMode="numeric" value={telephone}
              onChange={e => { setTelephone(e.target.value); setErreur(''); setRechercheFaite(false); setInscription(null); setVersements([]) }}
              onKeyDown={e => e.key === 'Enter' && handleRecherche()}
              placeholder="07 XX XX XX XX"
              style={{ width: '100%', border: `1.5px solid ${erreur ? '#FCA5A5' : '#E2E8F0'}`, borderRadius: 12, padding: '13px 12px 13px 84px', fontSize: 15, outline: 'none', background: '#F8FAFC', color: '#1E293B', boxSizing: 'border-box', transition: 'border .2s' }} />
          </div>

          {erreur && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '9px 12px', marginBottom: 10 }}>
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#DC2626" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              <p style={{ fontSize: 12, color: '#DC2626', margin: 0 }}>{erreur}</p>
            </div>
          )}

          <button type="button" onClick={handleRecherche} disabled={loading || !telephone.trim()}
            style={{ width: '100%', background: loading || !telephone.trim() ? '#94A3B8' : VERT, color: '#fff', border: 'none', borderRadius: 12, padding: '13px', fontSize: 14, fontWeight: 700, cursor: loading || !telephone.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all .2s' }}>
            {loading
              ? <><div style={{ width: 15, height: 15, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin .8s linear infinite' }} />Recherche...</>
              : <><svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>Rechercher</>
            }
          </button>
        </div>

        {/* ── RÉSULTAT ── */}
        {inscription && (
          <div style={{ animation: 'fadeUp .4s ease' }}>

            {/* Carte profil */}
            <div style={{ background: `linear-gradient(135deg, ${VERT}, #0A6B50)`, borderRadius: 18, padding: '16px', marginBottom: 10, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', top: -25, right: -15 }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '2px solid rgba(255,255,255,0.2)' }}>
                  <span style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{inscription.nom_complet?.charAt(0)}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: '0 0 5px' }}>{inscription.nom_complet}</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, background: OR, color: '#fff', borderRadius: 20, padding: '2px 9px' }}>
                      {inscription.tranche_age === 'Enfants & Adolescents' ? 'Enfant / Ado' : 'Jeune / Adulte'}
                    </span>
                    <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.15)', color: '#fff', borderRadius: 20, padding: '2px 9px' }}>{inscription.genre}</span>
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.12)', display: 'flex', gap: 14 }}>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', margin: 0 }}>📅 23 – 29 août 2026</p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', margin: 0 }}>📍 La Sablière, Bingerville</p>
              </div>
            </div>

            {/* ── PAIEMENT ── */}
            <div style={{ background: '#fff', borderRadius: 16, padding: '14px', marginBottom: 10, border: '1px solid #F1F5F9' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>Paiement</p>
                {(() => {
                  const cfg = {
                    'payé':       { label: 'Payé', bg: '#ECFDF5', color: '#065F46', border: '#6EE7B7' },
                    'partiel':    { label: 'Partiel', bg: '#EFF6FF', color: '#1D4ED8', border: '#93C5FD' },
                    'en attente': { label: 'En attente', bg: '#FFFBEB', color: '#92400E', border: '#FCD34D' },
                  }
                  const sc = cfg[inscription.statut_paiement] || cfg['en attente']
                  return <span style={{ fontSize: 10, fontWeight: 700, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, borderRadius: 20, padding: '2px 10px' }}>{sc.label}</span>
                })()}
              </div>

              {/* Réduction */}
              {aReduction && (
                <div style={{ background: '#F5F3FF', borderRadius: 10, padding: '8px 12px', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="#7C3AED" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/></svg>
                    <span style={{ fontSize: 11, color: '#6D28D9', fontWeight: 600 }}>Tarif personnalisé appliqué</span>
                  </div>
                  <span style={{ fontSize: 10, color: '#94A3B8', textDecoration: 'line-through' }}>{montantStandard.toLocaleString()} FCFA</span>
                </div>
              )}

              {/* Jauge */}
              <div style={{ background: '#F1F5F9', borderRadius: 20, height: 6, marginBottom: 10, overflow: 'hidden' }}>
                <div style={{ background: inscription.statut_paiement === 'payé' ? '#059669' : inscription.statut_paiement === 'partiel' ? '#3B82F6' : '#FCD34D', height: '100%', borderRadius: 20, width: `${pct}%`, transition: 'width 1s ease' }} />
              </div>

              {/* 3 compteurs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                {[
                  { val: du.toLocaleString(),         label: 'Total dû',  color: '#1E293B', bg: '#F8FAFC', border: '#E2E8F0' },
                  { val: totalVerse.toLocaleString(),  label: 'Versé',     color: '#059669', bg: '#ECFDF5', border: '#6EE7B7' },
                  { val: reste > 0 ? reste.toLocaleString() : '✓', label: reste > 0 ? 'Reste' : 'Soldé', color: reste > 0 ? '#92400E' : '#059669', bg: reste > 0 ? '#FFFBEB' : '#ECFDF5', border: reste > 0 ? '#FCD34D' : '#6EE7B7' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center', background: s.bg, border: `1px solid ${s.border}`, borderRadius: 10, padding: '8px 4px' }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: s.color, margin: '0 0 2px', lineHeight: 1 }}>{s.val}</p>
                    <p style={{ fontSize: 9, color: '#94A3B8', margin: 0 }}>{s.label} FCFA</p>
                  </div>
                ))}
              </div>

              {/* Historique des versements */}
              {versements.length > 0 && (
                <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #F1F5F9' }}>
                  <p style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 12px', margin: 0, background: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
                    Historique des versements
                  </p>
                  {versements.map((v, i) => (
                    <div key={v.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '9px 12px', borderBottom: i < versements.length - 1 ? '1px solid #F1F5F9' : 'none', background: '#fff' }}>
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#059669', margin: '0 0 2px' }}>{v.montant.toLocaleString()} FCFA</p>
                        <p style={{ fontSize: 10, color: '#94A3B8', margin: 0 }}>
                          {new Date(v.date_versement).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {v.note ? ` · ${v.note}` : ''}
                        </p>
                      </div>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#059669' }} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── INFOS ── */}
            <div style={{ background: '#fff', borderRadius: 16, padding: '14px', marginBottom: 10, border: '1px solid #F1F5F9' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px' }}>Informations</p>
              <InfoBadge bg="#F0FDF4"
                icon={<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#059669" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                label="Taille de polo" valeur={inscription.taille_tshirt ? `Taille ${inscription.taille_tshirt}` : null} color="#065F46" />
              <InfoBadge bg="#F8FAFC"
                icon={<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#475569" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>}
                label="Lieu" valeur={inscription.commune ? `${inscription.commune}, ${inscription.ville}` : inscription.ville} />
              <InfoBadge bg="#FFF7ED"
                icon={<svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#EA580C" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>}
                label="Contact d'urgence" valeur={inscription.nom_urgence ? `${inscription.nom_urgence} · ${inscription.tel_urgence}` : inscription.contact_urgence} color="#EA580C" />
            </div>

            {/* ── CONTACT TRÉSORIÈRE ── */}
            <div style={{ background: '#fff', borderRadius: 16, padding: '14px', marginBottom: 10, border: '1px solid #F1F5F9' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 10px' }}>Payer ou contacter</p>
              <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '10px 14px', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: 10, color: '#94A3B8', margin: '0 0 2px' }}>Mme OBODJI — Trésorière</p>
                  <p style={{ fontSize: 18, fontWeight: 700, color: VERT, margin: 0 }}>{TEL_AFFICHE}</p>
                </div>
                <button type="button" onClick={copierNumero}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, background: copie ? '#ECFDF5' : '#fff', border: `1px solid ${copie ? '#6EE7B7' : '#E2E8F0'}`, borderRadius: 10, padding: '7px 12px', fontSize: 11, fontWeight: 600, color: copie ? '#059669' : '#64748B', cursor: 'pointer', transition: 'all .2s' }}>
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                  {copie ? 'Copié !' : 'Copier'}
                </button>
              </div>
              <button type="button" onClick={handleWhatsApp}
                style={{ width: '100%', background: '#25D366', color: '#fff', border: 'none', borderRadius: 12, padding: '13px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 3px 12px rgba(37,211,102,0.25)' }}>
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.859L.057 23.625a.5.5 0 00.612.612l5.766-1.476A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.9 0-3.7-.514-5.253-1.408l-.375-.223-3.886.995 1.013-3.786-.244-.388A9.955 9.955 0 012 12c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10z"/></svg>
                Écrire à Mme OBODJI sur WhatsApp
              </button>
            </div>

            {/* Confirmation si soldé */}
            {inscription.statut_paiement === 'payé' && (
              <div style={{ background: '#ECFDF5', border: '1px solid #6EE7B7', borderRadius: 16, padding: '14px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#065F46', margin: '0 0 2px' }}>Inscription complète !</p>
                  <p style={{ fontSize: 11, color: '#059669', margin: 0 }}>Votre place est confirmée. À bientôt à La Sablière !</p>
                </div>
              </div>
            )}

            {/* Nouvelle recherche */}
            <button type="button" onClick={() => { setInscription(null); setVersements([]); setTelephone(''); setRechercheFaite(false) }}
              style={{ width: '100%', background: 'transparent', color: '#94A3B8', border: '1px solid #E2E8F0', borderRadius: 12, padding: '11px', fontSize: 12, cursor: 'pointer' }}>
              Nouvelle recherche
            </button>
          </div>
        )}

        {/* Aucun résultat */}
        {rechercheFaite && !inscription && !loading && (
          <div style={{ background: '#fff', borderRadius: 18, padding: 22, textAlign: 'center', animation: 'fadeUp .4s ease', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#DC2626" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', margin: '0 0 6px' }}>Aucune inscription trouvée</p>
            <p style={{ fontSize: 12, color: '#94A3B8', margin: '0 0 16px', lineHeight: 1.5 }}>Vérifiez votre numéro ou inscrivez-vous.</p>
            <button type="button" onClick={() => window.location.href = '/inscription'}
              style={{ background: VERT, color: '#fff', border: 'none', borderRadius: 12, padding: '11px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              S'inscrire maintenant
            </button>
          </div>
        )}

        {/* Aide par défaut */}
        {!inscription && !rechercheFaite && (
          <div style={{ background: '#fff', borderRadius: 16, padding: '14px', border: '1px solid #F1F5F9' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 10px' }}>Informations de paiement</p>
            <p style={{ fontSize: 12, color: '#475569', margin: '0 0 10px', lineHeight: 1.6 }}>
              Envoyez votre paiement via <strong>Wave</strong> ou <strong>Orange Money</strong> au numéro suivant :
            </p>
            <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 10, color: '#94A3B8', margin: '0 0 2px' }}>Mme OBODJI — Trésorière</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: VERT, margin: 0 }}>{TEL_AFFICHE}</p>
              </div>
              <button type="button" onClick={copierNumero}
                style={{ display: 'flex', alignItems: 'center', gap: 5, background: copie ? '#ECFDF5' : '#fff', border: `1px solid ${copie ? '#6EE7B7' : '#E2E8F0'}`, borderRadius: 10, padding: '7px 12px', fontSize: 11, fontWeight: 600, color: copie ? '#059669' : '#64748B', cursor: 'pointer' }}>
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                {copie ? 'Copié !' : 'Copier'}
              </button>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
