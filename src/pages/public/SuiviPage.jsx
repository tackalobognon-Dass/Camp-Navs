import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function SuiviPage() {
  const navigate = useNavigate()
  const [telephone, setTelephone] = useState('')
  const [resultat, setResultat] = useState(null)
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState('')

  async function handleRecherche() {
    if (!telephone.trim()) return
    setLoading(true)
    setErreur('')
    setResultat(null)
    const { data } = await supabase
      .from('inscriptions')
      .select('*')
      .ilike('telephone', `%${telephone.replace(/\s/g, '')}%`)
      .limit(1)
    setLoading(false)
    if (!data || data.length === 0) {
      setErreur('Aucune inscription trouvée pour ce numéro.')
    } else {
      setResultat(data[0])
    }
  }

  const statutConfig = {
    'payé': { label: 'Payé', bg: '#E1F5EE', color: '#085041' },
    'en attente': { label: 'En attente', bg: '#FAEEDA', color: '#854F0B' },
    'partiel': { label: 'Partiel', bg: '#E6F1FB', color: '#185FA5' },
  }

  const fraisTotal = resultat?.tranche_age === 'Enfants & Adolescents' ? 25000 : 30000
  const resteAPayer = Math.max(fraisTotal - (resultat?.montant_paye || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto">

      {/* Header */}
      <div className="bg-emerald-700 px-5 pt-10 pb-6 text-white">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-emerald-200 text-sm mb-4">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          Retour
        </button>
        <h1 className="text-xl font-medium">Mon inscription</h1>
        <p className="text-sm text-emerald-200 mt-1">Vérifiez votre statut de paiement</p>
      </div>

      <div className="px-5 py-5">

        {/* Formulaire */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
          <label className="block text-sm text-gray-600 mb-2">Votre numéro de téléphone</label>
          <input
            type="tel"
            value={telephone}
            onChange={e => setTelephone(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleRecherche()}
            placeholder="07 XX XX XX XX"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 bg-white outline-none focus:border-emerald-400 mb-3"
          />
          <button
            onClick={handleRecherche}
            disabled={loading || !telephone.trim()}
            className="w-full bg-emerald-700 text-white text-sm font-medium py-3 rounded-xl disabled:opacity-50"
          >
            {loading ? 'Recherche...' : 'Rechercher'}
          </button>
        </div>

        {/* Erreur */}
        {erreur && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-4">
            <p className="text-sm text-red-600">{erreur}</p>
          </div>
        )}

        {/* Résultat */}
        {resultat && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-50">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center">
                <span className="text-lg font-medium text-emerald-700">{resultat.nom_complet.charAt(0)}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">{resultat.nom_complet}</p>
                <p className="text-xs text-gray-400">{resultat.tranche_age}</p>
                {resultat.eglise && <p className="text-xs text-gray-400">{resultat.eglise}</p>}
              </div>
            </div>

            {[
              {
                label: 'Statut',
                value: (
                  <span className="text-xs font-medium px-2 py-1 rounded-full"
                    style={{ background: statutConfig[resultat.statut_paiement]?.bg || '#f0f0f0', color: statutConfig[resultat.statut_paiement]?.color || '#666' }}>
                    {statutConfig[resultat.statut_paiement]?.label || resultat.statut_paiement}
                  </span>
                )
              },
              { label: 'Frais total', value: `${fraisTotal.toLocaleString()} FCFA` },
              { label: 'Montant payé', value: `${(resultat.montant_paye || 0).toLocaleString()} FCFA` },
              { label: 'Reste à payer', value: <span className="text-sm font-medium text-emerald-700">{resteAPayer.toLocaleString()} FCFA</span> },
              { label: 'Inscrit le', value: new Date(resultat.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">{label}</span>
                <span className="text-sm text-gray-800">{value}</span>
              </div>
            ))}

            {resteAPayer > 0 && (
              <div className="mt-4 bg-amber-50 rounded-xl p-3">
                <p className="text-xs text-amber-700 font-medium mb-1">Finaliser le paiement</p>
                <p className="text-xs text-amber-600">Envoyez <strong>{resteAPayer.toLocaleString()} FCFA</strong> via Wave ou Orange Money au <strong>07 48 92 49 74</strong>, puis confirmez par WhatsApp.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
