import { useNavigate } from 'react-router-dom'

const contacts = [
  {
    groupe: 'DIRECTION',
    membres: [
      { initiales: 'NS', nom: "N'DRI SERGE PACOME", role: 'Directeur du camp', tel: '0779126221', bg: '#E1F5EE', color: '#085041' },
    ]
  },
  {
    groupe: 'BUREAU DES NAVIGATEURS',
    membres: [
      { initiales: '🏢', nom: 'Ligne principale', role: 'Bureau des Navigateurs', tel: '0778484879', bg: '#E6F1FB', color: '#185FA5' },
    ]
  },
  {
    groupe: 'ADMINISTRATEURS',
    membres: [
      { initiales: 'OS', nom: 'OBODJI SYLVAIN', role: 'Directeur Adjoint', tel: '0709416262', bg: '#FAEEDA', color: '#854F0B' },
      { initiales: 'EL', nom: 'LOBOGNON EMMANUEL', role: 'Administrateur', tel: '0789588315', bg: '#FAECE7', color: '#993C1D' },
      { initiales: 'HF', nom: 'HABA FLORENT', role: 'Administrateur', tel: '0789540616', bg: '#EEEDFE', color: '#534AB7' },
    ]
  },
]

export default function ContactPage() {
  const navigate = useNavigate()

  function ouvrirWhatsApp(tel) {
    const num = tel.replace(/\s/g, '')
    window.open(`https://wa.me/225${num}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-white max-w-md mx-auto">

      {/* Header */}
      <div className="px-5 pt-10 pb-4 border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-emerald-700 text-sm mb-4">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          Retour
        </button>
        <h1 className="text-2xl font-medium text-gray-800">Contacts</h1>
        <p className="text-sm text-gray-400 mt-1">Camp-Navs 2026 · La Sablière, Bingerville</p>
      </div>

      {/* Contacts */}
      <div className="px-5 py-4">
        {contacts.map((group) => (
          <div key={group.groupe}>
            <p className="text-xs font-medium text-gray-400 tracking-wider mb-3 mt-4 first:mt-0">{group.groupe}</p>
            {group.membres.map((m, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
                    style={{ background: m.bg, color: m.color }}>
                    {m.initiales}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{m.nom}</p>
                    <p className="text-xs text-gray-400">{m.role}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#085041' }}>{m.tel.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5')}</p>
                  </div>
                </div>
                <button onClick={() => ouvrirWhatsApp(m.tel)}
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: '#25D366' }}>
                  <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ))}

        {/* Lieu */}
        <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-3 mt-4">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-800">La Sablière</p>
            <p className="text-xs text-gray-400 mt-0.5">Bingerville, Côte d'Ivoire</p>
            <a href="https://maps.google.com/?q=La+Sablière+Bingerville" target="_blank" rel="noreferrer"
              className="text-xs text-emerald-700 mt-1 flex items-center gap-1">
              Voir sur Google Maps
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
