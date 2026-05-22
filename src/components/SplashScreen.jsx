import { useEffect, useState } from 'react'

export default function SplashScreen({ onFinish }) {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 300)
    const t2 = setTimeout(() => setPhase(2), 900)
    const t3 = setTimeout(() => setPhase(3), 1600)
    const t4 = setTimeout(() => onFinish(), 2800)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [])

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#054035',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, overflow: 'hidden',
    }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.7); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.15; transform: scale(1.15); }
        }
        @keyframes slideOut {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(-20px); }
        }
        .splash-out {
          animation: slideOut 0.4s ease forwards;
        }
      `}</style>

      {/* Cercles décoratifs en arrière-plan */}
      <div style={{
        position: 'absolute', width: 400, height: 400,
        borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)',
        top: -100, right: -100,
        animation: 'pulse 4s ease infinite',
      }} />
      <div style={{
        position: 'absolute', width: 280, height: 280,
        borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)',
        bottom: -60, left: -80,
        animation: 'pulse 5s ease infinite 1s',
      }} />
      <div style={{
        position: 'absolute', width: 160, height: 160,
        borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)',
        top: '20%', left: '10%',
        animation: 'pulse 3.5s ease infinite 0.5s',
      }} />

      {/* Contenu principal */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>

        {/* Logo Navs */}
        <div style={{
          opacity: phase >= 1 ? 1 : 0,
          animation: phase >= 1 ? 'scaleIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' : 'none',
          marginBottom: 6,
          position: 'relative',
        }}>
          <span style={{
            fontSize: 72, fontWeight: 700,
            color: '#fff',
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
            letterSpacing: -2,
            lineHeight: 1,
            position: 'relative',
            display: 'inline-block',
          }}>
            Navs
            {/* Ligne dorée sous le texte */}
            <span style={{
              position: 'absolute', bottom: -4, left: '10%', right: '10%',
              height: 2, background: 'linear-gradient(90deg, transparent, #C9A84C, transparent)',
              opacity: phase >= 2 ? 1 : 0,
              transition: 'opacity 0.6s ease',
            }} />
          </span>
        </div>

        {/* Année */}
        <div style={{
          opacity: phase >= 2 ? 1 : 0,
          animation: phase >= 2 ? 'fadeUp 0.5s ease forwards' : 'none',
          marginBottom: 32,
        }}>
          <span style={{
            fontSize: 14, fontWeight: 400,
            color: 'rgba(255,255,255,0.5)',
            letterSpacing: 6,
          }}>2 0 2 6</span>
        </div>

        {/* Séparateur doré */}
        <div style={{
          width: phase >= 2 ? 48 : 0,
          height: 1,
          background: 'linear-gradient(90deg, transparent, #C9A84C, transparent)',
          transition: 'width 0.8s ease',
          marginBottom: 20,
        }} />

        {/* Texte organisation */}
        <div style={{
          opacity: phase >= 3 ? 1 : 0,
          animation: phase >= 3 ? 'fadeUp 0.5s ease forwards' : 'none',
          textAlign: 'center',
        }}>
          <p style={{
            fontSize: 13, fontWeight: 400,
            color: 'rgba(255,255,255,0.7)',
            letterSpacing: 1, margin: 0,
          }}>LES NAVIGATEURS</p>
          <p style={{
            fontSize: 11, fontWeight: 400,
            color: 'rgba(255,255,255,0.4)',
            letterSpacing: 2, margin: '4px 0 0',
          }}>Côte d'Ivoire</p>
        </div>
      </div>

      {/* Indicateur de chargement en bas */}
      <div style={{
        position: 'absolute', bottom: 60,
        opacity: phase >= 3 ? 1 : 0,
        transition: 'opacity 0.5s ease',
      }}>
        <div style={{
          width: 120, height: 2,
          background: 'rgba(255,255,255,0.1)',
          borderRadius: 2, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', width: '40%',
            background: 'rgba(201,168,76,0.8)',
            borderRadius: 2,
            animation: phase >= 3 ? 'shimmer 1.2s ease infinite' : 'none',
          }} />
        </div>
      </div>

      {/* Dates camp en bas */}
      <div style={{
        position: 'absolute', bottom: 32,
        opacity: phase >= 3 ? 1 : 0,
        transition: 'opacity 0.5s ease 0.3s',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: 0, letterSpacing: 1 }}>
          23 – 29 AOÛT · LA SABLIÈRE, BINGERVILLE
        </p>
      </div>
    </div>
  )
}
