import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

function getMontantDu(r) {
  if (r.montant_personnalise != null) return r.montant_personnalise
  return r.tranche_age === 'Enfants & Adolescents' ? 25000 : 30000
}

function copierNumero(numero) {
  navigator.clipboard.writeText(numero).catch(() => {
    const el = document.createElement('textarea')
    el.value = numero
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
  })
}

export default function SuiviPage() {
  const navigate = useNavigate()
  const [telephone, setTelephone] = useState('')
  const [resultats, setResultats] = useState([])
  const [versementsMap, setVersementsMap] = useState({})
  const [loading, setLoading] = useState(false)
  const [rechercheFaite, setRechercheFaite] = useState(false)
  const [copie, setCopie] = useState('')

  async function handleRecherche() {
    if (!telephone.trim()) return
    setLoading(true)
    setResultats([])
    setVersementsMap({})
    setRechercheFaite(false)
    const tel = telephone.replace(/\s/g, '')
    if (tel.length !== 10) {
      setResultats([])
      setRechercheFaite(true)
      setLoading(false)
      return
    }
    // Générer aussi le format avec espaces : 0708484879 → 07 08 48 48 79
    const telAvecEspaces = tel.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5')
    const { data } = await supabase
      .from('inscriptions')
      .select('*')
      .or(`telephone.ilike.%${tel}%,telephone.ilike.%${telAvecEspaces}%`)
      .order('created_at', { ascending: false })

    const inscrits = data || []
    setResultats(inscrits)
    setRechercheFaite(true)

    if (inscrits.length > 0) {
      const ids = inscrits.map(i => i.id)
      const { data: vers } = await supabase
        .from('versements')
        .select('*')
        .in('inscription_id', ids)
        .order('date_versement', { ascending: true })

      const map = {}
      ;(vers || []).forEach(v => {
        if (!map[v.inscription_id]) map[v.inscription_id] = []
        map[v.inscription_id].push(v)
      })
      setVersementsMap(map)
    }
    setLoading(false)
  }

  function handleCopier(numero) {
    copierNumero(numero)
    setCopie(numero)
    setTimeout(() => setCopie(''), 2000)
  }

  const contacts = [
    { nom: 'Bureau des Navigateurs', numero: '0778484879', affiche: '07 78 48 48 79' },
    { nom: 'Mme OBODJI', numero: '0709626265', affiche: '07 09 62 62 65' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#F0F4F0', maxWidth: 480, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ background: '#054035', padding: '44px 16px 20px' }}>
        <button onClick={() => navigate(-1)}
          style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'rgba(255,255,255,0.6)', fontSize: 11, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 12 }}>
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          Retour
        </button>
        <p style={{ fontSize: 20, fontWeight: 500, color: '#fff', marginBottom: 3 }}>Mon inscription</p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Camp-Navs 2026 · La Sablière, Bingerville</p>
      </div>

      <div style={{ padding: '16px 14px 60px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Recherche */}
        <div style={{ background: '#fff', borderRadius: 16, border: '0.5px solid #dde8dd', padding: 18 }}>
          <label style={{ fontSize: 12, color: '#555', marginBottom: 8, display: 'block', fontWeight: 500 }}>
            Votre numéro de téléphone
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="tel" value={telephone} onChange={e => setTelephone(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRecherche()}
              placeholder="07 XX XX XX XX"
              style={{ flex: 1, border: '0.5px solid #ccc', borderRadius: 10, padding: '10px 12px', fontSize: 13, outline: 'none', background: '#F8FAF8', color: '#1a1a1a' }} />
            <button onClick={handleRecherche} disabled={loading || !telephone.trim()}
              style={{ background: '#054035', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 12, fontWeight: 500, cursor: 'pointer', opacity: loading || !telephone.trim() ? 0.6 : 1, whiteSpace: 'nowrap' }}>
              {loading ? '...' : 'Rechercher'}
            </button>
          </div>
        </div>

        {/* Aucun résultat */}
        {rechercheFaite && resultats.length === 0 && (
          <div style={{ background: '#fff', borderRadius: 16, border: '0.5px solid #F09595', padding: '18px', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: '#A32D2D', fontWeight: 500, marginBottom: 4 }}>Aucune inscription trouvée</p>
            <p style={{ fontSize: 11, color: '#888' }}>
              {telephone.replace(/\s/g, '').length < 10
                ? 'Veuillez entrer les 10 chiffres de votre numero.'
                : 'Verifiez votre numero ou inscrivez-vous si ce nest pas encore fait.'}
            </p>
          </div>
        )}

        {/* Résultats */}
        {resultats.map(r => {
          const total = getMontantDu(r)
          const versements = versementsMap[r.id] || []
          const totalVerse = versements.reduce((s, v) => s + v.montant, 0)
          const reste = Math.max(total - totalVerse, 0)
          const statut = r.statut_paiement
          const initiales = r.nom_complet?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

          const badgeConfig = {
            'payé':       { label: 'Inscription validée', bg: '#5DCAA5', color: '#04342C' },
            'partiel':    { label: 'Paiement en cours',  bg: '#C9A84C', color: '#412402' },
            'en attente': { label: 'En attente de paiement', bg: '#EF9F27', color: '#412402' },
          }
          const badge = badgeConfig[statut] || badgeConfig['en attente']

          return (
            <div key={r.id} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Badge campeur / Pass */}
              <div style={{ background: '#054035', borderRadius: 20, padding: 20, color: '#fff', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', width: 140, height: 140, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.06)', top: -40, right: -40 }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 500, color: '#fff', flexShrink: 0 }}>
                    {initiales}
                  </div>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 500, color: '#fff', margin: 0 }}>{r.nom_complet}</p>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', margin: '3px 0 0' }}>{r.tranche_age}</p>
                  </div>
                </div>

                <span style={{ background: badge.bg, color: badge.color, fontSize: 10, fontWeight: 600, borderRadius: 20, padding: '3px 10px', display: 'inline-block', marginBottom: 16 }}>
                  {badge.label}
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {[
                    { n: `${total.toLocaleString()}`, l: 'Total dû', highlight: false },
                    { n: `${totalVerse.toLocaleString()}`, l: 'Versé', highlight: false },
                    { n: `${reste.toLocaleString()}`, l: 'Reste', highlight: true },
                  ].map(s => (
                    <div key={s.l} style={{
                      background: s.highlight && reste > 0 ? 'rgba(201,168,76,0.25)' : s.highlight && reste === 0 ? 'rgba(93,202,165,0.25)' : 'rgba(255,255,255,0.1)',
                      border: s.highlight && reste > 0 ? '0.5px solid rgba(201,168,76,0.4)' : s.highlight && reste === 0 ? '0.5px solid rgba(93,202,165,0.4)' : 'none',
                      borderRadius: 10, padding: '10px 8px', textAlign: 'center',
                    }}>
                      <p style={{ fontSize: 14, fontWeight: 500, color: s.highlight && reste > 0 ? '#FAC775' : s.highlight && reste === 0 ? '#9FE1CB' : '#fff', margin: 0 }}>{s.n}</p>
                      <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', margin: '3px 0 0' }}>{s.l}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Historique versements */}
              {versements.length > 0 && (
                <div style={{ background: '#fff', borderRadius: 16, border: '0.5px solid #dde8dd', overflow: 'hidden' }}>
                  <div style={{ padding: '12px 14px', borderBottom: '0.5px solid #f0f0ee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, fontWeight: 500, color: '#054035', letterSpacing: '0.04em' }}>Historique des versements</span>
                    <span style={{ fontSize: 11, color: '#888' }}>{versements.length} versement(s)</span>
                  </div>
                  {versements.map((v, i) => (
                    <div key={v.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: i < versements.length - 1 ? '0.5px solid #f8f8f8' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#054035', flexShrink: 0 }} />
                        <div>
                          <p style={{ fontSize: 12, color: '#333', margin: 0 }}>
                            {new Date(v.date_versement).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                          {v.note && <p style={{ fontSize: 10, color: '#aaa', margin: '2px 0 0' }}>{v.note}</p>}
                        </div>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 500, color: '#054035' }}>{v.montant.toLocaleString()} FCFA</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Contacts paiement si pas encore soldé */}
              {reste > 0 && (
                <div style={{ background: '#fff', borderRadius: 16, border: '0.5px solid #dde8dd', overflow: 'hidden' }}>
                  <div style={{ padding: '12px 14px', background: '#FFF8EC', borderBottom: '0.5px solid #F5E4C0' }}>
                    <p style={{ fontSize: 11, fontWeight: 500, color: '#854F0B', margin: 0 }}>
                      Il reste {reste.toLocaleString()} FCFA à régler pour confirmer votre place
                    </p>
                  </div>
                  {contacts.map((c, i) => (
                    <div key={c.numero} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: i === 0 ? '0.5px solid #f8f8f8' : 'none' }}>
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 500, color: '#1a1a1a', margin: 0 }}>{c.nom}</p>
                        <p style={{ fontSize: 14, fontWeight: 500, color: '#054035', margin: '3px 0 0' }}>{c.affiche}</p>
                      </div>
                      <button onClick={() => handleCopier(c.numero)}
                        style={{ background: copie === c.numero ? '#E1F5EE' : '#F0F4F0', border: `0.5px solid ${copie === c.numero ? '#9FE1CB' : '#ccc'}`, borderRadius: 8, padding: '6px 12px', fontSize: 11, color: copie === c.numero ? '#054035' : '#555', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, transition: 'all .2s' }}>
                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                        {copie === c.numero ? 'Copié !' : 'Copier'}
                      </button>
                    </div>
                  ))}
                  <div style={{ padding: '12px 14px', background: '#f8f8f8' }}>
                    <p style={{ fontSize: 10, color: '#888', textAlign: 'center', lineHeight: 1.6 }}>
                      Après paiement, envoyez votre reçu par WhatsApp en indiquant votre nom complet.
                    </p>
                  </div>
                </div>
              )}

              {/* Message confirmé */}
              {statut === 'payé' && (
                <div style={{ background: '#E1F5EE', borderRadius: 16, border: '0.5px solid #9FE1CB', padding: '16px 18px', textAlign: 'center' }}>
                  <p style={{ fontSize: 22, marginBottom: 6 }}>🎉</p>
                  <p style={{ fontSize: 14, fontWeight: 500, color: '#054035', marginBottom: 4 }}>Place confirmée !</p>
                  <p style={{ fontSize: 12, color: '#0F6E56', lineHeight: 1.6 }}>
                    Votre paiement est complet. Nous avons hâte de vous accueillir à La Sablière le 23 août 2026 !
                  </p>
                </div>
              )}

            </div>
          )
        })}
      </div>
    </div>
  )
}
