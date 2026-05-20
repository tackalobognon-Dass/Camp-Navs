import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/admin/AdminLayout'

const EMPTY_FORM = { titre: '', artiste: '', ordre: '', paroles: '' }

export default function ChantsAdminPage() {
  const [chants, setChants] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)
  const [fichierAudio, setFichierAudio] = useState(null)
  const [saving, setSaving] = useState(false)
  const [erreur, setErreur] = useState('')

  useEffect(() => { fetchChants() }, [])

  async function fetchChants() {
    const { data } = await supabase.from('chants').select('*').order('ordre', { ascending: true })
    setChants(data || [])
    setLoading(false)
  }

  function setF(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function openNew() {
    setForm(EMPTY_FORM)
    setEditId(null)
    setFichierAudio(null)
    setErreur('')
    setShowForm(true)
  }

  function openEdit(chant) {
    setForm({
      titre: chant.titre,
      artiste: chant.artiste || '',
      ordre: chant.ordre || '',
      paroles: chant.paroles || '',
    })
    setEditId(chant.id)
    setFichierAudio(null)
    setErreur('')
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.titre) return
    setSaving(true)
    setErreur('')

    let lien_audio = editId ? chants.find(c => c.id === editId)?.lien_audio : ''

    if (fichierAudio) {
      const ext = fichierAudio.name.split('.').pop().toLowerCase()
      const nomFichier = `${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('chants-audio')
        .upload(nomFichier, fichierAudio, { cacheControl: '3600', upsert: true })
      if (uploadError) {
        setErreur(`Erreur audio : ${uploadError.message}`)
        setSaving(false)
        return
      }
      const { data: urlData } = supabase.storage.from('chants-audio').getPublicUrl(nomFichier)
      lien_audio = urlData.publicUrl
    }

    const payload = {
      titre: form.titre,
      artiste: form.artiste,
      ordre: form.ordre ? parseInt(form.ordre) : chants.length + 1,
      paroles: form.paroles,
      lien_audio,
    }

    if (editId) {
      await supabase.from('chants').update(payload).eq('id', editId)
    } else {
      await supabase.from('chants').insert([payload])
    }

    setSaving(false)
    setShowForm(false)
    setEditId(null)
    setForm(EMPTY_FORM)
    setFichierAudio(null)
    fetchChants()
  }

  async function supprimerChant(chant) {
    if (!window.confirm('Supprimer ce chant ?')) return
    if (chant.lien_audio) {
      const nomFichier = chant.lien_audio.split('/').pop()
      await supabase.storage.from('chants-audio').remove([nomFichier])
    }
    await supabase.from('chants').delete().eq('id', chant.id)
    fetchChants()
  }

  return (
    <AdminLayout>
      <div className="mb-5 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-medium text-gray-800">Chants</h1>
          <p className="text-sm text-gray-400 mt-0.5">{chants.length} chant(s) dans le répertoire</p>
        </div>
        <button onClick={() => { showForm ? setShowForm(false) : openNew() }}
          className="bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-xl flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showForm ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"} />
          </svg>
          {showForm ? 'Fermer' : 'Ajouter un chant'}
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-5">
          <h2 className="text-sm font-medium text-gray-700 mb-4">
            {editId ? 'Modifier le chant' : 'Nouveau chant'}
          </h2>

          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-1">Titre *</label>
            <input type="text" value={form.titre} onChange={e => setF('titre', e.target.value)}
              placeholder="Ex : Grand Dieu nous te louons"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400" />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Artiste</label>
              <input type="text" value={form.artiste} onChange={e => setF('artiste', e.target.value)}
                placeholder="Ex : Navigateurs CI"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Ordre</label>
              <input type="number" value={form.ordre} onChange={e => setF('ordre', e.target.value)}
                placeholder="Ex : 1"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400" />
            </div>
          </div>

          {/* Audio */}
          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-1">Fichier audio (MP3, WAV, M4A)</label>
            <div className="border border-dashed border-gray-300 rounded-xl p-3 text-center">
              {fichierAudio ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                    </div>
                    <span className="text-xs text-gray-700 truncate max-w-40">{fichierAudio.name}</span>
                  </div>
                  <button onClick={() => setFichierAudio(null)} className="text-red-400 text-xs">Retirer</button>
                </div>
              ) : (
                <label className="cursor-pointer">
                  <svg className="w-7 h-7 text-gray-300 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <p className="text-xs text-gray-400">Appuyez pour sélectionner un fichier audio</p>
                  <input type="file" accept="audio/*" className="hidden" onChange={e => setFichierAudio(e.target.files[0])} />
                </label>
              )}
            </div>
            {editId && chants.find(c => c.id === editId)?.lien_audio && !fichierAudio && (
              <p className="text-xs text-emerald-700 mt-1">Audio existant conservé si pas de nouveau fichier</p>
            )}
          </div>

          {/* Paroles */}
          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-1">Paroles</label>
            <textarea value={form.paroles} onChange={e => setF('paroles', e.target.value)}
              placeholder="Saisissez les paroles du chant ici..."
              rows={6}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400 resize-none leading-relaxed" />
          </div>

          {erreur && (
            <div className="mb-3 bg-red-50 border border-red-100 rounded-xl p-3">
              <p className="text-xs text-red-600">{erreur}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => { setShowForm(false); setEditId(null) }}
              className="flex-1 bg-gray-100 text-gray-600 text-sm font-medium py-3 rounded-xl">
              Annuler
            </button>
            <button onClick={handleSave} disabled={saving || !form.titre}
              className="flex-1 bg-emerald-700 text-white text-sm font-medium py-3 rounded-xl disabled:opacity-60">
              {saving ? 'Enregistrement...' : editId ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </div>
      )}

      {/* Liste chants */}
      {loading && <p className="text-sm text-gray-400 text-center py-8">Chargement...</p>}

      {!loading && chants.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-6 text-center">
          <p className="text-sm text-gray-400">Aucun chant dans le répertoire.</p>
          <button onClick={openNew} className="mt-3 text-sm text-emerald-700 font-medium">
            + Ajouter le premier chant
          </button>
        </div>
      )}

      <div className="space-y-2">
        {chants.map((c, i) => (
          <div key={c.id} className="bg-white border border-gray-100 rounded-xl p-3 flex items-center gap-3">
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#085041' }}>{c.ordre || i + 1}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{c.titre}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {c.artiste && <span className="text-xs text-gray-400">{c.artiste}</span>}
                {c.lien_audio && (
                  <span style={{ fontSize: 9, color: '#085041', background: '#E1F5EE', borderRadius: 20, padding: '1px 6px' }}>Audio</span>
                )}
                {c.paroles && (
                  <span style={{ fontSize: 9, color: '#534AB7', background: '#EEEDFE', borderRadius: 20, padding: '1px 6px' }}>Paroles</span>
                )}
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => openEdit(c)}
                style={{ width: 32, height: 32, borderRadius: 8, background: '#E1F5EE', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg style={{ width: 14, height: 14, color: '#085041' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button onClick={() => supprimerChant(c)}
                style={{ width: 32, height: 32, borderRadius: 8, background: '#FCEBEB', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg style={{ width: 14, height: 14, color: '#A32D2D' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  )
}
