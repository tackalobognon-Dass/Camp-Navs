import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function InscriptionPage() {
  const [form, setForm] = useState({
    nom_complet: '',
    telephone: '',
    tranche_age: '',
    eglise: '',
    mode_paiement: '',
  })
  const [loading, setLoading] = useState(false)
  const [succes, setSucces] = useState(false)
  const [erreur, setErreur] = useState('')

  const frais = form.tranche_age === 'Enfants & Adolescents' ? '25 000' : '30 000'

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit() {
    setErreur('')
    if (!form.nom_complet || !form.telephone || !form.tranche_age || !form.mode_paiement) {
      setErreur('Veuillez remplir tous les champs obligatoires.')
      return
    }
    setLoading(true)
    const { error } = await supabase.from('inscriptions').insert([
      {
        nom_complet: form.nom_complet,
        telephone: form.telephone,
        tranche_age: form.tranche_age,
        eglise: form.eglise,
        statut_paiement: 'en attente',
        montant_paye: 0,
      },
    ])
    setLoading(false)
    if (error) {
      setErreur('Une erreur est survenue. Veuillez réessayer.')
    } else {
      setSucces(true)
    }
  }

  if (succes) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-5">
        <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center max-w-sm w-full">
          <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-medium text-gray-800 mb-2">Inscription enregistrée</h2>
          <p className="text-sm text-gray-500 leading-relaxed mb-2">
            Merci <span className="font-medium text-gray-700">{form.nom_complet}</span>. Votre inscription a bien été reçue.
          </p>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            Pour finaliser votre inscription, veuillez effectuer le paiement de <span className="font-medium text-emerald-700">{frais} FCFA</span> via :
          </p>

          {(form.mode_paiement === 'Wave' || form.mode_paiement === 'Orange Money') && (
            <div className="bg-emerald-50 rounded-xl p-4 mb-4 text-left">
              <p className="text-xs text-emerald-700 font-medium mb-1">{form.mode_paiement}</p>
              <p className="text-sm text-gray-700 font-medium">07 48 92 49 74</p>
              <p className="text-xs text-gray-400 mt-1">Au nom de N'DRI SERGE PACOME</p>
            </div>
          )}

          {form.mode_paiement === 'Especes' && (
            <div className="bg-emerald-50 rounded-xl p-4 mb-4 text-left">
              <p className="text-xs text-emerald-700 font-medium mb-1">Paiement en espèces</p>
              <p className="text-sm text-gray-500">Remettez le montant directement à un responsable du bureau.</p>
            </div>
          )}

          <p className="text-xs text-gray-400 mb-6">
            Après paiement, envoyez votre reçu ou confirmez par WhatsApp au <span className="font-medium">07 48 92 49 74</span>
          </p>

          <a
            href="/"
            className="block w-full text-center bg-emerald-700 text-white text-sm font-medium py-2.5 rounded-xl"
          >
            Retour à l'accueil
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-emerald-700 text-white px-5 pt-10 pb-6">
        <a href="/" className="flex items-center gap-2 text-emerald-200 text-sm mb-4">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          Retour
        </a>
        <h1 className="text-xl font-medium">Inscription au camp</h1>
        <p className="text-sm text-emerald-100 mt-1">Camp-Navs 2026 · 23 – 29 août · Bingerville</p>
      </div>

      {/* Formulaire */}
      <div className="px-5 py-6 pb-24">

        {/* Frais dynamique */}
        {form.tranche_age && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-5">
            <p className="text-xs text-emerald-600 mb-0.5">Frais de participation</p>
            <p className="text-xl font-medium text-emerald-700">{frais} <span className="text-sm font-normal">FCFA</span></p>
          </div>
        )}

        {/* Nom complet */}
        <div className="mb-4">
          <label className="block text-sm text-gray-600 mb-1.5">
            Nom complet <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            name="nom_complet"
            value={form.nom_complet}
            onChange={handleChange}
            placeholder="Ex : YAO Jean-Pierre"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 bg-white outline-none focus:border-emerald-400"
          />
        </div>

        {/* Téléphone */}
        <div className="mb-4">
          <label className="block text-sm text-gray-600 mb-1.5">
            Téléphone (WhatsApp) <span className="text-red-400">*</span>
          </label>
          <input
            type="tel"
            name="telephone"
            value={form.telephone}
            onChange={handleChange}
            placeholder="07 XX XX XX XX"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 bg-white outline-none focus:border-emerald-400"
          />
        </div>

        {/* Tranche d'âge */}
        <div className="mb-4">
          <label className="block text-sm text-gray-600 mb-1.5">
            Tranche d'âge <span className="text-red-400">*</span>
          </label>
          <select
            name="tranche_age"
            value={form.tranche_age}
            onChange={handleChange}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 bg-white outline-none focus:border-emerald-400"
          >
            <option value="">Sélectionner...</option>
            <option value="Jeunes & Adultes">Jeunes & Adultes (18 ans et plus)</option>
            <option value="Enfants & Adolescents">Enfants & Adolescents (moins de 18 ans)</option>
          </select>
        </div>

        {/* Église */}
        <div className="mb-4">
          <label className="block text-sm text-gray-600 mb-1.5">
            Église / Communauté
          </label>
          <input
            type="text"
            name="eglise"
            value={form.eglise}
            onChange={handleChange}
            placeholder="Ex : Église de Cocody"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 bg-white outline-none focus:border-emerald-400"
          />
        </div>

        {/* Mode de paiement */}
        <div className="mb-6">
          <label className="block text-sm text-gray-600 mb-2">
            Mode de paiement <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {['Wave', 'Orange Money', 'Especes'].map((mode) => (
              <button
                key={mode}
                onClick={() => setForm({ ...form, mode_paiement: mode })}
                className={`py-3 rounded-xl text-sm border transition-all ${
                  form.mode_paiement === mode
                    ? 'bg-emerald-700 text-white border-emerald-700 font-medium'
                    : 'bg-white text-gray-600 border-gray-200'
                }`}
              >
                {mode === 'Especes' ? 'Espèces' : mode}
              </button>
            ))}
          </div>
        </div>

        {/* Erreur */}
        {erreur && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4">
            <p className="text-sm text-red-600">{erreur}</p>
          </div>
        )}

        {/* Bouton */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-emerald-700 text-white text-sm font-medium py-3.5 rounded-xl disabled:opacity-60"
        >
          {loading ? 'Envoi en cours...' : 'Valider mon inscription'}
        </button>

        <p className="text-xs text-gray-400 text-center mt-4 leading-relaxed">
          En soumettant ce formulaire, vous confirmez votre intention de participer au Camp-Navs 2026.
        </p>
      </div>
    </div>
  )
}
