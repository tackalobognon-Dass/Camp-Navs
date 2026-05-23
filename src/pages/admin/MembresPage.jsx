import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/admin/AdminLayout'

const COULEURS_AVATAR = [
  { bg: '#E1F5EE', color: '#085041' },
  { bg: '#E6F1FB', color: '#185FA5' },
  { bg: '#FAEEDA', color: '#854F0B' },
  { bg: '#EEEDFE', color: '#534AB7' },
  { bg: '#FAECE7', color: '#993C1D' },
  { bg: '#EAF3DE', color: '#3B6D11' },
]

const EMPTY_FORM = { nom_complet: '', role: '', telephone: '', email: '', commission: '' }

export default function MembresPage() {
  const [membres, setMembres] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [recherche, setRecherche] = useState('')
  const [menuOuvert, setMenuOuvert] = useState(null)
  const menuRef = useRef(null)

  useEffect(() => { fetchMembres() }, [])

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOuvert(null)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function fetchMembres() {
    const { data } = await supabase.from('bureau_membres').select('*').order('role', { ascending: true })
    setMembres(data || [])
    setLoading(false)
  }

  function setF(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function openNew() { setForm(EMPTY_FORM); setEditId(null); setShowForm(true) }

  function openEdit(m) {
    setForm({ nom_complet: m.nom_complet, role: m.role || '', telephone: m.telephone || '', email: m.email || '', commission: m.commission || '' })
    setEditId(m.id)
    setShowForm(true)
    setMenuOuvert(null)
  }

  async function handleSave() {
    if (!form.nom_complet || !form.role) return
    setSaving(true)
    if (editId) {
      await supabase.from('bureau_membres').update(form).eq('id', editId)
    } else {
      await supabase.from('bureau_membres').insert([form])
    }
    setSaving(false)
    setShowForm(false)
    setEditId(null)
    setForm(EMPTY_FORM)
    fetchMembres()
  }

  async function supprimerMembre(id) {
    if (!window.confirm('Supprimer ce membre ?')) return
    await supabase.from('bureau_membres').delete().eq('id', id)
    setMenuOuvert(null)
    fetchMembres()
  }

  async function monterOrdre(index) {
    if (index === 0) return
    const newList = [...membres]
    ;[newList[index], newList[index - 1]] = [newList[index - 1], newList[index]]
    setMembres(newList)
    setMenuOuvert(null)
  }

  async function descendreOrdre(index) {
    if (index === membres.length - 1) return
    const newList = [...membres]
    ;[newList[index], newList[index + 1]] = [newList[index + 1], newList[index]]
    setMembres(newList)
    setMenuOuvert(null)
  }

  const filtres = membres.filter(m =>
    m.nom_complet.toLowerCase().includes(recherche.toLowerCase()) ||
    (m.role && m.role.toLowerCase().includes(recherche.toLowerCase())) ||
    (m.commission && m.commission.toLowerCase().includes(recherche.toLowerCase()))
  )

  function getAvatar(nom, index) {
    const c = COULEURS_AVATAR[index % COULEURS_AVATAR.length]
    return { initiales: nom.slice(0, 2).toUpperCase(), ...c }
  }

  return (
    <AdminLayout>
      <div className="mb-5 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-medium text-gray-800">Membres du bureau</h1>
          <p className="text-sm text-gray-400 mt-0.5">{membres.length} membre(s)</p>
        </div>
        <button onClick={() => { showForm && !editId ? setShowForm(false) : openNew() }}
          className="bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-xl flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showForm && !editId ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"} />
          </svg>
          {showForm && !editId ? 'Fermer' : 'Ajouter'}
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="bg-white border border-gray-100 rounded-xl p-4 mb-5">
          <h2 className="text-sm font-medium text-gray-700 mb-4">{editId ? 'Modifier' : 'Nouveau membre'}</h2>
          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-1">Nom complet *</label>
            <input type="text" value={form.nom_complet} onChange={e => setF('nom_complet', e.target.value)}
              placeholder="Ex : N'DRI SERGE PACOME"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400" />
          </div>
          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-1">Rôle *</label>
            <input type="text" value={form.role} onChange={e => setF('role', e.target.value)}
              placeholder="Ex : Directeur du camp"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400" />
          </div>
          <div className="mb-3">
            <label className="block text-xs text-gray-500 mb-1">Commission</label>
            <input type="text" value={form.commission} onChange={e => setF('commission', e.target.value)}
              placeholder="Ex : Logistique, Louange..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400" />
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Téléphone</label>
              <input type="text" value={form.telephone} onChange={e => setF('telephone', e.target.value)}
                placeholder="07 XX XX XX XX"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => setF('email', e.target.value)}
                placeholder="email@exemple.com"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setShowForm(false); setEditId(null) }}
              className="flex-1 bg-gray-100 text-gray-600 text-sm font-medium py-3 rounded-xl">Annuler</button>
            <button onClick={handleSave} disabled={saving || !form.nom_complet || !form.role}
              className="flex-1 bg-emerald-700 text-white text-sm font-medium py-3 rounded-xl disabled:opacity-60">
              {saving ? 'Enregistrement...' : editId ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </div>
      )}

      {/* Recherche */}
      <input type="text" value={recherche} onChange={e => setRecherche(e.target.value)}
        placeholder="Rechercher..."
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-4 bg-white outline-none focus:border-emerald-400" />

      {loading && <p className="text-sm text-gray-400 text-center py-8">Chargement...</p>}
      {!loading && membres.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-6 text-center">
          <p className="text-sm text-gray-400">Aucun membre enregistré.</p>
          <button onClick={openNew} className="mt-3 text-sm text-emerald-700 font-medium">+ Ajouter le premier membre</button>
        </div>
      )}

      {/* Liste compacte */}
      <div className="space-y-1.5" ref={menuRef}>
        {filtres.map((m, index) => {
          const av = getAvatar(m.nom_complet, index)
          const infos = [m.commission, m.telephone].filter(Boolean).join(' · ')
          return (
            <div key={m.id} style={{ background: '#fff', borderRadius: 10, border: '0.5px solid #e5e5e0', padding: '10px 12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Avatar compact */}
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: av.bg, color: av.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
                  {av.initiales}
                </div>

                {/* Infos compactes */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{m.nom_complet}</p>
                    <span style={{ fontSize: 10, color: '#085041', fontWeight: 500, flexShrink: 0 }}>{m.role}</span>
                  </div>
                  {infos && <p style={{ fontSize: 11, color: '#aaa', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{infos}</p>}
                </div>

                {/* Menu ... */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <button onClick={() => setMenuOuvert(menuOuvert === m.id ? null : m.id)}
                    style={{ width: 28, height: 28, borderRadius: 7, background: '#f5f5f3', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: '#666' }}>
                    ···
                  </button>
                  {menuOuvert === m.id && (
                    <div style={{ position: 'absolute', right: 0, top: 32, background: '#fff', borderRadius: 10, border: '0.5px solid #e5e5e0', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', zIndex: 20, minWidth: 160, overflow: 'hidden' }}>
                      <button onClick={() => openEdit(m)}
                        style={{ width: '100%', padding: '9px 14px', fontSize: 13, color: '#1a1a1a', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                        Modifier
                      </button>
                      <div style={{ height: '0.5px', background: '#f0f0ee' }} />
                      <button onClick={() => monterOrdre(index)}
                        style={{ width: '100%', padding: '9px 14px', fontSize: 13, color: '#1a1a1a', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                        Monter
                      </button>
                      <div style={{ height: '0.5px', background: '#f0f0ee' }} />
                      <button onClick={() => descendreOrdre(index)}
                        style={{ width: '100%', padding: '9px 14px', fontSize: 13, color: '#1a1a1a', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                        Descendre
                      </button>
                      <div style={{ height: '0.5px', background: '#f0f0ee' }} />
                      <button onClick={() => supprimerMembre(m.id)}
                        style={{ width: '100%', padding: '9px 14px', fontSize: 13, color: '#A32D2D', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
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
