import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/admin/AdminLayout'

export default function ChantsAdminPage() {
  const [chants, setChants] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ titre: '', artiste: '', lien_audio: '', lien_paroles: '', ordre: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchChants() }, [])

  async function fetchChants() {
    const { data } = await supabase.from('chants').select('*').order('ordre', { ascending: true })
    setChants(data || [])
    setLoading(false)
  }

  async function handleAjouter() {
    if (!form.titre) return
    setSaving(true)
    await supabase.from('chants').insert([{
      titre: form.titre,
      artiste: form.artiste,
      lien_audio: form.lien_audio,
      lien_paroles: form.lien_paroles,
      ordre: form.ordre ? parseInt(form.ordre) : chants.length + 1,
    }])
    setForm({ titre: '', artiste: '', lien_audio: '', lien_paroles: '', ordre: '' })
    setSaving(false)
    fetchChants()
  }

  async function supprimerChant(id) {
    if (!window.confirm('Supprimer ce chant ?')) return
    await supabase.from('chants').delete().eq('id', id)
    fetchChants()
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-xl font-medium text-gray-800">Chants</h1>
        <p className="text-sm text-gray-400 mt-0.5">{chants.length} chant(s) dans le répertoire</p>
      </div>

      {/* Formulaire */}
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
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Lien audio (YouTube ou MP3)</label>
            <input type="text" value={form.lien_audio} onChange={e => setForm({ ...form, lien_audio: e.target.value })}
              placeholder="https://..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Lien paroles (PDF)</label>
            <input type="text" value={form.lien_paroles} onChange={e => setForm({ ...form, lien_paroles: e.target.value })}
              placeholder="https://..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400" />
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-xs text-gray-500 mb-1">Ordre d'affichage</label>
          <input type="number" value={form.ordre} onChange={e => setForm({ ...form, ordre: e.target.value })}
            placeholder="Ex : 1"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400" />
        </div>
        <button onClick={handleAjouter} disabled={saving}
          className="w-full bg-emerald-700 text-white text-sm font-medium py-3 rounded-xl disabled:opacity-60">
          {saving ? 'Enregistrement...' : 'Ajouter le chant'}
        </button>
      </div>

      {/* Liste */}
      {loading && <p className="text-sm text-gray-400 text-center py-8">Chargement...</p>}
      <div className="space-y-2">
        {chants.map((c, i) => (
          <div key={c.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-4">
            <span className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium flex items-center justify-center flex-shrink-0">{i + 1}</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">{c.titre}</p>
              {c.artiste && <p className="text-xs text-gray-400">{c.artiste}</p>}
              <div className="flex gap-3 mt-1">
                {c.lien_audio && <a href={c.lien_audio} target="_blank" rel="noreferrer" className="text-xs text-emerald-700">Audio</a>}
                {c.lien_paroles && <a href={c.lien_paroles} target="_blank" rel="noreferrer" className="text-xs text-blue-600">Paroles</a>}
              </div>
            </div>
            <button onClick={() => supprimerChant(c.id)} className="text-gray-300 hover:text-red-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </AdminLayout>
  )
}
