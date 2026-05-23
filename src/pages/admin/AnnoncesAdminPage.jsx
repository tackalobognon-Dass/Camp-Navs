import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/admin/AdminLayout'

const EMPTY_FORM = { titre: '', contenu: '', tag: 'Info', publie: true }

const tagColors = {
  Nouveau:   { bg: '#E1F5EE', color: '#085041' },
  Important: { bg: '#FAEEDA', color: '#854F0B' },
  Document:  { bg: '#E6F1FB', color: '#185FA5' },
  Info:      { bg: '#F1EFE8', color: '#5F5E5A' },
}

export default function AnnoncesAdminPage() {
  const [annonces, setAnnonces] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [menuOuvert, setMenuOuvert] = useState(null)
  const menuRef = useRef(null)

  useEffect(() => { fetchAnnonces() }, [])

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOuvert(null)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function fetchAnnonces() {
    const { data } = await supabase.from('annonces').select('*').order('created_at', { ascending: false })
    setAnnonces(data || [])
    setLoading(false)
  }

  function openNew() {
    setForm(EMPTY_FORM)
    setEditId(null)
    setShowForm(true)
  }

  function openEdit(a) {
    setForm({ titre: a.titre, contenu: a.contenu || '', tag: a.tag, publie: a.publie })
    setEditId(a.id)
    setShowForm(true)
    setMenuOuvert(null)
  }

  async function handleSave() {
    if (!form.titre) return
    setSaving(true)
    if (editId) {
      await supabase.from('annonces').update(form).eq('id', editId)
    } else {
      await supabase.from('annonces').insert([form])
    }
    setForm(EMPTY_FORM)
    setEditId(null)
    setShowForm(false)
    setSaving(false)
    fetchAnnonces()
  }

  async function togglePublie(id, publie) {
    await supabase.from('annonces').update({ publie: !publie }).eq('id', id)
    setMenuOuvert(null)
    fetchAnnonces()
  }

  async function supprimerAnnonce(id) {
    if (!window.confirm('Supprimer cette annonce ?')) return
    await supabase.from('annonces').delete().eq('id', id)
    setMenuOuvert(null)
    fetchAnnonces()
  }

  return (
    <AdminLayout>
      <div className="mb-5 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-medium text-gray-800">Annonces</h1>
          <p className="text-sm text-gray-400 mt-0.5">{annonces.length} annonce(s)</p>
        </div>
        <button onClick={() => { showForm && !editId ? setShowForm(false) : openNew() }}
          className="bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-xl flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showForm && !editId ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"} />
          </svg>
          {showForm && !editId ? 'Fermer' : 'Nouvelle annonce'}
        </button>
      </div>

      {/* Formulaire caché */}
      {showForm && (
        <div className="bg-white border border-gray-100 rounded-xl p-4 mb-5">
          <h2 className="text-sm font-medium text-gray-700 mb-4">
            {editId ? 'Modifier l\'annonce' : 'Nouvelle annonce'}
          </h2>
          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-1">Titre *</label>
            <input type="text" value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })}
              placeholder="Ex : Programme officiel disponible"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400" />
          </div>
          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-1">Contenu</label>
            <textarea value={form.contenu} onChange={e => setForm({ ...form, contenu: e.target.value })}
              placeholder="Détails de l'annonce..."
              rows={3} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tag</label>
              <select value={form.tag} onChange={e => setForm({ ...form, tag: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none">
                <option>Info</option>
                <option>Nouveau</option>
                <option>Important</option>
                <option>Document</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.publie} onChange={e => setForm({ ...form, publie: e.target.checked })}
                  className="w-4 h-4 accent-emerald-700" />
                <span className="text-sm text-gray-600">Publier</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setShowForm(false); setEditId(null) }}
              className="flex-1 bg-gray-100 text-gray-600 text-sm font-medium py-3 rounded-xl">Annuler</button>
            <button onClick={handleSave} disabled={saving || !form.titre}
              className="flex-1 bg-emerald-700 text-white text-sm font-medium py-3 rounded-xl disabled:opacity-60">
              {saving ? 'Enregistrement...' : editId ? 'Modifier' : 'Publier'}
            </button>
          </div>
        </div>
      )}

      {/* Liste */}
      {loading && <p className="text-sm text-gray-400 text-center py-8">Chargement...</p>}
      {!loading && annonces.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-6 text-center">
          <p className="text-sm text-gray-400">Aucune annonce publiée.</p>
          <button onClick={openNew} className="mt-3 text-sm text-emerald-700 font-medium">+ Créer la première annonce</button>
        </div>
      )}

      <div className="space-y-2" ref={menuRef}>
        {annonces.map(a => {
          const tc = tagColors[a.tag] || tagColors['Info']
          return (
            <div key={a.id} className="bg-white border border-gray-100 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span style={{ fontSize: 10, fontWeight: 500, background: tc.bg, color: tc.color, borderRadius: 4, padding: '2px 8px' }}>{a.tag}</span>
                    <span style={{ fontSize: 10, background: a.publie ? '#E1F5EE' : '#F1EFE8', color: a.publie ? '#085041' : '#888', borderRadius: 4, padding: '2px 8px' }}>
                      {a.publie ? 'Publié' : 'Brouillon'}
                    </span>
                    <span className="text-xs text-gray-300">{new Date(a.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-800">{a.titre}</p>
                  {a.contenu && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{a.contenu}</p>}
                </div>

                {/* Menu ... */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <button onClick={() => setMenuOuvert(menuOuvert === a.id ? null : a.id)}
                    style={{ width: 30, height: 30, borderRadius: 8, background: '#f5f5f3', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#666' }}>
                    ···
                  </button>
                  {menuOuvert === a.id && (
                    <div style={{ position: 'absolute', right: 0, top: 34, background: '#fff', borderRadius: 10, border: '0.5px solid #e5e5e0', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', zIndex: 20, minWidth: 150, overflow: 'hidden' }}>
                      <button onClick={() => openEdit(a)}
                        style={{ width: '100%', padding: '10px 14px', fontSize: 13, color: '#1a1a1a', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        Modifier
                      </button>
                      <div style={{ height: '0.5px', background: '#f0f0ee' }} />
                      <button onClick={() => togglePublie(a.id, a.publie)}
                        style={{ width: '100%', padding: '10px 14px', fontSize: 13, color: '#185FA5', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        {a.publie ? 'Dépublier' : 'Publier'}
                      </button>
                      <div style={{ height: '0.5px', background: '#f0f0ee' }} />
                      <button onClick={() => supprimerAnnonce(a.id)}
                        style={{ width: '100%', padding: '10px 14px', fontSize: 13, color: '#A32D2D', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Supprimer
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </AdminLayout>
  )
}
