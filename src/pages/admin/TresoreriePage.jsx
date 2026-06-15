import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useNavigate } from 'react-router-dom'
import TresorerieContent from './tresorerie'

const VERT = '#1B3B2B'
const VERT_CLAIR = '#E8F5E8'

function PinGate({ onSuccess }) {
  const [pin, setPin] = useState('')
  const [erreur, setErreur] = useState('')
  const [tentatives, setTentatives] = useState(0)
  const [bloque, setBloque] = useState(false)
  const [secRestantes, setSecRestantes] = useState(0)
  const [codeAttendu, setCodeAttendu] = useState(null)
  const [loading, setLoading] = useState(true)
  const [shake, setShake] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    supabase.from('config_camp').select('code_tresorerie').limit(1).then(({ data }) => {
      setCodeAttendu(data?.[0]?.code_tresorerie || '0880')
      setLoading(false)
    })
  }, [])

  function handleChiffre(c) {
    if (bloque || pin.length >= 4) return
    setErreur('')
    const newPin = pin + c
    setPin(newPin)
    if (newPin.length === 4) {
      setTimeout(() => verifier(newPin), 200)
    }
  }

  function handleSuppr() {
    if (bloque) return
    setPin(p => p.slice(0, -1))
    setErreur('')
  }

  function verifier(code) {
    if (code === codeAttendu) {
      sessionStorage.setItem('tresorerie_ok', '1')
      onSuccess()
    } else {
      const n = tentatives + 1
      setTentatives(n)
      setPin('')
      setShake(true)
      setTimeout(() => setShake(false), 500)
      if (n >= 3) {
        setBloque(true)
        setSecRestantes(30)
        setErreur('Trop de tentatives.')
        const interval = setInterval(() => {
          setSecRestantes(s => {
            if (s <= 1) { clearInterval(interval); setBloque(false); setTentatives(0); setErreur(''); return 0 }
            return s - 1
          })
        }, 1000)
      } else {
        setErreur(`Code incorrect · ${3 - n} essai(s) restant(s)`)
      }
    }
  }

  const CHIFFRES = ['1','2','3','4','5','6','7','8','9','','0','⌫']

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, maxWidth: 480, margin: '0 auto' }}>
      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-8px)}
          40%{transform:translateX(8px)}
          60%{transform:translateX(-6px)}
          80%{transform:translateX(6px)}
        }
        @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to { transform:rotate(360deg) } }
      `}</style>

      <div style={{ width: '100%', maxWidth: 340, animation: 'fadeIn .4s ease' }}>

        {/* Icône cadenas */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: VERT, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 8px 24px rgba(27,59,43,0.25)' }}>
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
          <p style={{ fontSize: 20, fontWeight: 700, color: '#1E293B', margin: '0 0 4px' }}>Trésorerie</p>
          <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>Entrez le code d'accès</p>
        </div>

        {/* Points PIN */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 28, animation: shake ? 'shake .4s ease' : 'none' }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ width: 16, height: 16, borderRadius: '50%', background: pin.length > i ? VERT : '#E2E8F0', border: `2px solid ${pin.length > i ? VERT : '#CBD5E1'}`, transition: 'all .15s', transform: pin.length > i ? 'scale(1.1)' : 'scale(1)' }} />
          ))}
        </div>

        {/* Message erreur / blocage */}
        {erreur && (
          <div style={{ background: bloque ? '#FEF2F2' : '#FFFBEB', border: `1px solid ${bloque ? '#FCA5A5' : '#FCD34D'}`, borderRadius: 10, padding: '8px 14px', marginBottom: 16, textAlign: 'center' }}>
            <p style={{ fontSize: 12, color: bloque ? '#DC2626' : '#92400E', margin: 0, fontWeight: 500 }}>
              {erreur}{bloque && secRestantes > 0 ? ` Réessayez dans ${secRestantes}s.` : ''}
            </p>
          </div>
        )}

        {/* Chargement */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid #E2E8F0', borderTopColor: VERT, animation: 'spin .8s linear infinite' }} />
          </div>
        )}

        {/* Pavé numérique */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
          {CHIFFRES.map((c, i) => {
            if (c === '') return <div key={i} />
            const isSuppr = c === '⌫'
            const isDisabled = bloque || loading || (!isSuppr && pin.length >= 4)
            return (
              <button key={i} type="button"
                onClick={() => isSuppr ? handleSuppr() : handleChiffre(c)}
                disabled={isDisabled}
                style={{
                  height: 64, borderRadius: 16, border: 'none', cursor: isDisabled ? 'not-allowed' : 'pointer',
                  background: isSuppr ? '#FEF2F2' : '#fff',
                  color: isSuppr ? '#DC2626' : '#1E293B',
                  fontSize: isSuppr ? 20 : 24, fontWeight: 600,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  opacity: isDisabled && !isSuppr ? 0.4 : 1,
                  transition: 'all .1s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                {c}
              </button>
            )
          })}
        </div>

        {/* Retour */}
        <button type="button" onClick={() => navigate('/admin')}
          style={{ width: '100%', background: 'transparent', color: '#94A3B8', border: '1px solid #E2E8F0', borderRadius: 12, padding: '12px', fontSize: 13, cursor: 'pointer' }}>
          ← Retour au tableau de bord
        </button>
      </div>
    </div>
  )
}

export default function TresoreriePage() {
  const [acces, setAcces] = useState(() => sessionStorage.getItem('tresorerie_ok') === '1')

  if (!acces) return <PinGate onSuccess={() => setAcces(true)} />
  return <TresorerieContent />
}
