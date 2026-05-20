import { useNavigate } from 'react-router-dom'

export default function LieuPage() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: '#f8f8f6', maxWidth: 480, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ background: '#085041', padding: '40px 20px 24px', color: '#fff' }}>
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#9FE1CB', fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 14 }}>
          <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" /></svg>
          Retour
        </button>
        <h1 style={{ fontSize: 22, fontWeight: 500, marginBottom: 4 }}>Lieu du camp</h1>
        <p style={{ fontSize: 12, color: '#9FE1CB' }}>Camp-Navs 2026 · 23 – 29 août</p>
      </div>

      <div style={{ padding: '20px 16px' }}>

        {/* Carte principale */}
        <div style={{ background: '#fff', borderRadius: 16, border: '0.5px solid #e5e5e0', overflow: 'hidden', marginBottom: 14 }}>
          {/* Visuel map */}
          <div style={{ background: 'linear-gradient(140deg,#085041,#1D9E75)', height: 140, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(45deg,rgba(255,255,255,0.03) 0,rgba(255,255,255,0.03) 1px,transparent 1px,transparent 10px)' }} />
            <div style={{ width: 44, height: 44, background: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg style={{ width: 24, height: 24, color: '#085041' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#fff' }}>La Sablière</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.75)' }}>Bingerville, Côte d'Ivoire</div>
          </div>

          {/* Infos */}
          <div style={{ padding: '14px 16px' }}>
            {[
              { label: 'Nom du lieu', val: 'La Sablière' },
              { label: 'Ville', val: 'Bingerville' },
              { label: 'Pays', val: "Côte d'Ivoire" },
              { label: 'Dates', val: '23 – 29 août 2026' },
            ].map(({ label, val }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '0.5px solid #f0f0ee' }}>
                <span style={{ fontSize: 12, color: '#888780' }}>{label}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bouton Google Maps */}
        <a
          href="https://maps.google.com/?q=La+Sablière+Bingerville+Cote+Ivoire"
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            background: '#085041',
            color: '#fff',
            borderRadius: 14,
            padding: '14px',
            fontSize: 14,
            fontWeight: 500,
            textDecoration: 'none',
            marginBottom: 12,
          }}
        >
          <svg style={{ width: 18, height: 18 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Voir sur Google Maps
        </a>

        {/* Info transport */}
        <div style={{ background: '#E1F5EE', borderRadius: 14, padding: '14px 16px' }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: '#085041', marginBottom: 4 }}>Comment y aller ?</div>
          <p style={{ fontSize: 11, color: '#0F6E56', lineHeight: 1.6 }}>
            Depuis Abidjan, prendre la direction de Bingerville. La Sablière est facilement accessible en taxi ou en bus.
            Des transports groupés seront organisés depuis le centre d'Abidjan le matin du 23 août.
          </p>
        </div>
      </div>
    </div>
  )
}
