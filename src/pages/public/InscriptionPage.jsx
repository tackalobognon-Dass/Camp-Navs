import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const TSHIRT_SIZES = [
  { label: 'XS', desc: 'Très petit', width: 28 },
  { label: 'S', desc: 'Petit', width: 32 },
  { label: 'M', desc: 'Moyen', width: 36 },
  { label: 'L', desc: 'Grand', width: 40 },
  { label: 'XL', desc: 'Très grand', width: 44 },
  { label: 'XXL', desc: 'Extra large', width: 48 },
  { label: 'XXXL', desc: '3X large', width: 52 },
]

function TshirtIcon({ width = 40, color = '#085041', opacity = 1 }) {
  return (
    <svg viewBox="0 0 60 60" style={{ width, height: width * 0.9, opacity }}>
      <path d="M10,8 L22,4 L22,8 Q30,14 38,8 L38,4 L50,8 L54,22 L44,22 L44,56 L16,56 L16,22 L6,22 Z"
        fill={color} rx="2" />
      <path d="M22,4 Q30,10 38,4" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
    </svg>
  )
}

const steps = [
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

  const [form, setForm] = useState({
    nom_complet: '',
    genre: '',
    statut_participant: '',
    tranche_age_detail: '',
    telephone: '',
    occupation: '',
    lieu_habitation: '',
    antecedents_medicaux: '',
    deja_participe: '',
    motivation: '',
    taille_tshirt: '',
    contact_urgence: '',
    invite: '',
  })

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }))
  }

  const frais = form.statut_participant === 'Enfant / Ado (0-15 ans)' ? '25 000' : '30 000'

  async function handleSubmit() {
    if (!form.nom_complet || !form.genre || !form.statut_participant || !form.telephone) {
      setErreur('Veuillez remplir tous les champs obligatoires.')
      return
    }
    setSending(true)
    const { error } = await supabase.from('inscriptions').insert([{
      nom_complet: form.nom_complet,
      telephone: form.telephone,
      tranche_age: form.statut_participant === 'Enfant / Ado (0-15 ans)' ? 'Enfants & Adolescents' : 'Jeunes & Adultes',
      statut_paiement: 'en attente',
      montant_paye: 0,
      genre: form.genre,
      statut_participant: form.statut_participant,
      tranche_age_detail: form.tranche_age_detail,
      occupation: form.occupation,
      lieu_habitation: form.lieu_habitation,
      antecedents_medicaux: form.antecedents_medicaux,
      deja_participe: form.deja_participe,
      motivation: form.motivation,
      taille_tshirt: form.taille_tshirt,
      contact_urgence: form.contact_urgence,
      invite: form.invite,
    }])
    setSending(false)
    if (error) setErreur('Une erreur est survenue. Réessayez.')
    else setDone(true)
  }

  if (done) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8f8f6', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ background: '#fff', borderRadius: 24, border: '0.5px solid #e5e5e0', padding: '32px 24px', textAlign: 'center', width: '100%' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
          <div style={{ fontSize: 20, fontWeight: 600, color: '#085041', marginBottom: 8 }}>Félicitations {form.nom_complet.split(' ')[0]} !</div>
          <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6, marginBottom: 20 }}>
            Votre inscription au <strong>Camp-Navs 2026</strong> a bien été enregistrée.
          </div>

          <div style={{ background: '#E1F5EE', borderRadius: 16, padding: '16px', marginBottom: 16, textAlign: 'left' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#085041', marginBottom: 8 }}>💰 Frais de participation</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#085041', marginBottom: 4 }}>{frais} FCFA</div>
            <div style={{ fontSize: 11, color: '#0F6E56' }}>
              {form.statut_participant === 'Enfant / Ado (0-15 ans)' ? 'Tarif Enfants & Adolescents' : 'Tarif Jeunes & Adultes'}
            </div>
          </div>

          <div style={{ background: '#FAEEDA', borderRadius: 16, padding: '16px', marginBottom: 20, textAlign: 'left' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#854F0B', marginBottom: 10 }}>📲 Comment payer ?</div>
            <div style={{ fontSize: 11, color: '#6B3D00', lineHeight: 1.7 }}>
              Envoyez le paiement via <strong>Wave</strong> ou <strong>Orange Money</strong> à l'un de ces numéros :
            </div>
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ background: '#fff', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>Bureau des Navigateurs</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#085041' }}>07 78 48 48 79</div>
              </div>
              <div style={{ background: '#fff', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>Mme OBODJI</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#085041' }}>07 09 62 62 65</div>
              </div>
            </div>
            <div style={{ fontSize: 10, color: '#854F0B', marginTop: 10, fontStyle: 'italic' }}>
              Après paiement, confirmez par WhatsApp en envoyant votre nom et votre reçu.
            </div>
          </div>

          <div style={{ fontSize: 11, color: '#888', lineHeight: 1.6, marginBottom: 20 }}>
            📅 Camp-Navs 2026 · 23 – 29 août<br />
            📍 La Sablière · Bingerville
          </div>

          <button onClick={() => navigate('/')} style={{ width: '100%', background: '#085041', color: '#fff', border: 'none', borderRadius: 14, padding: '14px', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>
            Retour à l'accueil
          </button>
        </div>
      </div>
    )
  }

  const progress = ((step + 1) / steps.length) * 100

  const ChoiceBtn = ({ val, selected, onClick, emoji, text }) => (
    <div onClick={onClick} style={{
      border: `0.5px solid ${selected ? '#085041' : '#e5e5e0'}`,
      borderRadius: 12, padding: '10px 8px', cursor: 'pointer', textAlign: 'center',
      background: selected ? '#085041' : '#fff', transition: 'all .2s',
    }}>
      <div style={{ fontSize: 20, marginBottom: 4 }}>{emoji}</div>
      <div style={{ fontSize: 10, fontWeight: 500, color: selected ? '#fff' : '#444' }}>{text}</div>
    </div>
  )

  const AgeBtn = ({ label, selected, onClick }) => (
    <div onClick={onClick} style={{
      border: `0.5px solid ${selected ? '#0F6E56' : '#e5e5e0'}`,
      borderRadius: 10, padding: '8px', cursor: 'pointer', textAlign: 'center',
      background: selected ? '#0F6E56' : '#fff', transition: 'all .2s',
    }}>
      <div style={{ fontSize: 10, fontWeight: 500, color: selected ? '#fff' : '#555' }}>{label}</div>
    </div>
  )

  const Field = ({ label, children, hint }) => (
    <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #e5e5e0', padding: '12px' }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: '#085041', marginBottom: 8 }}>{label}</div>
      {children}
      {hint && <div style={{ fontSize: 9, color: '#888', marginTop: 5 }}>{hint}</div>}
    </div>
  )

  const Input = ({ placeholder, value, onChange, type = 'text' }) => (
    <input type={type} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)}
      style={{ width: '100%', border: 'none', outline: 'none', fontSize: 12, color: '#1a1a1a', background: 'transparent', padding: 0 }} />
  )

  const Textarea = ({ placeholder, value, onChange }) => (
    <textarea placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} rows={3}
      style={{ width: '100%', border: 'none', outline: 'none', fontSize: 12, color: '#1a1a1a', background: 'transparent', resize: 'none', lineHeight: 1.5, padding: 0 }} />
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f8f8f6', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column' }}>

      {/* Hero */}
      <div style={{ background: `linear-gradient(160deg,#054035,${steps[step].color})`, padding: '44px 16px 20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', width: 120, height: 120, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)', top: -30, right: -30 }} />
        <button onClick={() => step > 0 ? setStep(s => s - 1) : navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.7)', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 12 }}>
          ← Retour
        </button>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: '4px 12px', fontSize: 10, color: '#9FE1CB', marginBottom: 8 }}>
          <span style={{ fontSize: 14 }}>{steps[step].emoji}</span> {steps[step].label}
        </div>
        <div style={{ fontSize: 17, fontWeight: 600, color: '#fff', marginBottom: 2 }}>Inscription Camp-Navs 2026</div>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.65)' }}>23–29 août · La Sablière · Bingerville</div>
        <div style={{ marginTop: 14 }}>
          <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 10, height: 4, overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(90deg,#9FE1CB,#fff)', borderRadius: 10, height: 4, width: `${progress}%`, transition: 'width .4s ease' }} />
          </div>
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>Étape {step + 1} sur {steps.length}</div>
        </div>
      </div>

      {/* Dots */}
      <div style={{ display: 'flex', gap: 5, justifyContent: 'center', padding: '10px 0 4px' }}>
        {steps.map((_, i) => (
          <div key={i} style={{ height: 5, borderRadius: 3, background: i === step ? '#085041' : '#ddd', width: i === step ? 18 : 5, transition: 'all .3s' }} />
        ))}
      </div>

      {/* Contenu */}
      <div style={{ flex: 1, padding: '8px 14px 100px', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {step === 0 && (
          <>
            <Field label="👤 Nom & Prénoms *">
              <Input placeholder="Ex : YAO Jean-Pierre" value={form.nom_complet} onChange={v => set('nom_complet', v)} />
            </Field>

            <Field label="⚥ Genre *">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
                <ChoiceBtn emoji="👩" text="Féminin" selected={form.genre === 'Féminin'} onClick={() => set('genre', 'Féminin')} />
                <ChoiceBtn emoji="👨" text="Masculin" selected={form.genre === 'Masculin'} onClick={() => set('genre', 'Masculin')} />
              </div>
            </Field>

            <Field label="🎂 Statut *">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
                <ChoiceBtn emoji="🧒" text="Enfant / Ado (0-15 ans)" selected={form.statut_participant === 'Enfant / Ado (0-15 ans)'} onClick={() => set('statut_participant', 'Enfant / Ado (0-15 ans)')} />
                <ChoiceBtn emoji="🧑" text="Jeune / Adulte (+15 ans)" selected={form.statut_participant === 'Jeune / Adulte (+15 ans)'} onClick={() => set('statut_participant', 'Jeune / Adulte (+15 ans)')} />
              </div>
              {form.statut_participant && (
                <div style={{ marginTop: 8, background: '#E1F5EE', borderRadius: 8, padding: '6px 10px', fontSize: 10, color: '#085041', fontWeight: 500 }}>
                  Frais : {form.statut_participant === 'Enfant / Ado (0-15 ans)' ? '25 000' : '30 000'} FCFA
                </div>
              )}
            </Field>

            <Field label="📊 Tranche d'âge *">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 4 }}>
                {['30 ans et +', '20 – 29 ans', '16 – 19 ans', '11 – 15 ans', '10 ans et –'].map(a => (
                  <AgeBtn key={a} label={a} selected={form.tranche_age_detail === a} onClick={() => set('tranche_age_detail', a)} />
                ))}
              </div>
            </Field>
          </>
        )}

        {step === 1 && (
          <>
            <Field label="📱 Numéro de téléphone *" hint="Un numéro WhatsApp de préférence">
              <Input type="tel" placeholder="07 XX XX XX XX" value={form.telephone} onChange={v => set('telephone', v)} />
            </Field>

            <Field label="💼 Occupation *">
              <Textarea placeholder="Que faites-vous dans la vie ?" value={form.occupation} onChange={v => set('occupation', v)} />
            </Field>

            <Field label="📍 Lieu d'habitation *">
              <Input placeholder="Votre quartier / commune / ville" value={form.lieu_habitation} onChange={v => set('lieu_habitation', v)} />
            </Field>
          </>
        )}

        {step === 2 && (
          <>
            <Field label="🏥 Antécédents médicaux *" hint={`Allergies, asthme, etc. Écrire "Aucun" si pas d'antécédents.`}>
              <Textarea placeholder={`Écrire "Aucun" si pas d'antécédents médicaux.`} value={form.antecedents_medicaux} onChange={v => set('antecedents_medicaux', v)} />
            </Field>

            <Field label="⛺ Avez-vous déjà participé à un camp des Navigateurs ? *">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
                <ChoiceBtn emoji="✅" text="Oui" selected={form.deja_participe === 'Oui'} onClick={() => set('deja_participe', 'Oui')} />
                <ChoiceBtn emoji="🙂" text="Non" selected={form.deja_participe === 'Non'} onClick={() => set('deja_participe', 'Non')} />
              </div>
            </Field>

            <Field label="💬 Pourquoi souhaitez-vous participer ? *">
              <Textarea placeholder="En quelques mots, dites-nous pourquoi vous souhaitez participer..." value={form.motivation} onChange={v => set('motivation', v)} />
            </Field>
          </>
        )}

        {step === 3 && (
          <>
            {/* T-shirt avec illustrations */}
            <Field label="👕 Quelle taille de T-shirt portez-vous ? *">
              <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
                <div style={{ display: 'flex', gap: 8, paddingTop: 8, minWidth: 'max-content' }}>
                  {TSHIRT_SIZES.map(s => (
                    <div key={s.label} onClick={() => set('taille_tshirt', s.label)}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', padding: '8px 6px', borderRadius: 12,
                        background: form.taille_tshirt === s.label ? '#E1F5EE' : 'transparent', transition: 'all .2s' }}>
                      <TshirtIcon width={s.width} color={form.taille_tshirt === s.label ? '#085041' : '#ccc'} />
                      <div style={{ fontSize: 11, fontWeight: 600, color: form.taille_tshirt === s.label ? '#085041' : '#888' }}>{s.label}</div>
                      <div style={{ fontSize: 8, color: '#aaa' }}>{s.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
              {form.taille_tshirt && (
                <div style={{ marginTop: 6, background: '#E1F5EE', borderRadius: 8, padding: '6px 10px', fontSize: 10, color: '#085041', fontWeight: 500 }}>
                  Taille sélectionnée : {form.taille_tshirt}
                </div>
              )}
            </Field>

            <Field label="🚨 Qui contacter en cas d'urgence ? *">
              <Input placeholder="Ex : Jean Martin, 07 89 78 88 98" value={form.contact_urgence} onChange={v => set('contact_urgence', v)} />
            </Field>

            <Field label="🎟 Avez-vous été invité ? *">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
                <ChoiceBtn emoji="🎉" text="Oui" selected={form.invite === 'Oui'} onClick={() => set('invite', 'Oui')} />
                <ChoiceBtn emoji="🙂" text="Non" selected={form.invite === 'Non'} onClick={() => set('invite', 'Non')} />
              </div>
            </Field>

            {erreur && (
              <div style={{ background: '#FCEBEB', border: '0.5px solid #F09595', borderRadius: 12, padding: '10px 14px' }}>
                <p style={{ fontSize: 12, color: '#A32D2D' }}>{erreur}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Navigation */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: 480, margin: '0 auto', background: '#fff', borderTop: '0.5px solid #e5e5e0', padding: '10px 14px', display: 'flex', gap: 8, zIndex: 30 }}>
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)}
            style={{ background: '#f5f5f3', color: '#666', border: 'none', borderRadius: 12, padding: '12px 16px', fontSize: 13, cursor: 'pointer' }}>
            ← Retour
          </button>
        )}
        <button
          onClick={() => step < steps.length - 1 ? setStep(s => s + 1) : handleSubmit()}
          disabled={sending}
          style={{ flex: 1, background: '#085041', color: '#fff', border: 'none', borderRadius: 12, padding: '12px', fontSize: 13, fontWeight: 500, cursor: 'pointer', opacity: sending ? 0.6 : 1 }}>
          {sending ? 'Envoi...' : step < steps.length - 1 ? 'Continuer →' : '✓ Valider mon inscription'}
        </button>
      </div>
    </div>
  )
}
