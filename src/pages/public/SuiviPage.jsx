import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function SuiviPage() {
  const navigate = useNavigate()
  const [telephone, setTelephone] = useState('')
  const [resultats, setResultats] = useState([])
  const [loading, setLoading] = useState(false)
  const [rechercheFaite, setRechercheFaite] = useState(false)

  async function handleRecherche() {
    if (!telephone.trim()) return
    setLoading(true)
    setResultats([])
    setRechercheFaite(false)
    const tel = telephone.replace(/\s/g, '').replace(/\+225/g, '')
    const { data } = await supabase
      .from('inscriptions')
      .select('*')
      .or(`telephone.ilike.%${tel}%,telephone.ilike.%${tel.replace(/^0/, '225')}%`)
      .order('created_at', { ascending: false })
    setLoading(false)
    setRechercheFaite(true)
    setResultats(data || [])
  }

  function fraisTotal(r) {
    return r.tranche_age === 'Enfants & Adolescents' ? 25000 : 30000
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

      <div style={{ padding: '20px 16px' }}>

        {/* Formulaire */}
        <div style={{ background: '#fff', borderRadius: 18, border: '0.5px solid #e5e5e0', padding: 20, marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, color: '#444', marginBottom: 8 }}>Votre numéro de téléphone</label>
          <input
            type="tel"
            value={telephone}
            onChange={e => setTelephone(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleRecherche()}
            placeholder="Ex : 07 XX XX XX XX"
            style={{ width: '100%', border: '0.5px solid #e5e5e0', borderRadius: 12, padding: '12px 14px', fontSize: 14, color: '#1a1a1a', background: '#fafaf8', outline: 'none', marginBottom: 12 }}
          />
          <p style={{ fontSize: 11, color: '#888', marginBottom: 12 }}>
            Si plusieurs personnes partagent ce numéro, tous les résultats seront affichés.
          </p>
          <button onClick={handleRecherche} disabled={loading || !telephone.trim()}
            style={{ width: '100%', background: '#085041', color: '#fff', border: 'none', borderRadius: 12, padding: '13px', fontSize: 14, fontWeight: 500, cursor: 'pointer', opacity: loading || !telephone.trim() ? 0.6 : 1 }}>
            {loading ? 'Recherche...' : 'Rechercher'}
          </button>
        </div>

        {/* Aucun résultat */}
        {rechercheFaite && resultats.length === 0 && (
          <div style={{ background: '#FCEBEB', border: '0.5px solid #F09595', borderRadius: 16, padding: '16px 18px', textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>🔍</div>
            <p style={{ fontSize: 13, color: '#A32D2D', fontWeight: 500, marginBottom: 4 }}>Aucune inscription trouvée</p>
            <p style={{ fontSize: 11, color: '#993C1D' }}>
              Vérifiez votre numéro ou inscrivez-vous si ce n'est pas encore fait.
            </p>
          </div>
        )}

        {/* Résultats */}
        {resultats.length > 1 && (
          <p style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>{resultats.length} inscription(s) trouvée(s)</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {resultats.map(r => {
            const total = fraisTotal(r)
            const paye = r.montant_paye || 0
            const reste = Math.max(total - paye, 0)
            const statut = r.statut_paiement

            return (
              <div key={r.id} style={{ background: '#fff', borderRadius: 18, border: '0.5px solid #e5e5e0', overflow: 'hidden' }}>

                {/* En-tête campeur */}
                <div style={{ padding: '14px 16px', borderBottom: '0.5px solid #e5e5e0', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, background: '#E1F5EE', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 16, fontWeight: 600, color: '#085041' }}>{r.nom_complet?.charAt(0)}</span>
                  </div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a' }}>{r.nom_complet}</p>
                    <p style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{r.tranche_age}</p>
                  </div>
                </div>

                {/* Infos paiement */}
                <div style={{ padding: '12px 16px' }}>
                  {[
                    { label: 'Frais total', val: `${total.toLocaleString()} FCFA` },
                    { label: 'Montant payé', val: `${paye.toLocaleString()} FCFA` },
                    { label: 'Reste à payer', val: `${reste.toLocaleString()} FCFA`, bold: true, color: reste === 0 ? '#085041' : '#854F0B' },
                    { label: 'Inscrit le', val: new Date(r.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) },
                  ].map(({ label, val, bold, color }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '0.5px solid #f0f0ee' }}>
                      <span style={{ fontSize: 12, color: '#888' }}>{label}</span>
                      <span style={{ fontSize: 13, fontWeight: bold ? 600 : 400, color: color || '#1a1a1a' }}>{val}</span>
                    </div>
                  ))}
                </div>

                {/* Message selon statut */}
                {statut === 'payé' && (
                  <div style={{ margin: '0 14px 14px', background: '#E1F5EE', borderRadius: 12, padding: '14px 16px' }}>
                    <div style={{ fontSize: 22, marginBottom: 6 }}>🎉</div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#085041', marginBottom: 4 }}>Paiement confirmé !</p>
                    <p style={{ fontSize: 11, color: '#0F6E56', lineHeight: 1.6 }}>
                      Votre place au Camp-Navs 2026 est réservée. Nous avons hâte de vous accueillir à La Sablière le 23 août !
                    </p>
                  </div>
                )}

                {statut === 'partiel' && (
                  <div style={{ margin: '0 14px 14px', background: '#E6F1FB', borderRadius: 12, padding: '14px 16px' }}>
                    <div style={{ fontSize: 22, marginBottom: 6 }}>⏳</div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#185FA5', marginBottom: 4 }}>Paiement partiel reçu</p>
                    <p style={{ fontSize: 11, color: '#185FA5', lineHeight: 1.6 }}>
                      Il vous reste <strong>{reste.toLocaleString()} FCFA</strong> à payer pour confirmer votre place.
                      Envoyez le solde via Wave ou Orange Money :
                    </p>
                    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
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
                  <div style={{ margin: '0 14px 14px', background: '#FAEEDA', borderRadius: 12, padding: '14px 16px' }}>
                    <div style={{ fontSize: 22, marginBottom: 6 }}>💰</div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#854F0B', marginBottom: 4 }}>Paiement en attente</p>
                    <p style={{ fontSize: 11, color: '#6B3D00', lineHeight: 1.6 }}>
                      Votre inscription est enregistrée. Envoyez <strong>{total.toLocaleString()} FCFA</strong> via Wave ou Orange Money pour confirmer votre place :
                    </p>
                    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
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
