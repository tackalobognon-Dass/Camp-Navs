import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/admin/AdminLayout'

export default function DocumentsAdminPage() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ nom: '', description: '', lien_fichier: '', taille: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchDocuments() }, [])

  async function fetchDocuments() {
    const { data } = await supabase.from('documents').select('*').order('created_at', { ascending: false })
    setDocuments(data || [])
    setLoading(false)
  }

  async function handleAjouter() {
    if (!form.nom || !form.lien_fichier) return
    setSaving(true)
    await supabase.from('documents').insert([form])
    setForm({ nom: '', description: '', lien_fichier: '', taille: '' })
    setSaving(false)
    fetchDocuments()
  }

  async function supprimerDocument(id) {
    if (!window.confirm('Supprimer ce document ?')) return
    await supabase.from('documents').delete().eq('id', id)
    fetchDocuments()
  }

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-xl font-medium text-gray-800">Documents</h1>
        <p className="text-sm text-gray-400 mt-0.5">Gérez les fichiers téléchargeables du portail</p>
      </div>

      {/* Formulaire */}
      <div className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
        <h2 className="text-sm font-medium text-gray-700 mb-4">Ajouter un document</h2>
        <div className="mb-3">
          <label className="block text-xs text-gray-500 mb-1">Nom du document *</label>
          <input type="text" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })}
            placeholder="Ex : Manuel du camp 2026"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400" />
        </div>
        <div className="mb-3">
          <label className="block text-xs text-gray-500 mb-1">Description</label>
          <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Ex : Guide complet des études bibliques"
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400" />
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Lien du fichier *</label>
            <input type="text" value={form.lien_fichier} onChange={e => setForm({ ...form, lien_fichier: e.target.value })}
              placeholder="https://..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Taille</label>
            <input type="text" value={form.taille} onChange={e => setForm({ ...form, taille: e.target.value })}
              placeholder="Ex : 2.4 MB"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400" />
          </div>
        </div>
        <button onClick={handleAjouter} disabled={saving}
          className="w-full bg-emerald-700 text-white text-sm font-medium py-3 rounded-xl disabled:opacity-60">
          {saving ? 'Enregistrement...' : 'Ajouter le document'}
        </button>
      </div>

      {/* Liste */}
      {loading && <p className="text-sm text-gray-400 text-center py-8">Chargement...</p>}
      <div className="space-y-3">
        {documents.map((doc) => (
          <div key={doc.id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">{doc.nom}</p>
              {doc.description && <p className="text-xs text-gray-400">{doc.description}</p>}
              {doc.taille && <p className="text-xs text-gray-300">{doc.taille}</p>}
            </div>
            <div className="flex gap-2">
              <a href={doc.lien_fichier} target="_blank" rel="noreferrer"
                className="text-xs border border-gray-200 text-gray-500 px-3 py-1.5 rounded-lg">
                Voir
              </a>
              <button onClick={() => supprimerDocument(doc.id)} className="text-gray-300 hover:text-red-400">
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
