import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
const VERT = '#054035'
const OR = '#E8A020'
const VERT_CLAIR = '#E8F5E8'
const POLO_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const TAILLES_GUIDE = [
  { taille: 'XS',  poitrine: '86 – 90',  longueur: '67' },
  { taille: 'S',   poitrine: '90 – 94',  longueur: '69' },
  { taille: 'M',   poitrine: '94 – 100', longueur: '71' },
  { taille: 'L',   poitrine: '100 – 108',longueur: '73' },
  { taille: 'XL',  poitrine: '108 – 114',longueur: '75' },
  { taille: 'XXL', poitrine: '114 – 120',longueur: '77' },
]
const TRANCHES_ADULTE = [
  '16 – 19 ans', '20 – 25 ans', '26 – 30 ans',
  '31 – 40 ans', '41 – 49 ans', '50 ans et +'
]
const STEPS = [
  { label: 'Identité', icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg> },
  { label: 'Coordonnées', icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg> },
  { label: 'Santé', icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg> },
  { label: 'Logistique', icon: <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/></svg> },
]
function SelectCard({ label, sublabel, selected, onClick }) {
  return (
    <div onClick={onClick} style={{ border: `2px solid ${selected ? VERT : '#E5E7EB'}`, borderRadius: 14, padding: '12px 10px', cursor: 'pointer', textAlign: 'center', background: selected ? VERT_CLAIR : '#fff', transition: 'all .2s' }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: selected ? VERT : '#374151', margin: 0 }}>{label}</p>
      {sublabel && <p style={{ fontSize: 10, color: selected ? VERT : '#9CA3AF', margin: '3px 0 0' }}>{sublabel}</p>}
    </div>
  )
}
function Switch({ value, onChange }) {
  return (
    <button onClick={() => onChange(!value)} style={{ width: 48, height: 26, borderRadius: 13, background: value ? VERT : '#D1D5DB', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
      <div style={{ position: 'absolute', width: 20, height: 20, borderRadius: '50%', background: '#fff', top: 3, left: value ? 25 : 3, transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </button>
  )
}
function InputField({ icon, label, required, hint, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: '#9CA3AF', flexShrink: 0 }}>{icon}</span>
        <span style={{ fontSize: 10, fontWeight: 600, color: '#6B7280', letterSpacing: '0.04em' }}>
          {label}{required && <span style={{ color: '#EF4444', marginLeft: 2 }}>*</span>}
        </span>
      </div>
      <div style={{ padding: '0 14px 10px 36px' }}>{children}</div>
      {hint && <div style={{ padding: '0 14px 10px 36px', fontSize: 10, color: '#9CA3AF', fontStyle: 'italic' }}>{hint}</div>}
    </div>
  )
}
function GuideTailles({ onClose, tailleActive }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 480, maxHeight: '85vh', overflowY: 'auto', paddingBottom: 28 }}
        onClick={e => e.stopPropagation()}>
        <div style={{ width: 36, height: 3, background: '#E2E8F0', borderRadius: 2, margin: '14px auto 0' }} />
        <div style={{ padding: '14px 20px 0' }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>Guide des tailles</p>
          <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 16px' }}>Polo Camp-Navs 2026 · Mesures en centimètres</p>

          {/* SVG Polo */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <svg viewBox="0 0 220 240" width="180" height="200" style={{ overflow: 'visible' }}>
              {/* Corps du polo */}
              <path d="M75 55 L40 195 L180 195 L145 55" fill="#E8F5E8" stroke={VERT} strokeWidth="1.5" strokeLinejoin="round"/>
              {/* Manche gauche */}
              <path d="M75 55 L50 60 L18 105 L48 115 L70 80" fill="#E8F5E8" stroke={VERT} strokeWidth="1.5" strokeLinejoin="round"/>
              {/* Manche droite */}
              <path d="M145 55 L170 60 L202 105 L172 115 L150 80" fill="#E8F5E8" stroke={VERT} strokeWidth="1.5" strokeLinejoin="round"/>
              {/* Col polo gauche */}
              <path d="M75 55 Q85 45 100 42 Q115 45 145 55 Q130 58 118 55 Q110 75 102 78 Q94 75 86 55 Q80 57 75 55Z" fill="#C8E8C8" stroke={VERT} strokeWidth="1" strokeLinejoin="round"/>
              {/* Boutons placket */}
              <line x1="110" y1="58" x2="110" y2="85" stroke={VERT} strokeWidth="0.8" strokeDasharray="2,2"/>
              <circle cx="110" cy="62" r="2" fill={VERT}/>
              <circle cx="110" cy="70" r="2" fill={VERT}/>
              <circle cx="110" cy="78" r="2" fill={VERT}/>

              {/* Flèche A — Tour de poitrine (horizontal) */}
              <line x1="44" y1="110" x2="176" y2="110" stroke="#DC2626" strokeWidth="1.2"/>
              <polygon points="44,107 44,113 36,110" fill="#DC2626"/>
              <polygon points="176,107 176,113 184,110" fill="#DC2626"/>
              <rect x="96" y="103" width="28" height="14" rx="3" fill="#DC2626"/>
              <text x="110" y="113" textAnchor="middle" fontSize="8" fill="#fff" fontWeight="700">A</text>

              {/* Flèche B — Longueur (vertical) */}
              <line x1="198" y1="55" x2="198" y2="195" stroke="#1D4ED8" strokeWidth="1.2"/>
              <polygon points="195,55 201,55 198,47" fill="#1D4ED8"/>
              <polygon points="195,195 201,195 198,203" fill="#1D4ED8"/>
              <rect x="186" y="117" width="24" height="14" rx="3" fill="#1D4ED8"/>
              <text x="198" y="127" textAnchor="middle" fontSize="8" fill="#fff" fontWeight="700">B</text>
            </svg>
          </div>

          {/* Légende */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 14, justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 20, height: 8, background: '#DC2626', borderRadius: 4 }}/>
              <span style={{ fontSize: 11, color: '#374151' }}>A : Tour de poitrine</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 20, height: 8, background: '#1D4ED8', borderRadius: 4 }}/>
              <span style={{ fontSize: 11, color: '#374151' }}>B : Longueur</span>
            </div>
          </div>

          {/* Conseil mesure */}
          <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 10, padding: '8px 12px', marginBottom: 14 }}>
            <p style={{ fontSize: 11, color: '#92400E', margin: 0, lineHeight: 1.5 }}>
              💡 Mesurez le tour de poitrine horizontalement sous les aisselles. Si vous êtes entre deux tailles, choisissez la taille supérieure.
            </p>
          </div>

          {/* Tableau */}
          <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #E5E7EB' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr 1fr', background: VERT }}>
              {['Taille', 'A : Poitrine (cm)', 'B : Long. (cm)'].map(h => (
                <div key={h} style={{ padding: '8px 10px', fontSize: 10, fontWeight: 700, color: '#fff', textAlign: 'center' }}>{h}</div>
              ))}
            </div>
            {TAILLES_GUIDE.map((t, i) => (
              <div key={t.taille} style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr 1fr', background: tailleActive === t.taille ? VERT_CLAIR : i % 2 === 0 ? '#fff' : '#F9FAFB', borderTop: '1px solid #F3F4F6' }}>
                <div style={{ padding: '9px 10px', fontSize: 13, fontWeight: 700, color: tailleActive === t.taille ? VERT : '#374151', textAlign: 'center' }}>{t.taille}{tailleActive === t.taille && ' ✓'}</div>
                <div style={{ padding: '9px 10px', fontSize: 12, color: '#374151', textAlign: 'center' }}>{t.poitrine}</div>
                <div style={{ padding: '9px 10px', fontSize: 12, color: '#374151', textAlign: 'center' }}>{t.longueur}</div>
              </div>
            ))}
          </div>

          <button onClick={onClose} style={{ width: '100%', marginTop: 16, background: VERT, color: '#fff', border: 'none', borderRadius: 14, padding: '13px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
export default function InscriptionPage() {
  const navigate = useNavigate()
  const [inscriptionsOuvertes, setInscriptionsOuvertes] = useState(null)
  const [step, setStep] = useState(0)
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [erreur, setErreur] = useState('')
  const [copie, setCopie] = useState('')
  const [showGuide, setShowGuide] = useState(false)
  // Étape 1
  const [nomComplet, setNomComplet] = useState('')
  const [genre, setGenre] = useState('')
  const [statut, setStatut] = useState('')
  const [trancheAge, setTrancheAge] = useState('')
  const [ageExact, setAgeExact] = useState('')
  // Étape 2
  const [telephone, setTelephone] = useState('')
  const [occupation, setOccupation] = useState('')
  const [pays, setPays] = useState("Côte d'Ivoire")
  const [autresPays, setAutresPays] = useState('')
  const [ville, setVille] = useState('')
  const [commune, setCommune] = useState('')
  // Étape 3
  const [antecedents, setAntecedents] = useState('')
  const [dejaParticipe, setDejaParticipe] = useState(false)
  const [motivation, setMotivation] = useState('')
  // Étape 4
  const [tailleTshirt, setTailleTshirt] = useState('')
  const [nomUrgence, setNomUrgence] = useState('')
  const [telUrgence, setTelUrgence] = useState('')
  const [invite, setInvite] = useState(false)
  const [nomInviteur, setNomInviteur] = useState('')
  useEffect(() => {
    supabase.from('config_camp').select('inscriptions_ouvertes').limit(1).then(({ data }) => {
      if (data && data.length > 0) setInscriptionsOuvertes(data[0].inscriptions_ouvertes)
      else setInscriptionsOuvertes(true)
    })
  }, [])

  const isEnfant = statut === 'Enfant / Ado (0-15 ans)'
  const frais = isEnfant ? '25 000' : '30 000'
  const paysFinal = pays === 'Autre' ? autresPays : pays
  function copierNumero(num) {
    navigator.clipboard.writeText(num).catch(() => {})
    setCopie(num)
    setTimeout(() => setCopie(''), 2000)
  }
  function whatsappConfirmation() {
    const msg = `Bonjour Mme OBODJI, je viens de m'inscrire au Camp-Navs 2026.\n\nNom : ${nomComplet}\nTéléphone : ${telephone}\nCatégorie : ${statut}\nMontant à payer : ${frais} FCFA\n\nMerci !`
    window.open(`https://wa.me/225709626265?text=${encodeURIComponent(msg)}`, '_blank')
  }
  function validerEtape() {
    if (step === 0) {
      if (!nomComplet) { setErreur('Veuillez entrer votre nom et prénoms.'); return false }
      if (!genre) { setErreur('Veuillez sélectionner votre genre.'); return false }
      if (!statut) { setErreur('Veuillez sélectionner votre catégorie.'); return false }
      if (isEnfant && !ageExact) { setErreur("Veuillez entrer l'âge exact."); return false }
      if (!isEnfant && !trancheAge) { setErreur("Veuillez sélectionner votre tranche d'âge."); return false }
    }
    if (step === 1) {
      if (!telephone) { setErreur('Veuillez entrer votre numéro de téléphone.'); return false }
      if (!occupation) { setErreur('Veuillez entrer votre occupation / fonction.'); return false }
      if (pays === 'Autre' && !autresPays) { setErreur('Veuillez préciser votre pays.'); return false }
      if (!ville) { setErreur('Veuillez entrer votre ville.'); return false }
      if (!commune) { setErreur('Veuillez entrer votre commune ou quartier.'); return false }
    }
    if (step === 2) {
      if (!antecedents) { setErreur('Veuillez renseigner vos antécédents médicaux (ou écrire "Aucun").'); return false }
      if (!motivation) { setErreur('Veuillez entrer votre motivation.'); return false }
    }
    if (step === 3) {
      if (!tailleTshirt) { setErreur('Veuillez sélectionner votre taille de polo.'); return false }
      if (invite && !nomInviteur) { setErreur("Veuillez entrer le nom de la personne qui vous a invité."); return false }
    }
    setErreur('')
    return true
  }
  async function handleSubmit() {
    if (!nomComplet || !genre || !statut || !telephone) { setErreur('Veuillez remplir tous les champs obligatoires.'); return }
    setSending(true)
    const { error } = await supabase.from('inscriptions').insert([{
      nom_complet: nomComplet, telephone,
      tranche_age: isEnfant ? 'Enfants & Adolescents' : 'Jeunes & Adultes',
      statut_paiement: 'en attente', montant_paye: 0, genre,
      statut_participant: statut,
      tranche_age_detail: isEnfant ? `${ageExact} ans` : trancheAge,
      occupation, pays: paysFinal, ville, commune,
      lieu_habitation: `${commune}, ${ville}, ${paysFinal}`,
      antecedents_medicaux: antecedents,
      deja_participe: dejaParticipe ? 'Oui' : 'Non', motivation,
      taille_tshirt: tailleTshirt,
      contact_urgence: `${nomUrgence} — ${telUrgence}`,
      nom_urgence: nomUrgence, tel_urgence: telUrgence,
      invite: invite ? 'Oui' : 'Non',
      nom_inviteur: invite ? nomInviteur : '',
    }])
    setSending(false)
    if (error) setErreur('Une erreur est survenue. Réessayez.')
    else setDone(true)
  }
  if (done) {
    return (
      <div style={{ minHeight: '100vh', background: '#F0F7F0', maxWidth: 480, margin: '0 auto', padding: '32px 16px 40px' }}>
        <div style={{ background: VERT, borderRadius: 24, padding: '28px 20px', marginBottom: 16, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', width: 150, height: 150, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)', top: -40, right: -40 }} />
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', margin: '0 0 4px', letterSpacing: '0.06em' }}>INSCRIPTION CONFIRMÉE</p>
            <p style={{ fontSize: 20, fontWeight: 600, color: '#fff', margin: 0 }}>{nomComplet}</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: '4px 0 0' }}>{statut}</p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: '14px 16px', textAlign: 'center' }}>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', margin: '0 0 4px' }}>FRAIS DE PARTICIPATION</p>
            <p style={{ fontSize: 40, fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1 }}>{frais}</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: '4px 0 0' }}>FCFA</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 14 }}>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', margin: 0 }}>📅 23–29 août 2026</p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', margin: 0 }}>📍 La Sablière, Bingerville</p>
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #E5E7EB', padding: 18, marginBottom: 12 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#374151', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={OR} strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Comment payer ?
          </p>
          <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 12px', lineHeight: 1.6 }}>
            Envoyez <strong style={{ color: VERT }}>{frais} FCFA</strong> via Wave ou Orange Money :
          </p>
          {[{ label: 'Mme OBODJI (Trésorière)', num: '0709626265', affiche: '07 09 62 62 65' }].map(c => (
            <div key={c.num} style={{ background: '#F9FAFB', borderRadius: 12, padding: '10px 14px', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 10, color: '#9CA3AF', margin: 0 }}>{c.label}</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: VERT, margin: '2px 0 0' }}>{c.affiche}</p>
              </div>
              <button onClick={() => copierNumero(c.num)} style={{ background: copie === c.num ? VERT_CLAIR : '#fff', border: `1px solid ${copie === c.num ? VERT : '#E5E7EB'}`, borderRadius: 8, padding: '6px 12px', fontSize: 11, color: copie === c.num ? VERT : '#6B7280', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                {copie === c.num ? 'Copié !' : 'Copier'}
              </button>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button onClick={whatsappConfirmation} style={{ background: '#25D366', color: '#fff', border: 'none', borderRadius: 14, padding: '13px 8px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.859L.057 23.625a.5.5 0 00.612.612l5.766-1.476A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.9 0-3.7-.514-5.253-1.408l-.375-.223-3.886.995 1.013-3.786-.244-.388A9.955 9.955 0 012 12c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10z"/></svg>
            WhatsApp
          </button>
          <button onClick={() => navigate('/')} style={{ background: 'transparent', color: VERT, border: `1.5px solid ${VERT}`, borderRadius: 14, padding: '13px 8px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            Retour accueil
          </button>
        </div>
      </div>
    )
  }
  // Chargement config
  if (inscriptionsOuvertes === null) {
    return (
      <div style={{ minHeight: '100vh', background: '#F0F7F0', maxWidth: 480, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid #E2E8F0', borderTopColor: '#054035', animation: 'spin .8s linear infinite' }} />
      </div>
    )
  }

  // Inscriptions fermées
  if (!inscriptionsOuvertes) {
    return (
      <div style={{ minHeight: '100vh', background: '#F0F7F0', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <style>{'@keyframes spin { to { transform: rotate(360deg) } }'}</style>
        <div style={{ background: '#fff', borderRadius: 24, padding: '32px 24px', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', width: '100%' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="30" height="30" fill="none" viewBox="0 0 24 24" stroke="#DC2626" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
          </div>
          <p style={{ fontSize: 20, fontWeight: 700, color: '#1E293B', margin: '0 0 8px' }}>Inscriptions fermées</p>
          <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 20px', lineHeight: 1.6 }}>
            Les inscriptions au Camp-Navs 2026 sont temporairement fermées. Revenez plus tard ou contactez-nous pour plus d'informations.
          </p>
          <a href="https://wa.me/225709626265" target="_blank" rel="noreferrer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#25D366', color: '#fff', borderRadius: 12, padding: '12px 20px', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.859L.057 23.625a.5.5 0 00.612.612l5.766-1.476A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.9 0-3.7-.514-5.253-1.408l-.375-.223-3.886.995 1.013-3.786-.244-.388A9.955 9.955 0 012 12c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10z"/></svg>
            Nous contacter
          </a>
          <div style={{ marginTop: 16 }}>
            <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', fontSize: 12, color: '#94A3B8', cursor: 'pointer' }}>
              ← Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    )
  }

  const progress = ((step + 1) / STEPS.length) * 100
  const inputStyle = { width: '100%', border: 'none', outline: 'none', fontSize: 14, color: '#111827', background: 'transparent', lineHeight: 1.5 }
  return (
    <div style={{ minHeight: '100vh', background: '#F0F7F0', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
      {showGuide && <GuideTailles onClose={() => setShowGuide(false)} tailleActive={tailleTshirt} />}
      {/* Header */}
      <div style={{ background: VERT, padding: '44px 16px 20px', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ position: 'absolute', width: 130, height: 130, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.07)', top: -35, right: -35 }} />
        <button onClick={() => step > 0 ? setStep(s => s - 1) : navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.6)', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 14 }}>
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          Retour
        </button>
        <p style={{ fontSize: 18, fontWeight: 600, color: '#fff', margin: '0 0 2px' }}>Inscription Camp-Navs</p>
        <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', margin: '0 0 16px' }}>23–29 août 2026 · La Sablière · Bingerville</p>
        <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, height: 4, overflow: 'hidden', marginBottom: 8 }}>
          <div style={{ background: OR, borderRadius: 10, height: 4, width: `${progress}%`, transition: 'width .4s ease' }} />
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: i <= step ? OR : 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .3s' }}>
                {i < step ? <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                  : <span style={{ color: i === step ? '#fff' : 'rgba(255,255,255,0.4)', display: 'flex' }}>{s.icon}</span>}
              </div>
              <span style={{ fontSize: 8, color: i <= step ? OR : 'rgba(255,255,255,0.3)', fontWeight: i === step ? 600 : 400 }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Contenu */}
      <div style={{ flex: 1, padding: '14px 14px 110px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {step === 0 && (
          <>
            <InputField label="NOM & PRÉNOMS" required icon={<svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>}>
              <input type="text" placeholder="Ex : YAO Jean-Pierre" value={nomComplet} onChange={e => setNomComplet(e.target.value)} style={inputStyle} />
            </InputField>
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB', padding: '12px 14px' }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: '#6B7280', margin: '0 0 10px', letterSpacing: '0.04em' }}>GENRE <span style={{ color: '#EF4444' }}>*</span></p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <SelectCard label="Féminin" selected={genre === 'Féminin'} onClick={() => setGenre('Féminin')} />
                <SelectCard label="Masculin" selected={genre === 'Masculin'} onClick={() => setGenre('Masculin')} />
              </div>
            </div>
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB', padding: '12px 14px' }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: '#6B7280', margin: '0 0 10px', letterSpacing: '0.04em' }}>CATÉGORIE <span style={{ color: '#EF4444' }}>*</span></p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <SelectCard label="Enfant / Ado" sublabel="0–15 ans · 25 000 FCFA" selected={statut === 'Enfant / Ado (0-15 ans)'} onClick={() => { setStatut('Enfant / Ado (0-15 ans)'); setTrancheAge(''); setAgeExact('') }} />
                <SelectCard label="Jeune / Adulte" sublabel="16 ans et + · 30 000 FCFA" selected={statut === 'Jeune / Adulte (+15 ans)'} onClick={() => { setStatut('Jeune / Adulte (+15 ans)'); setAgeExact(''); setTrancheAge('') }} />
              </div>
              {statut && (
                <div style={{ marginTop: 10, background: VERT_CLAIR, borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: VERT }}>Frais à payer</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: VERT }}>{frais} FCFA</span>
                </div>
              )}
            </div>
            {isEnfant && (
              <InputField label="ÂGE EXACT" required icon={<svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>}>
                <input type="number" inputMode="numeric" placeholder="Ex : 12" min="0" max="15" value={ageExact} onChange={e => setAgeExact(e.target.value)} style={inputStyle} />
              </InputField>
            )}
            {statut === 'Jeune / Adulte (+15 ans)' && (
              <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB', padding: '12px 14px' }}>
                <p style={{ fontSize: 10, fontWeight: 600, color: '#6B7280', margin: '0 0 10px', letterSpacing: '0.04em' }}>TRANCHE D'ÂGE <span style={{ color: '#EF4444' }}>*</span></p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {TRANCHES_ADULTE.map(a => (<SelectCard key={a} label={a} selected={trancheAge === a} onClick={() => setTrancheAge(a)} />))}
                </div>
              </div>
            )}
          </>
        )}
        {step === 1 && (
          <>
            <InputField label="TÉLÉPHONE" required hint="Un numéro WhatsApp de préférence" icon={<svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>}>
              <input type="tel" inputMode="numeric" placeholder="07 XX XX XX XX" value={telephone} onChange={e => setTelephone(e.target.value)} style={inputStyle} />
            </InputField>
            <InputField label="OCCUPATION / FONCTION" required icon={<svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>}>
              <input type="text" placeholder="Ex : Étudiant, Enseignant, Commerçant..." value={occupation} onChange={e => setOccupation(e.target.value)} style={inputStyle} />
            </InputField>
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB', padding: '12px 14px' }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: '#6B7280', margin: '0 0 10px', letterSpacing: '0.04em' }}>PAYS <span style={{ color: '#EF4444' }}>*</span></p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: pays === 'Autre' ? 10 : 0 }}>
                <SelectCard label="Côte d'Ivoire" selected={pays === "Côte d'Ivoire"} onClick={() => setPays("Côte d'Ivoire")} />
                <SelectCard label="Autre pays" selected={pays === 'Autre'} onClick={() => setPays('Autre')} />
              </div>
              {pays === 'Autre' && <input type="text" placeholder="Précisez votre pays" value={autresPays} onChange={e => setAutresPays(e.target.value)} style={{ ...inputStyle, border: '1px solid #E5E7EB', borderRadius: 10, padding: '10px 12px', marginTop: 4 }} />}
            </div>
            <InputField label="VILLE" required icon={<svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>}>
              <input type="text" placeholder="Ex : Abidjan, Bouaké, Yamoussoukro..." value={ville} onChange={e => setVille(e.target.value)} style={inputStyle} />
            </InputField>
            <InputField label="COMMUNE / QUARTIER" required icon={<svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6"/></svg>}>
              <input type="text" placeholder="Ex : Cocody, Yopougon, Abobo..." value={commune} onChange={e => setCommune(e.target.value)} style={inputStyle} />
            </InputField>
          </>
        )}
        {step === 2 && (
          <>
            <InputField label="ANTÉCÉDENTS MÉDICAUX" required hint="Ces informations sont strictement confidentielles." icon={<svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>}>
              <textarea placeholder={'Allergies, asthme, etc. Écrire "Aucun" si rien.'} value={antecedents} onChange={e => setAntecedents(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'none' }} />
            </InputField>
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB', padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: '#111827', margin: 0 }}>Déjà participé à un camp Navigateurs ?</p>
                  <p style={{ fontSize: 10, color: '#9CA3AF', margin: '3px 0 0' }}>{dejaParticipe ? 'Oui, ancien campeur' : 'Non, première fois'}</p>
                </div>
                <Switch value={dejaParticipe} onChange={setDejaParticipe} />
              </div>
            </div>
            <InputField label="MOTIVATION" required icon={<svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>}>
              <textarea placeholder="Pourquoi souhaitez-vous participer ?" value={motivation} onChange={e => setMotivation(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'none' }} />
            </InputField>
          </>
        )}
        {step === 3 && (
          <>
            {/* Taille de polo */}
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB', padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <p style={{ fontSize: 10, fontWeight: 600, color: '#6B7280', margin: 0, letterSpacing: '0.04em' }}>
                  TAILLE DE POLO <span style={{ color: '#EF4444' }}>*</span>
                </p>
                <button type="button" onClick={() => setShowGuide(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: VERT, background: VERT_CLAIR, border: `1px solid ${VERT}`, borderRadius: 20, padding: '3px 10px', cursor: 'pointer' }}>
                  <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                  Guide des tailles
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 8 }}>
                {POLO_SIZES.map(s => (
                  <div key={s} onClick={() => setTailleTshirt(s)}
                    style={{ border: `2px solid ${tailleTshirt === s ? VERT : '#E5E7EB'}`, borderRadius: 12, padding: '12px 4px', cursor: 'pointer', textAlign: 'center', background: tailleTshirt === s ? VERT_CLAIR : '#fff', transition: 'all .2s' }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: tailleTshirt === s ? VERT : '#374151', margin: 0 }}>{s}</p>
                  </div>
                ))}
              </div>
              {tailleTshirt && (
                <div style={{ background: VERT_CLAIR, borderRadius: 8, padding: '6px 12px', fontSize: 11, color: VERT, fontWeight: 500 }}>
                  Taille sélectionnée : {tailleTshirt} · {TAILLES_GUIDE.find(t => t.taille === tailleTshirt)?.poitrine} cm de poitrine
                </div>
              )}
            </div>
            {/* Contact urgence */}
            <div style={{ background: '#fff', borderRadius: 14, border: `2px solid ${OR}`, padding: '14px' }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: '#92400E', margin: '0 0 8px', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}>
                <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke={OR} strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                CONTACT D'URGENCE
              </p>
              <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 10px' }}>Personne à contacter en cas d'urgence médicale</p>
              <input type="text" placeholder="Nom complet de la personne" value={nomUrgence} onChange={e => setNomUrgence(e.target.value)} style={{ ...inputStyle, border: '1px solid #E5E7EB', borderRadius: 10, padding: '10px 12px', marginBottom: 8 }} />
              <input type="tel" inputMode="numeric" placeholder="Numéro de téléphone" value={telUrgence} onChange={e => setTelUrgence(e.target.value)} style={{ ...inputStyle, border: '1px solid #E5E7EB', borderRadius: 10, padding: '10px 12px' }} />
            </div>
            {/* Invité */}
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E5E7EB', padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: invite ? 12 : 0 }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: '#111827', margin: 0 }}>Avez-vous été invité ?</p>
                  <p style={{ fontSize: 10, color: '#9CA3AF', margin: '3px 0 0' }}>{invite ? "Oui, j'ai été invité" : 'Non, inscription personnelle'}</p>
                </div>
                <Switch value={invite} onChange={setInvite} />
              </div>
              {invite && <input type="text" placeholder="Nom de la personne qui vous a invité" value={nomInviteur} onChange={e => setNomInviteur(e.target.value)} style={{ ...inputStyle, border: '1px solid #E5E7EB', borderRadius: 10, padding: '10px 12px' }} />}
            </div>
          </>
        )}
      </div>
      {/* Navigation fixe */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: 480, margin: '0 auto', background: '#fff', borderTop: '0.5px solid #E5E7EB', padding: '8px 14px 12px', display: 'flex', flexDirection: 'column', gap: 8, zIndex: 30 }}>
        {erreur && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '8px 12px' }}>
            <p style={{ fontSize: 12, color: '#DC2626', margin: 0 }}>{erreur}</p>
          </div>
        )}
        <div style={{ display: 'flex', gap: 10 }}>
          {step > 0 && (
            <button onClick={() => setStep(s => s - 1)} style={{ background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 14, padding: '14px 18px', fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
              Retour
            </button>
          )}
          <button onClick={() => { if (!validerEtape()) return; step < STEPS.length - 1 ? setStep(s => s + 1) : handleSubmit() }} disabled={sending}
            style={{ flex: 1, background: step === STEPS.length - 1 ? OR : VERT, color: '#fff', border: 'none', borderRadius: 14, padding: '14px', fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: sending ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {sending ? 'Envoi en cours...' : step < STEPS.length - 1
              ? <><span>Continuer</span><svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg></>
              : <><svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg><span>Valider mon inscription</span></>
            }
          </button>
        </div>
      </div>
    </div>
  )
}
