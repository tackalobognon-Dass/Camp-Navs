import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/admin/AdminLayout'

export default function AnnoncesAdminPage() {
  const [annonces, setAnnonces] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ titre: '', contenu: '', tag: 'Info', publie: true })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchAnnonces() }, [])

  async function fetchAnnonces() {
    const { data } = await supabase.from('annonces').select('*').order('created_at', { ascending: false })
    setAnnonces(data || [])
    setLoading(false)
  }

  async function handleAjouter() {
    if (!form.titre) return
    setSaving(true)
    await supabase.from('annonces').insert([form])
    setForm({ titre: '', contenu: '', tag: 'Info', publie: true })
    setSaving(false)
    fetchAnnonces()
  }

  async function togglePublie(id, publie) {
    await supabase.from('annonces').update({ publie: !publie }).eq('id', id)
    fetchAnnonces()
  }

  async function supprimerAnnonce(id) {
    if (!window.confirm('Supprimer cette annonce ?')) return
    await supabase.from('annonces').delete().eq('id', id)
    fetchAnnonces()
  }

  const tagColors = {
    Nouveau: 'bg-emerald-50 text-emerald-700',
    Important: 'bg-amber-50 text-amber-700',
    Document: 'bg-blue-50 text-blue-700',
    Info: 'bg-gray-100 text-gray-600',
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-xl font-medium text-gray-800">Annonces</h1>
        <p className="text-sm text-gray-400 mt-0.5">Publiez des actualités sur le portail public</p>
      </div>

      {/* Formulaire */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
        <h2 className="text-sm font-medium text-gray-700 mb-4">Nouvelle annonce</h2>
        <div className="mb-3">
          <label className="block text-xs text-gray-500 mb-1">Titre</label>
          <input
            type="text"
            value={form.titre}
            onChange={e => setForm({ ...form, titre: e.target.value })}
            placeholder="Ex : Programme officiel disponible"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400"
          />
        </div>
        <div className="mb-3">
          <label className="block text-xs text-gray-500 mb-1">Contenu</label>
          <textarea
            value={form.contenu}
            onChange={e => setForm({ ...form, contenu: e.target.value })}
            placeholder="Détails de l'annonce..."
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400 resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tag</label>
            <select
              value={form.tag}
              onChange={e => setForm({ ...form, tag: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none"
            >
              <option>Info</option>
              <option>Nouveau</option>
              <option>Important</option>
              <option>Document</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.publie}
                onChange={e => setForm({ ...form, publie: e.target.checked })}
                className="w-4 h-4 accent-emerald-700"
              />
              <span className="text-sm text-gray-600">Publier immédiatement</span>
            </label>
          </div>
        </div>
        <button
          onClick={handleAjouter}
          disabled={saving}
          className="w-full bg-emerald-700 text-white text-sm font-medium py-3 rounded-xl disabled:opacity-60"
        >
          {saving ? 'Publication...' : 'Publier l\'annonce'}
        </button>
      </div>

      {/* Liste */}
      <div className="space-y-3">
        {loading && <p className="text-sm text-gray-400 text-center py-8">Chargement...</p>}
        {annonces.map((a) => (
          <div key={a.id} className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tagColors[a.tag] || tagColors['Info']}`}>{a.tag}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${a.publie ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    {a.publie ? 'Publié' : 'Brouillon'}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-800">{a.titre}</p>
                {a.contenu && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{a.contenu}</p>}
                <p className="text-xs text-gray-300 mt-1">{new Date(a.created_at).toLocaleDateString('fr-FR')}</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => togglePublie(a.id, a.publie)}
                  className="text-xs border border-gray-200 text-gray-500 px-3 py-1.5 rounded-lg hover:bg-gray-50"
                >
                  {a.publie ? 'Dépublier' : 'Publier'}
                </button>
                <button
                  onClick={() => supprimerAnnonce(a.id)}
                  className="text-xs text-red-400 border border-red-100 rounded-lg px-3 py-1.5 hover:bg-red-50"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  )
}
