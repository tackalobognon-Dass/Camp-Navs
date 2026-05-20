import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const TSHIRT_SIZES = [
  { label: 'XS', desc: 'Très petit', w: 28 },
  { label: 'S', desc: 'Petit', w: 32 },
  { label: 'M', desc: 'Moyen', w: 36 },
  { label: 'L', desc: 'Grand', w: 40 },
  { label: 'XL', desc: 'Très grand', w: 44 },
  { label: 'XXL', desc: 'Extra large', w: 48 },
  { label: 'XXXL', desc: '3X large', w: 52 },
]

function TshirtIcon({ w = 40, color = '#085041' }) {
  return (
    <svg viewBox="0 0 60 60" style={{ width: w, height: w * 0.9 }}>
      <path d="M10,8 L22,4 L22,8 Q30,14 38,8 L38,4 L50,8 L54,22 L44,22 L44,56 L16,56 L16,22 L6,22 Z" fill={color} />
      <path d="M22,4 Q30,10 38,4" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
    </svg>
  )
}

function FieldCard({ label, hint, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #e5e5e0', padding: '12px' }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: '#085041', marginBottom: 8 }}>{label}</div>
      {children}
      {hint && <div style={{ fontSize: 9, color: '#888', marginTop: 5 }}>{hint}</div>}
    </div>
  )
}

function ChoiceBtn({ emoji, text, selected, onClick }) {
  return (
    <div onClick={onClick} style={{
      border: `0.5px solid ${selected ? '#085041' : '#e5e5e0'}`,
      borderRadius: 12, padding: '10px 8px', cursor: 'pointer', textAlign: 'center',
      background: selected ? '#085041' : '#fff', transition: 'all .2s',
    }}>
      <div style={{ fontSize: 20, marginBottom: 4 }}>{emoji}</div>
      <div style={{ fontSize: 10, fontWeight: 500, color: selected ? '#fff' : '#444' }}>{text}</div>
    </div>
  )
}

function AgeBtn({ label, selected, onClick }) {
  return (
    <div onClick={onClick} style={{
      border: `0.5px solid ${selected ? '#0F6E56' : '#e5e5e0'}`,
      borderRadius: 10, padding: '8px', cursor: 'pointer', textAlign: 'center',
      background: selected ? '#0F6E56' : '#fff', transition: 'all .2s',
    }}>
      <div style={{ fontSize: 10, fontWeight: 500, color: selected ? '#fff' : '#555' }}>{label}</div>
    </div>
  )
}

const STEPS = [
  { emoji: '👤', label: 'Identité', color: '#085041' },
  { emoji: '📱', label: 'Coordonnées', color: '#0F6E56' },
  { emoji: '🏥', label: 'Santé', color: '#185FA5' },
  { emoji: '👕', label: 'Pratique', color: '#854F0B' },
]

