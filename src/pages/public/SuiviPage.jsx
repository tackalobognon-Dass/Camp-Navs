import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import BottomNav from '../../components/public/BottomNav'

const VERT = '#054035'
const OR   = '#C9A84C'

function getMontantDu(ins) {
  if (ins.montant_personnalise != null) return ins.montant_personnalise
  return ins.tranche_age === 'Enfants & Adolescents' ? 25000 : 30000
}

function StatutPaiement({ ins }) {
  const du    = getMontantDu(ins)
  const paye  = ins.statut_paiement === 'payé' ? du : (ins.montant_paye || 0)
  const reste = Math.max(du - paye, 0)
  const pct   = Math.min(Math.round((paye / du) * 100), 100)

  const cfg = {
    'payé':       { label: 'Payé intégralement', bg: '#ECFDF5', color: '#065F46', border: '#6EE7B7' },
    'partiel':    { label: 'Paiement partiel',   bg: '#EFF6FF', color: '#1D4ED8', border: '#93C5FD' },
    'en attente': { label: 'En attente',          bg: '#FFFBEB', color: '#92400E', border: '#FCD34D' },
  }
  const sc = cfg[ins.statut_paiement] || cfg['en attente']

  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 16, marginBottom: 10, border: '1px solid #F1F5F9' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em', margin: 0, textTransform: 'uppercase' }}>Paiement</p>
        <span style={{ fontSize: 10, fontWeight: 700, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`, borderRadius: 20, padding: '2px 10px' }}>{sc.label}</span>
      </div>
      {/* Jauge */}
      <div style={{ background: '#F1F5F9', borderRadius: 20, height: 6, marginBottom: 8, overflow: 'hidden' }}>
        <div style={{ background: ins.statut_paiement === 'payé' ? '#059669' : ins.statut_paiement === 'partiel' ? '#3B82F6' : '#FCD34D', height: '100%', borderRadius: 20, width: `${pct}%`, transition: 'width 1s ease' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {[
          { val: `${du.toLocaleString()}`, label: 'Total dû', color: '#1E293B' },
          { val: `${paye.toLocaleString()}`, label: 'Versé', color: '#059669' },
          { val: reste > 0 ? `${reste.toLocaleString()}` : '✓', label: reste > 0 ? 'Reste' : 'Soldé', color: reste > 0 ? '#92400E' : '#059669' },
        ].map(s => (
          <div key={s.label} style={{ textAlign: 'center', background: '#F8FAFC', borderRadius: 10, padding: '8px 4px' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: s.color, margin: '0 0 2px', lineHeight: 1 }}>{s.val}</p>
            <p style={{ fontSize: 9, color: '#94A3B8', margin: 0 }}>{s.label} FCFA</p>
          </div>
        ))}
      </div>
    </div>
  )
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
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState('')
  const [rechercheFaite, setRechercheFaite] = useState(false)

  async function handleRecherche() {
    const num = telephone.trim().replace(/\s/g, '')
    if (!num) { setErreur('Entrez votre numéro de téléphone.'); return }
    setLoading(true); setErreur(''); setInscription(null); setRechercheFaite(false)
    const { data } = await supabase
      .from('inscriptions')
      .select('*')
      .or(`telephone.eq.${num},telephone.eq.0${num.replace(/^225/, '')},telephone.eq.+225${num}`)
      .maybeSingle()
    setLoading(false); setRechercheFaite(true)
    if (data) setInscription(data)
    else setErreur('Aucune inscription trouvée pour ce numéro.')
  }

  function handleWhatsApp(ins) {
    const du    = getMontantDu(ins)
    const paye  = ins.statut_paiement === 'payé' ? du : (ins.montant_paye || 0)
    const reste = Math.max(du - paye, 0)
    const msg = reste > 0
      ? `Bonjour, je suis ${ins.nom_complet}, inscrit(e) au Camp-Navs 2026. Il me reste ${reste.toLocaleString()} FCFA à payer. Pouvez-vous me confirmer les modalités de paiement ? Merci.`
      : `Bonjour, je suis ${ins.nom_complet}, inscrit(e) au Camp-Navs 2026. Mon paiement de ${du.toLocaleString()} FCFA est complet. Merci !`
    window.open(`https://wa.me/2250709626265?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F0F7F4', maxWidth: 480, margin: '0 auto' }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: .5 } }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>

      {/* Header */}
      <div style={{ background: `linear-gradient(160deg, ${VERT} 0%, #0A6B50 100%)`, padding: '48px 20px 32px', position: 'relative', overflow: 'hidden' }}>
        {/* Cercles décoratifs */}
        <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)', top: -60, right: -60 }} />
        <div style={{ position: 'absolute', width: 120, height: 120, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.05)', bottom: -20, left: 40 }} />

        <button onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.6)', fontSize: 11, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20 }}>
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          Retour
        </button>

        {/* Icône */}
        <div style={{ width: 56, height: 56, borderRadius: 18, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
          <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
        </div>

        <p style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: '0 0 6px', lineHeight: 1.2 }}>Mon inscription</p>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', margin: 0 }}>Consultez votre fiche et votre statut de paiement</p>
      </div>

      <div style={{ padding: '24px 16px 100px' }}>

        {/* Carte de recherche */}
        <div style={{ background: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, boxShadow: '0 4px 24px rgba(5,64,53,0.10)', animation: 'fadeUp .4s ease' }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', margin: '0 0 4px' }}>Rechercher par téléphone</p>
          <p style={{ fontSize: 12, color: '#94A3B8', margin: '0 0 16px', lineHeight: 1.5 }}>
            Entrez le numéro que vous avez utilisé lors de votre inscription.
          </p>

          <div style={{ position: 'relative', marginBottom: 12 }}>
            {/* Préfixe pays */}
            <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 16 }}>🇨🇮</span>
              <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>+225</span>
              <div style={{ width: 1, height: 16, background: '#E2E8F0' }} />
            </div>
            <input
              type="tel"
              inputMode="numeric"
              value={telephone}
              onChange={e => { setTelephone(e.target.value); setErreur(''); setRechercheFaite(false); setInscription(null) }}
              onKeyDown={e => e.key === 'Enter' && handleRecherche()}
              placeholder="07 XX XX XX XX"
              style={{ width: '100%', border: `1.5px solid ${erreur ? '#FCA5A5' : '#E2E8F0'}`, borderRadius: 14, padding: '14px 14px 14px 90px', fontSize: 16, outline: 'none', background: '#F8FAFC', color: '#1E293B', letterSpacing: '0.04em', transition: 'border .2s', boxSizing: 'border-box' }}
            />
          </div>

          {erreur && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '10px 12px', marginBottom: 12 }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#DC2626" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              <p style={{ fontSize: 12, color: '#DC2626', margin: 0 }}>{erreur}</p>
            </div>
          )}

          <button type="button" onClick={handleRecherche} disabled={loading || !telephone.trim()}
            style={{ width: '100%', background: loading ? '#94A3B8' : VERT, color: '#fff', border: 'none', borderRadius: 14, padding: '15px', fontSize: 15, fontWeight: 700, cursor: loading || !telephone.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: !telephone.trim() ? 0.6 : 1, transition: 'all .2s' }}>
            {loading ? (
              <>
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', animation: 'spin .8s linear infinite' }} />
                Recherche...
              </>
            ) : (
              <>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                Rechercher mon inscription
              </>
            )}
          </button>
        </div>

        {/* Résultat */}
        {inscription && (
          <div style={{ animation: 'fadeUp .4s ease' }}>

            {/* Carte profil */}
            <div style={{ background: `linear-gradient(135deg, ${VERT}, #0A6B50)`, borderRadius: 20, padding: '20px', marginBottom: 12, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', top: -30, right: -20 }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '2px solid rgba(255,255,255,0.2)' }}>
                  <span style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>{inscription.nom_complet?.charAt(0)}</span>
                </div>
                <div>
                  <p style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: '0 0 4px', lineHeight: 1.2 }}>{inscription.nom_complet}</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, background: OR, color: '#fff', borderRadius: 20, padding: '2px 10px' }}>
                      {inscription.tranche_age === 'Enfants & Adolescents' ? 'Enfant / Ado' : 'Jeune / Adulte'}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 600, background: 'rgba(255,255,255,0.15)', color: '#fff', borderRadius: 20, padding: '2px 10px' }}>
                      {inscription.genre}
                    </span>
                  </div>
                </div>
              </div>
              {/* Dates */}
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.15)', display: 'flex', gap: 16 }}>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', margin: 0 }}>📅 23 – 29 août 2026</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', margin: 0 }}>📍 La Sablière, Bingerville</p>
              </div>
            </div>

            {/* Statut paiement */}
            <StatutPaiement ins={inscription} />

            {/* Infos */}
            <div style={{ background: '#fff', borderRadius: 16, padding: '14px', marginBottom: 10, border: '1px solid #F1F5F9' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px' }}>Informations personnelles</p>

              <InfoBadge bg="#F0FDF4"
                icon={<svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#059669" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                label="Taille de polo"
                valeur={inscription.taille_tshirt ? `Taille ${inscription.taille_tshirt}` : null}
                color="#065F46"
              />
              <InfoBadge bg="#F8FAFC"
                icon={<svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#475569" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>}
                label="Commune"
                valeur={inscription.commune ? `${inscription.commune}, ${inscription.ville}` : inscription.ville}
              />
              <InfoBadge bg="#FFF7ED"
                icon={<svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="#EA580C" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>}
                label="Contact d'urgence"
                valeur={inscription.nom_urgence ? `${inscription.nom_urgence} · ${inscription.tel_urgence}` : inscription.contact_urgence}
                color="#EA580C"
              />
              {inscription.deja_participe === 'Oui' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#EFF6FF', borderRadius: 12, padding: '8px 14px' }}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#1D4ED8" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
                  <p style={{ fontSize: 12, color: '#1D4ED8', fontWeight: 600, margin: 0 }}>Ancien campeur Navigateurs</p>
                </div>
              )}
            </div>

            {/* Bouton WhatsApp si reste à payer */}
            {inscription.statut_paiement !== 'payé' && (
              <button type="button" onClick={() => handleWhatsApp(inscription)}
                style={{ width: '100%', background: '#25D366', color: '#fff', border: 'none', borderRadius: 16, padding: '15px', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 10, boxShadow: '0 4px 16px rgba(37,211,102,0.3)' }}>
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.859L.057 23.625a.5.5 0 00.612.612l5.766-1.476A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.9 0-3.7-.514-5.253-1.408l-.375-.223-3.886.995 1.013-3.786-.244-.388A9.955 9.955 0 012 12c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10z"/></svg>
                Contacter la trésorière pour payer
              </button>
            )}

            {inscription.statut_paiement === 'payé' && (
              <div style={{ background: '#ECFDF5', border: '1px solid #6EE7B7', borderRadius: 16, padding: '14px 16px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#065F46', margin: '0 0 2px' }}>Inscription complète !</p>
                  <p style={{ fontSize: 11, color: '#059669', margin: 0 }}>Votre place au camp est confirmée. À bientôt à La Sablière !</p>
                </div>
              </div>
            )}

            {/* Nouvelle recherche */}
            <button type="button" onClick={() => { setInscription(null); setTelephone(''); setRechercheFaite(false) }}
              style={{ width: '100%', background: 'transparent', color: '#94A3B8', border: '1px solid #E2E8F0', borderRadius: 14, padding: '12px', fontSize: 13, cursor: 'pointer' }}>
              Nouvelle recherche
            </button>
          </div>
        )}

        {/* Aucun résultat */}
        {rechercheFaite && !inscription && !loading && !erreur && (
          <div style={{ background: '#fff', borderRadius: 20, padding: 24, textAlign: 'center', animation: 'fadeUp .4s ease', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#DC2626" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', margin: '0 0 6px' }}>Aucune inscription trouvée</p>
            <p style={{ fontSize: 12, color: '#94A3B8', margin: '0 0 16px', lineHeight: 1.5 }}>Vérifiez le numéro ou inscrivez-vous si vous ne l'avez pas encore fait.</p>
            <button type="button" onClick={() => window.location.href = '/inscription'}
              style={{ background: VERT, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              S'inscrire maintenant
            </button>
          </div>
        )}

        {/* Aide */}
        {!inscription && !rechercheFaite && (
          <div style={{ background: '#fff', borderRadius: 16, padding: '14px 16px', border: '1px solid #F1F5F9' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 10px' }}>Comment payer ?</p>
            <p style={{ fontSize: 12, color: '#475569', margin: '0 0 12px', lineHeight: 1.6 }}>
              Envoyez votre paiement via <strong>Wave</strong> ou <strong>Orange Money</strong> :
            </p>
            <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '10px 14px' }}>
              <p style={{ fontSize: 11, color: '#64748B', margin: '0 0 4px' }}>Trésorière — Mme OBODJI</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: VERT, margin: 0 }}>07 09 62 62 65</p>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
