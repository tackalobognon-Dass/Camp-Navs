import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

function getMontantDu(r) {
  if (r.montant_personnalise != null) return r.montant_personnalise
  return r.tranche_age === 'Enfants & Adolescents' ? 25000 : 30000
}

export default function SuiviPage() {
  const navigate = useNavigate()
  const [telephone, setTelephone] = useState('')
  const [resultats, setResultats] = useState([])
  const [versementsMap, setVersementsMap] = useState({})
  const [loading, setLoading] = useState(false)
  const [rechercheFaite, setRechercheFaite] = useState(false)

  async function handleRecherche() {
    if (!telephone.trim()) return
    setLoading(true)
    setResultats([])
    setVersementsMap({})
    setRechercheFaite(false)
    const tel = telephone.replace(/\s/g, '')
    const { data } = await supabase
      .from('inscriptions')
      .select('*')
      .ilike('telephone', `%${tel}%`)
      .order('created_at', { ascending: false })

    const inscrits = data || []
    setResultats(inscrits)
    setRechercheFaite(true)

    // Charger les versements pour chaque inscription
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

  return (
    <div style={{ minHeight: '100vh', background: '#f8f8f6', maxWidth: 480, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(160deg,#054035,#085041)', padding: '44px 16px 24px', color: '#fff' }}>
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#9FE1CB', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 14 }}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          Retour
        </button>
        <div style={{ fontSize: 20, fontWeight: 500, color: '#fff', marginBottom: 4 }}>Mon inscription</div>
        <div style={{ fontSize: 11, color: '#9FE1CB' }}>Vérifiez votre statut de paiement</div>
      </div>

      <div style={{ padding: '20px 16px 80px' }}>

        {/* Formulaire */}
        <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #e5e5e0', padding: 20, marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, color: '#444', marginBottom: 8 }}>Votre numéro de téléphone</label>
          <input type="tel" value={telephone} onChange={e => setTelephone(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleRecherche()}
            placeholder="Ex : 07 XX XX XX XX"
            style={{ width: '100%', border: '0.5px solid #e5e5e0', borderRadius: 10, padding: '12px 14px', fontSize: 14, color: '#1a1a1a', background: '#fafaf8', outline: 'none', marginBottom: 12 }} />
          <button onClick={handleRecherche} disabled={loading || !telephone.trim()}
            style={{ width: '100%', background: '#085041', color: '#fff', border: 'none', borderRadius: 10, padding: '13px', fontSize: 14, fontWeight: 500, cursor: 'pointer', opacity: loading || !telephone.trim() ? 0.6 : 1 }}>
            {loading ? 'Recherche...' : 'Rechercher'}
          </button>
        </div>

        {/* Aucun résultat */}
        {rechercheFaite && resultats.length === 0 && (
          <div style={{ background: '#FCEBEB', border: '0.5px solid #F09595', borderRadius: 14, padding: '16px 18px', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: '#A32D2D', fontWeight: 500, marginBottom: 4 }}>Aucune inscription trouvée</p>
            <p style={{ fontSize: 11, color: '#993C1D' }}>Vérifiez votre numéro ou inscrivez-vous.</p>
          </div>
        )}

        {/* Résultats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {resultats.map(r => {
            const total = getMontantDu(r)
            const versements = versementsMap[r.id] || []
            const totalVerse = versements.reduce((s, v) => s + v.montant, 0)
            const reste = Math.max(total - totalVerse, 0)
            const statut = r.statut_paiement

            return (
              <div key={r.id} style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #e5e5e0', overflow: 'hidden' }}>

                {/* En-tête */}
                <div style={{ padding: '14px 16px', borderBottom: '0.5px solid #f0f0ee', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, background: '#E1F5EE', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 16, fontWeight: 600, color: '#085041' }}>{r.nom_complet?.charAt(0)}</span>
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a' }}>{r.nom_complet}</p>
                    <p style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{r.tranche_age}</p>
                  </div>
                </div>

                {/* Compteurs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5px', background: '#f0f0ee' }}>
                  <div style={{ background: '#f8f8f6', padding: '10px', textAlign: 'center' }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{total.toLocaleString()}</p>
                    <p style={{ fontSize: 9, color: '#888' }}>Total dû</p>
                  </div>
                  <div style={{ background: '#E1F5EE', padding: '10px', textAlign: 'center' }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#085041' }}>{totalVerse.toLocaleString()}</p>
                    <p style={{ fontSize: 9, color: '#085041' }}>Versé</p>
                  </div>
                  <div style={{ background: reste > 0 ? '#FAEEDA' : '#E1F5EE', padding: '10px', textAlign: 'center' }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: reste > 0 ? '#854F0B' : '#085041' }}>{reste.toLocaleString()}</p>
                    <p style={{ fontSize: 9, color: reste > 0 ? '#854F0B' : '#085041' }}>Reste</p>
                  </div>
                </div>

                {/* Historique versements */}
                {versements.length > 0 && (
                  <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #f0f0ee' }}>
                    <p style={{ fontSize: 10, fontWeight: 600, color: '#085041', marginBottom: 8, letterSpacing: '0.05em' }}>HISTORIQUE DES VERSEMENTS</p>
                    {versements.map((v, i) => (
                      <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < versements.length - 1 ? '0.5px solid #f8f8f6' : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#085041', flexShrink: 0 }} />
                          <span style={{ fontSize: 11, color: '#555' }}>
                            {new Date(v.date_versement).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </span>
                          {v.note && <span style={{ fontSize: 10, color: '#aaa' }}>· {v.note}</span>}
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 500, color: '#085041' }}>{v.montant.toLocaleString()} FCFA</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Message selon statut */}
                {statut === 'payé' && (
                  <div style={{ margin: '12px 14px 14px', background: '#E1F5EE', borderRadius: 10, padding: '14px 16px' }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#085041', marginBottom: 4 }}>Paiement confirmé !</p>
                    <p style={{ fontSize: 11, color: '#0F6E56', lineHeight: 1.6 }}>
                      Votre place au Camp-Navs 2026 est réservée. Nous avons hâte de vous accueillir à La Sablière le 23 août !
                    </p>
                  </div>
                )}

                {statut === 'partiel' && (
                  <div style={{ margin: '12px 14px 14px', background: '#E6F1FB', borderRadius: 10, padding: '14px 16px' }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#185FA5', marginBottom: 4 }}>Paiement partiel reçu</p>
                    <p style={{ fontSize: 11, color: '#185FA5', lineHeight: 1.6, marginBottom: 10 }}>
                      Il vous reste <strong>{reste.toLocaleString()} FCFA</strong> à payer. Envoyez le solde via Wave ou Orange Money :
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ background: '#fff', borderRadius: 8, padding: '8px 10px' }}>
                        <p style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>Bureau des Navigateurs</p>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#085041' }}>07 78 48 48 79</p>
                      </div>
                      <div style={{ background: '#fff', borderRadius: 8, padding: '8px 10px' }}>
                        <p style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>Mme OBODJI</p>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#085041' }}>07 09 62 62 65</p>
                      </div>
                    </div>
                  </div>
                )}

                {statut === 'en attente' && (
                  <div style={{ margin: '12px 14px 14px', background: '#FAEEDA', borderRadius: 10, padding: '14px 16px' }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#854F0B', marginBottom: 4 }}>Paiement en attente</p>
                    <p style={{ fontSize: 11, color: '#6B3D00', lineHeight: 1.6, marginBottom: 10 }}>
                      Envoyez <strong>{total.toLocaleString()} FCFA</strong> via Wave ou Orange Money pour confirmer votre place :
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ background: '#fff', borderRadius: 8, padding: '8px 10px' }}>
                        <p style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>Bureau des Navigateurs</p>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#085041' }}>07 78 48 48 79</p>
                      </div>
                      <div style={{ background: '#fff', borderRadius: 8, padding: '8px 10px' }}>
                        <p style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>Mme OBODJI</p>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#085041' }}>07 09 62 62 65</p>
                      </div>
                    </div>
                    <p style={{ fontSize: 10, color: '#854F0B', marginTop: 8, fontStyle: 'italic' }}>
                      Après paiement, confirmez par WhatsApp en envoyant votre nom et votre reçu.
                    </p>
                  </div>
                )}

              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
