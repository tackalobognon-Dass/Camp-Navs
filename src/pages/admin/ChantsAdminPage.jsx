import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/admin/AdminLayout'

export default function ChantsAdminPage() {
  const [chants, setChants] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ titre: '', artiste: '', lien_paroles: '', ordre: '' })
  const [fichierAudio, setFichierAudio] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  useEffect(() => { fetchChants() }, [])

  async function fetchChants() {
    const { data } = await supabase.from('chants').select('*').order('ordre', { ascending: true })
    setChants(data || [])
    setLoading(false)
  }

  async function handleAjouter() {
    if (!form.titre) return
    setSaving(true)
    setUploadProgress(0)

    let lien_audio = ''

    if (fichierAudio) {
      const ext = fichierAudio.name.split('.').pop()
      const nomFichier = `${Date.now()}_${form.titre.replace(/\s+/g, '_')}.${ext}`
      const { data, error } = await supabase.storage
        .from('chants-audio')
        .upload(nomFichier, fichierAudio, {
          cacheControl: '3600',
          upsert: false,
        })
      if (!error) {
        const { data: urlData } = supabase.storage.from('chants-audio').getPublicUrl(nomFichier)
        lien_audio = urlData.publicUrl
      }
      setUploadProgress(100)
    }

    await supabase.from('chants').insert([{
      titre: form.titre,
      artiste: form.artiste,
      lien_audio,
      lien_paroles: form.lien_paroles,
      ordre: form.ordre ? parseInt(form.ordre) : chants.length + 1,
    }])

    setForm({ titre: '', artiste: '', lien_paroles: '', ordre: '' })
    setFichierAudio(null)
    setUploadProgress(0)
    setSaving(false)
    fetchChants()
  }

  async function supprimerChant(id, lien_audio) {
    if (!window.confirm('Supprimer ce chant ?')) return
    if (lien_audio && lien_audio.includes('chants-audio')) {
      const nomFichier = lien_audio.split('/').pop()
      await supabase.storage.from('chants-audio').remove([nomFichier])
    }
    await supabase.from('chants').delete().eq('id', id)
    fetchChants()
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-xl font-medium text-gray-800">Chants</h1>
        <p className="text-sm text-gray-400 mt-0.5">{chants.length} chant(s) dans le répertoire</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
        <h2 className="text-sm font-medium text-gray-700 mb-4">Ajouter un chant</h2>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Titre *</label>
            <input type="text" value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })}
              placeholder="Ex : Grand Dieu nous te louons"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Artiste</label>
            <input type="text" value={form.artiste} onChange={e => setForm({ ...form, artiste: e.target.value })}
              placeholder="Ex : Louange traditionnelle"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400" />
          </div>
        </div>

        <div className="mb-3">
          <label className="block text-xs text-gray-500 mb-1">Fichier audio (MP3, WAV, M4A)</label>
          <div className="border border-dashed border-gray-300 rounded-xl p-4 text-center">
            {fichierAudio ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                  <span className="text-sm text-gray-700 truncate max-w-48">{fichierAudio.name}</span>
                </div>
                <button onClick={() => setFichierAudio(null)} className="text-red-400 text-xs">Retirer</button>
              </div>
            ) : (
              <label className="cursor-pointer">
                <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <p className="text-sm text-gray-400">Appuyez pour sélectionner un fichier audio</p>
                <p className="text-xs text-gray-300 mt-1">MP3, WAV, M4A — max 50 MB</p>
                <input type="file" accept="audio/*" className="hidden" onChange={e => setFichierAudio(e.target.files[0])} />
              </label>
            )}
          </div>
        </div>

        {saving && fichierAudio && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Upload en cours...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="bg-gray-100 rounded-full h-1.5">
              <div className="bg-emerald-700 h-1.5 rounded-full transition-all" style={{ width: `${uploadProgress}%` }}></div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Lien paroles (PDF ou URL)</label>
            <input type="text" value={form.lien_paroles} onChange={e => setForm({ ...form, lien_paroles: e.target.value })}
              placeholder="https://..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Ordre d'affichage</label>
            <input type="number" value={form.ordre} onChange={e => setForm({ ...form, ordre: e.target.value })}
              placeholder="Ex : 1"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400" />
          </div>
        </div>

        <button onClick={handleAjouter} disabled={saving}
          className="w-full bg-emerald-700 text-white text-sm font-medium py-3 rounded-xl disabled:opacity-60">
          {saving ? 'Upload en cours...' : 'Ajouter le chant'}
        </button>
      </div>

      {loading && <p className="text-sm text-gray-400 text-center py-8">Chargement...</p>}
      <div className="space-y-2">
        {chants.map((c, i) => (
          <div key={c.id} className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium flex items-center justify-center flex-shrink-0">{i + 1}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{c.titre}</p>
                {c.artiste && <p className="text-xs text-gray-400">{c.artiste}</p>}
                {c.lien_audio && (
                  <audio controls className="mt-2 w-full" style={{ height: '32px' }}>
                    <source src={c.lien_audio} />
                  </audio>
                )}
                {c.lien_paroles && (
                  <a href={c.lien_paroles} target="_blank" rel="noreferrer" className="text-xs text-blue-600 mt-1 block">Paroles</a>
                )}
              </div>
              <button onClick={() => supprimerChant(c.id, c.lien_audio)} className="text-gray-300 hover:text-red-400 flex-shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
