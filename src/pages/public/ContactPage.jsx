import { useNavigate } from 'react-router-dom'
import BottomNav from '../../components/public/BottomNav'

const VERT = '#054035'
const VERT_CLAIR = '#E8F5E8'

const contacts = [
  {
    groupe: 'DIRECTION',
    membres: [
      { initiales: 'NS', nom: "N'DRI SERGE PACOME", role: 'Directeur du camp', tel: '0779126221' },
    ]
  },
  {
    groupe: 'BUREAU DES NAVIGATEURS',
    membres: [
      { initiales: 'BN', nom: 'Ligne principale', role: 'Bureau des Navigateurs', tel: '0778484879' },
    ]
  },
  {
    groupe: 'ADMINISTRATEURS',
    membres: [
      { initiales: 'OS', nom: 'OBODJI SYLVAIN', role: 'Directeur Adjoint', tel: '0709416262' },
      { initiales: 'EL', nom: 'LOBOGNON EMMANUEL', role: 'Administrateur', tel: '0789588315' },
      { initiales: 'HF', nom: 'HABA FLORENT', role: 'Administrateur', tel: '0789540616' },
    ]
  },
]

function formatTel(tel) {
  return tel.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5')
}

export default function ContactPage() {
  const navigate = useNavigate()

  function appeler(tel) {
    window.open(`tel:+225${tel}`, '_self')
  }

  function ouvrirWhatsApp(tel) {
    window.open(`https://wa.me/225${tel}`, '_blank')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', maxWidth: 480, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ background: VERT, padding: '44px 16px 20px' }}>
        <button onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.6)', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 14 }}>
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          Retour
        </button>
        <p style={{ fontSize: 20, fontWeight: 500, color: '#fff', margin: '0 0 3px' }}>Contacts</p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', margin: 0 }}>Camp-Navs 2026 · La Sablière, Bingerville</p>
      </div>

      <div style={{ padding: '16px 14px 80px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Groupes de contacts */}
        {contacts.map((group) => (
          <div key={group.groupe}>
            {/* Titre de section */}
            <p style={{ fontSize: 10, fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.1em', margin: '0 0 10px' }}>
              {group.groupe}
            </p>

            {/* Carte du groupe */}
            <div style={{ background: '#fff', borderRadius: 16, border: '0.5px solid #F3F4F6', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
              {group.membres.map((m, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 14px',
                  borderBottom: i < group.membres.length - 1 ? '0.5px solid #F9FAFB' : 'none',
                }}>
                  {/* Avatar uniforme */}
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%',
                    background: VERT_CLAIR, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: VERT }}>{m.initiales}</span>
                  </div>

                  {/* Infos */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.nom}</p>
                    <p style={{ fontSize: 11, color: '#9CA3AF', margin: '0 0 3px' }}>{m.role}</p>
                    <p style={{ fontSize: 12, fontWeight: 500, color: VERT, margin: 0 }}>{formatTel(m.tel)}</p>
                  </div>

                  {/* Boutons Appel + WhatsApp */}
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    {/* Appel */}
                    <button onClick={() => appeler(m.tel)}
                      style={{ width: 36, height: 36, borderRadius: '50%', background: VERT_CLAIR, border: `1px solid ${VERT}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={VERT} strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                      </svg>
                    </button>

                    {/* WhatsApp */}
                    <button onClick={() => ouvrirWhatsApp(m.tel)}
                      style={{ width: 36, height: 36, borderRadius: '50%', background: '#F0FDF4', border: '1px solid #16A34A', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="16" height="16" fill="#16A34A" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Widget localisation */}
        <div>
          <p style={{ fontSize: 10, fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.1em', margin: '0 0 10px' }}>
            LOCALISATION
          </p>
          <div style={{ background: '#fff', borderRadius: 16, border: '0.5px solid #F3F4F6', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
            {/* Carte minimaliste */}
            <div style={{ background: `linear-gradient(135deg, ${VERT_CLAIR}, #D1FAE5)`, padding: '20px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: VERT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 600, color: VERT, margin: '0 0 3px' }}>La Sablière</p>
                <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 2px' }}>Bingerville, Côte d'Ivoire</p>
                <p style={{ fontSize: 11, color: '#9CA3AF', margin: 0 }}>23 – 29 août 2026</p>
              </div>
            </div>
            {/* Bouton Maps */}
            <div style={{ padding: '12px 14px' }}>
              <button
                onClick={() => window.open('https://maps.google.com/?q=La+Sablière+Bingerville', '_blank')}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'transparent', color: VERT, border: `1.5px solid ${VERT}`, borderRadius: 12, padding: '11px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                </svg>
                Ouvrir dans Google Maps
              </button>
            </div>
          </div>
        </div>

      </div>

      <BottomNav />
    </div>
  )
}