export default function InscriptionPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [erreur, setErreur] = useState('')

  const [nomComplet, setNomComplet] = useState('')
  const [genre, setGenre] = useState('')
  const [statut, setStatut] = useState('')
  const [trancheAge, setTrancheAge] = useState('')
  const [telephone, setTelephone] = useState('')
  const [occupation, setOccupation] = useState('')
  const [lieuHabitation, setLieuHabitation] = useState('')
  const [antecedents, setAntecedents] = useState('')
  const [dejaParticipe, setDejaParticipe] = useState('')
  const [motivation, setMotivation] = useState('')
  const [tailleTshirt, setTailleTshirt] = useState('')
  const [contactUrgence, setContactUrgence] = useState('')
  const [invite, setInvite] = useState('')

  const frais = statut === 'Enfant / Ado (0-15 ans)' ? '25 000' : '30 000'

  async function handleSubmit() {
    if (!nomComplet || !genre || !statut || !telephone) {
      setErreur('Veuillez remplir tous les champs obligatoires.')
      return
    }
    setSending(true)
    const { error } = await supabase.from('inscriptions').insert([{
      nom_complet: nomComplet,
      telephone,
      tranche_age: statut === 'Enfant / Ado (0-15 ans)' ? 'Enfants & Adolescents' : 'Jeunes & Adultes',
      statut_paiement: 'en attente',
      montant_paye: 0,
      genre,
      statut_participant: statut,
      tranche_age_detail: trancheAge,
      occupation,
      lieu_habitation: lieuHabitation,
      antecedents_medicaux: antecedents,
      deja_participe: dejaParticipe,
      motivation,
      taille_tshirt: tailleTshirt,
      contact_urgence: contactUrgence,
      invite,
    }])
    setSending(false)
    if (error) setErreur('Une erreur est survenue. Réessayez.')
    else setDone(true)
  }

  if (done) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f8f6', maxWidth: 480, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ background: '#fff', borderRadius: 24, border: '0.5px solid #e5e5e0', padding: '32px 24px', textAlign: 'center', width: '100%' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
          <div style={{ fontSize: 20, fontWeight: 600, color: '#085041', marginBottom: 8 }}>
            Félicitations {nomComplet.split(' ')[0]} !
          </div>
          <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6, marginBottom: 20 }}>
            Votre inscription au <strong>Camp-Navs 2026</strong> a bien été enregistrée.
          </div>

          <div style={{ background: '#E1F5EE', borderRadius: 16, padding: 16, marginBottom: 14, textAlign: 'left' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#085041', marginBottom: 6 }}>💰 Frais de participation</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#085041', marginBottom: 2 }}>{frais} FCFA</div>
            <div style={{ fontSize: 10, color: '#0F6E56' }}>
              {statut === 'Enfant / Ado (0-15 ans)' ? 'Tarif Enfants & Adolescents' : 'Tarif Jeunes & Adultes'}
            </div>
          </div>

          <div style={{ background: '#FAEEDA', borderRadius: 16, padding: 16, marginBottom: 20, textAlign: 'left' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#854F0B', marginBottom: 10 }}>📲 Comment payer ?</div>
            <div style={{ fontSize: 11, color: '#6B3D00', lineHeight: 1.7 }}>
              Envoyez le paiement via <strong>Wave</strong> ou <strong>Orange Money</strong> :
            </div>
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ background: '#fff', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>Bureau des Navigateurs</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#085041' }}>07 78 48 48 79</div>
              </div>
              <div style={{ background: '#fff', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>Mme OBODJI</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#085041' }}>07 09 62 62 65</div>
              </div>
            </div>
            <div style={{ fontSize: 10, color: '#854F0B', marginTop: 10, fontStyle: 'italic' }}>
              Après paiement, confirmez par WhatsApp en envoyant votre nom complet et votre reçu.
            </div>
          </div>

          <div style={{ fontSize: 11, color: '#888', lineHeight: 1.8, marginBottom: 20 }}>
            📅 Camp-Navs 2026 · 23 – 29 août<br />
            📍 La Sablière · Bingerville
          </div>

          <button onClick={() => navigate('/')} style={{
            width: '100%', background: '#085041', color: '#fff', border: 'none',
            borderRadius: 14, padding: 14, fontSize: 14, fontWeight: 500, cursor: 'pointer'
          }}>
            Retour à l'accueil
          </button>
        </div>
      </div>
    )
  }

  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <div style={{ minHeight: '100vh', background: '#f8f8f6', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column' }}>

      {/* HERO */}
      <div style={{ background: `linear-gradient(160deg,#054035,${STEPS[step].color})`, padding: '44px 16px 20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: 120, height: 120, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)', top: -30, right: -30 }} />
        <button onClick={() => step > 0 ? setStep(s => s - 1) : navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.7)', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 12 }}>
          ← Retour
        </button>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '4px 12px', fontSize: 10, color: '#9FE1CB', marginBottom: 8 }}>
          <span style={{ fontSize: 14 }}>{STEPS[step].emoji}</span> {STEPS[step].label}
        </div>
        <div style={{ fontSize: 17, fontWeight: 600, color: '#fff', marginBottom: 2 }}>Inscription Camp-Navs 2026</div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.65)' }}>23–29 août · La Sablière · Bingerville</div>
        <div style={{ marginTop: 14 }}>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, height: 4, overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(90deg,#9FE1CB,#fff)', borderRadius: 10, height: 4, width: `${progress}%`, transition: 'width .4s ease' }} />
          </div>
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>Étape {step + 1} sur {STEPS.length}</div>
        </div>
      </div>

      {/* Dots */}
      <div style={{ display: 'flex', gap: 5, justifyContent: 'center', padding: '10px 0 4px' }}>
        {STEPS.map((_, i) => (
          <div key={i} style={{ height: 5, borderRadius: 3, background: i === step ? '#085041' : '#ddd', width: i === step ? 18 : 5, transition: 'all .3s' }} />
        ))}
      </div>

      {/* ÉTAPE 1 */}
      {step === 0 && (
        <div style={{ flex: 1, padding: '8px 14px 100px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <FieldCard label="👤 Nom & Prénoms *">
            <input
              type="text"
              placeholder="Ex : YAO Jean-Pierre"
              value={nomComplet}
              onChange={e => setNomComplet(e.target.value)}
              style={{ width: '100%', border: 'none', outline: 'none', fontSize: 13, color: '#1a1a1a', background: 'transparent' }}
            />
          </FieldCard>

          <FieldCard label="⚥ Genre *">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
              <ChoiceBtn emoji="👩" text="Féminin" selected={genre === 'Féminin'} onClick={() => setGenre('Féminin')} />
              <ChoiceBtn emoji="👨" text="Masculin" selected={genre === 'Masculin'} onClick={() => setGenre('Masculin')} />
            </div>
          </FieldCard>

          <FieldCard label="🎂 Statut *">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
              <ChoiceBtn emoji="🧒" text="Enfant / Ado (0-15 ans)" selected={statut === 'Enfant / Ado (0-15 ans)'} onClick={() => setStatut('Enfant / Ado (0-15 ans)')} />
              <ChoiceBtn emoji="🧑" text="Jeune / Adulte (+15 ans)" selected={statut === 'Jeune / Adulte (+15 ans)'} onClick={() => setStatut('Jeune / Adulte (+15 ans)')} />
            </div>
            {statut && (
              <div style={{ marginTop: 8, background: '#E1F5EE', borderRadius: 8, padding: '6px 10px', fontSize: 10, color: '#085041', fontWeight: 500 }}>
                Frais : {statut === 'Enfant / Ado (0-15 ans)' ? '25 000' : '30 000'} FCFA
              </div>
            )}
          </FieldCard>

          <FieldCard label="📊 Tranche d'âge *">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 4 }}>
              {['30 ans et +', '20 – 29 ans', '16 – 19 ans', '11 – 15 ans', '10 ans et –'].map(a => (
                <AgeBtn key={a} label={a} selected={trancheAge === a} onClick={() => setTrancheAge(a)} />
              ))}
            </div>
          </FieldCard>
        </div>
      )}

      {/* ÉTAPE 2 */}
      {step === 1 && (
        <div style={{ flex: 1, padding: '8px 14px 100px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <FieldCard label="📱 Numéro de téléphone *" hint="Un numéro WhatsApp de préférence">
            <input
              type="tel"
              placeholder="07 XX XX XX XX"
              value={telephone}
              onChange={e => setTelephone(e.target.value)}
              style={{ width: '100%', border: 'none', outline: 'none', fontSize: 13, color: '#1a1a1a', background: 'transparent' }}
            />
          </FieldCard>

          <FieldCard label="💼 Occupation *">
            <textarea
              placeholder="Que faites-vous dans la vie ?"
              value={occupation}
              onChange={e => setOccupation(e.target.value)}
              rows={3}
              style={{ width: '100%', border: 'none', outline: 'none', fontSize: 13, color: '#1a1a1a', background: 'transparent', resize: 'none', lineHeight: 1.5 }}
            />
          </FieldCard>

          <FieldCard label="📍 Lieu d'habitation *">
            <input
              type="text"
              placeholder="Votre quartier / commune / ville"
              value={lieuHabitation}
              onChange={e => setLieuHabitation(e.target.value)}
              style={{ width: '100%', border: 'none', outline: 'none', fontSize: 13, color: '#1a1a1a', background: 'transparent' }}
            />
          </FieldCard>
        </div>
      )}

      {/* ÉTAPE 3 */}
      {step === 2 && (
        <div style={{ flex: 1, padding: '8px 14px 100px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <FieldCard label="🏥 Antécédents médicaux *" hint={`Allergies, asthme, etc. Écrire "Aucun" si pas d'antécédents.`}>
            <textarea
              placeholder={`Écrire "Aucun" si pas d'antécédents médicaux.`}
              value={antecedents}
              onChange={e => setAntecedents(e.target.value)}
              rows={3}
              style={{ width: '100%', border: 'none', outline: 'none', fontSize: 13, color: '#1a1a1a', background: 'transparent', resize: 'none', lineHeight: 1.5 }}
            />
          </FieldCard>

          <FieldCard label="⛺ Déjà participé à un camp des Navigateurs ? *">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
              <ChoiceBtn emoji="✅" text="Oui" selected={dejaParticipe === 'Oui'} onClick={() => setDejaParticipe('Oui')} />
              <ChoiceBtn emoji="🙂" text="Non" selected={dejaParticipe === 'Non'} onClick={() => setDejaParticipe('Non')} />
            </div>
          </FieldCard>

          <FieldCard label="💬 Pourquoi souhaitez-vous participer ? *">
            <textarea
              placeholder="En quelques mots, dites-nous pourquoi..."
              value={motivation}
              onChange={e => setMotivation(e.target.value)}
              rows={4}
              style={{ width: '100%', border: 'none', outline: 'none', fontSize: 13, color: '#1a1a1a', background: 'transparent', resize: 'none', lineHeight: 1.5 }}
            />
          </FieldCard>
        </div>
      )}

      {/* ÉTAPE 4 */}
      {step === 3 && (
        <div style={{ flex: 1, padding: '8px 14px 100px', display: 'flex', flexDirection: 'column', gap: 10 }}>

          <FieldCard label="👕 Taille de T-shirt *">
            <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
              <div style={{ display: 'flex', gap: 8, paddingTop: 8, minWidth: 'max-content' }}>
                {TSHIRT_SIZES.map(s => (
                  <div key={s.label} onClick={() => setTailleTshirt(s.label)}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', padding: '8px 6px', borderRadius: 12,
                      background: tailleTshirt === s.label ? '#E1F5EE' : 'transparent', transition: 'all .2s' }}>
                    <TshirtIcon w={s.w} color={tailleTshirt === s.label ? '#085041' : '#ccc'} />
                    <div style={{ fontSize: 11, fontWeight: 600, color: tailleTshirt === s.label ? '#085041' : '#888' }}>{s.label}</div>
                    <div style={{ fontSize: 8, color: '#aaa' }}>{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>
            {tailleTshirt && (
              <div style={{ marginTop: 6, background: '#E1F5EE', borderRadius: 8, padding: '6px 10px', fontSize: 10, color: '#085041', fontWeight: 500 }}>
                Taille sélectionnée : {tailleTshirt}
              </div>
            )}
          </FieldCard>

          <FieldCard label="🚨 Contact d'urgence *">
            <input
              type="text"
              placeholder="Ex : Jean Martin, 07 89 78 88 98"
              value={contactUrgence}
              onChange={e => setContactUrgence(e.target.value)}
              style={{ width: '100%', border: 'none', outline: 'none', fontSize: 13, color: '#1a1a1a', background: 'transparent' }}
            />
          </FieldCard>

          <FieldCard label="🎟 Avez-vous été invité ? *">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
              <ChoiceBtn emoji="🎉" text="Oui" selected={invite === 'Oui'} onClick={() => setInvite('Oui')} />
              <ChoiceBtn emoji="🙂" text="Non" selected={invite === 'Non'} onClick={() => setInvite('Non')} />
            </div>
          </FieldCard>

          {erreur && (
            <div style={{ background: '#FCEBEB', border: '0.5px solid #F09595', borderRadius: 12, padding: '10px 14px' }}>
              <p style={{ fontSize: 12, color: '#A32D2D' }}>{erreur}</p>
            </div>
          )}
        </div>
      )}

      {/* NAVIGATION */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: 480, margin: '0 auto', background: '#fff', borderTop: '0.5px solid #e5e5e0', padding: '10px 14px', display: 'flex', gap: 8, zIndex: 30 }}>
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)}
            style={{ background: '#f5f5f3', color: '#666', border: 'none', borderRadius: 12, padding: '12px 16px', fontSize: 13, cursor: 'pointer' }}>
            ← Retour
          </button>
        )}
        <button
          onClick={() => step < STEPS.length - 1 ? setStep(s => s + 1) : handleSubmit()}
          disabled={sending}
          style={{ flex: 1, background: '#085041', color: '#fff', border: 'none', borderRadius: 12, padding: 12, fontSize: 13, fontWeight: 500, cursor: 'pointer', opacity: sending ? 0.6 : 1 }}>
          {sending ? 'Envoi...' : step < STEPS.length - 1 ? 'Continuer →' : '✓ Valider mon inscription'}
        </button>
      </div>
    </div>
  )
}
