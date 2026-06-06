import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/admin/AdminLayout'

const VERT = '#1B3B2B'
const EMPTY_FORM = { titre: '', contenu: '', tag: 'Info', publie: true }
const tagColors = {
  Nouveau:   { bg: '#DCFCE7', color: '#166534' },
  Important: { bg: '#FEF9C3', color: '#854D0E' },
  Document:  { bg: '#DBEAFE', color: '#1E40AF' },
  Info:      { bg: '#F1F5F9', color: '#475569' },
}

export default function AnnoncesAdminPage() {
  const [annonces, setAnnonces] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [menuOuvert, setMenuOuvert] = useState(null)
  const [carteOuverte, setCarteOuverte] = useState(null)
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

  function openNew() { setForm(EMPTY_FORM); setEditId(null); setShowForm(true) }
  function openEdit(a) { setForm({ titre: a.titre, contenu: a.contenu || '', tag: a.tag, publie: a.publie }); setEditId(a.id); setShowForm(true); setMenuOuvert(null) }

  async function handleSave() {
    if (!form.titre) return
    setSaving(true)
    if (editId) await supabase.from('annonces').update(form).eq('id', editId)
    else await supabase.from('annonces').insert([form])
    setForm(EMPTY_FORM); setEditId(null); setShowForm(false); setSaving(false)
    fetchAnnonces()
  }

  async function togglePublie(id, publie) {
    await supabase.from('annonces').update({ publie: !publie }).eq('id', id)
    setMenuOuvert(null); fetchAnnonces()
  }

  async function supprimerAnnonce(id) {
    if (!window.confirm('Supprimer cette annonce ?')) return
    await supabase.from('annonces').delete().eq('id', id)
    setMenuOuvert(null); fetchAnnonces()
  }

  function toggleCarte(id) {
    setCarteOuverte(prev => prev === id ? null : id)
  }

  const inputStyle = { width: '100%', border: '1px solid #E2E8F0', borderRadius: 10, padding: '9px 12px', fontSize: 13, outline: 'none', background: '#fff', color: '#1E293B' }

  return (
    <AdminLayout>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1E293B', margin: 0 }}>Annonces</h1>
          <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 0' }}>{annonces.length} annonce(s)</p>
        </div>
        <button type="button" onClick={() => showForm && !editId ? setShowForm(false) : openNew()}
          style={{ width: 32, height: 32, borderRadius: '50%', background: showForm && !editId ? '#FEF2F2' : VERT, color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 300, flexShrink: 0 }}>
          {showForm && !editId ? '×' : '+'}
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: '14px', marginBottom: 14 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', margin: '0 0 12px' }}>
            {editId ? "Modifier l'annonce" : 'Nouvelle annonce'}
          </p>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4, fontWeight: 500 }}>Titre *</label>
            <input type="text" value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })}
              placeholder="Ex : Programme officiel disponible" style={inputStyle} />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4, fontWeight: 500 }}>Contenu</label>
            <textarea value={form.contenu} onChange={e => setForm({ ...form, contenu: e.target.value })}
              placeholder="Détails de l'annonce..." rows={3}
              style={{ ...inputStyle, resize: 'none' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4, fontWeight: 500 }}>Tag</label>
              <select value={form.tag} onChange={e => setForm({ ...form, tag: e.target.value })} style={inputStyle}>
                <option>Info</option><option>Nouveau</option><option>Important</option><option>Document</option>
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 2 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.publie} onChange={e => setForm({ ...form, publie: e.target.checked })}
                  style={{ width: 16, height: 16, accentColor: VERT }} />
                <span style={{ fontSize: 13, color: '#475569' }}>Publier</span>
              </label>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => { setShowForm(false); setEditId(null) }}
              style={{ flex: 1, background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 10, padding: '10px', fontSize: 13, cursor: 'pointer' }}>
              Annuler
            </button>
            <button type="button" onClick={handleSave} disabled={saving || !form.titre}
              style={{ flex: 1, background: VERT, color: '#fff', border: 'none', borderRadius: 10, padding: '10px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving || !form.titre ? 0.7 : 1 }}>
              {saving ? '...' : editId ? 'Modifier' : 'Publier'}
            </button>
          </div>
        </div>
      )}

      {/* Liste */}
      {loading && <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '20px 0' }}>Chargement...</p>}
      {!loading && annonces.length === 0 && (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: '28px', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: '#94A3B8', margin: '0 0 10px' }}>Aucune annonce publiée.</p>
          <button type="button" onClick={openNew} style={{ fontSize: 13, color: VERT, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
            + Créer la première annonce
          </button>
        </div>
      )}

      <div ref={menuRef} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {annonces.map(a => {
          const tc = tagColors[a.tag] || tagColors['Info']
          const ouverte = carteOuverte === a.id

          return (
            <div key={a.id}
              style={{ background: '#fff', borderRadius: 12, border: `1px solid ${ouverte ? '#CBD5E1' : '#E2E8F0'}`, padding: '10px 12px', transition: 'border-color .2s', cursor: 'pointer' }}
              onClick={() => toggleCarte(a.id)}>

              {/* Ligne 1 — badges + date + menu */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 9, fontWeight: 600, background: tc.bg, color: tc.color, borderRadius: 20, padding: '2px 8px' }}>{a.tag}</span>
                  <span style={{ fontSize: 9, fontWeight: 600, background: a.publie ? '#DCFCE7' : '#F1F5F9', color: a.publie ? '#166534' : '#64748B', borderRadius: 20, padding: '2px 8px' }}>
                    {a.publie ? 'Publié' : 'Brouillon'}
                  </span>
                  <span style={{ fontSize: 10, color: '#CBD5E1' }}>{new Date(a.created_at).toLocaleDateString('fr-FR')}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  {/* Chevron */}
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#94A3B8" strokeWidth="2"
                    style={{ transition: 'transform .25s', transform: ouverte ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                  </svg>

                  {/* Menu ··· */}
                  <div style={{ position: 'relative' }}>
                    <button type="button" onClick={e => { e.stopPropagation(); setMenuOuvert(menuOuvert === a.id ? null : a.id) }}
                      style={{ width: 28, height: 28, borderRadius: 8, background: '#F8FAFC', border: '1px solid #E2E8F0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#94A3B8', letterSpacing: 1 }}>
                      ···
                    </button>
                    {menuOuvert === a.id && (
                      <div style={{ position: 'absolute', right: 0, top: 32, background: '#fff', borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', zIndex: 20, minWidth: 155, overflow: 'hidden' }}>
                        {[
                          { label: 'Modifier', color: '#1E293B', action: () => openEdit(a), icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
                          { label: a.publie ? 'Dépublier' : 'Publier', color: '#1D4ED8', action: () => togglePublie(a.id, a.publie), icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' },
                          { label: 'Supprimer', color: '#DC2626', action: () => supprimerAnnonce(a.id), icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' },
                        ].map((item, i, arr) => (
                          <div key={item.label}>
                            <button type="button" onClick={e => { e.stopPropagation(); item.action() }}
                              style={{ width: '100%', padding: '9px 14px', fontSize: 13, color: item.color, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}>
                              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d={item.icon}/></svg>
                              {item.label}
                            </button>
                            {i < arr.length - 1 && <div style={{ height: 1, background: '#F1F5F9' }} />}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Titre */}
              <p style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', margin: '0 0 3px', lineHeight: 1.4 }}>{a.titre}</p>

              {/* Contenu — tronqué ou complet selon l'état */}
              {a.contenu && (
                <p style={{
                  fontSize: 12, color: '#475569', margin: 0, lineHeight: 1.5,
                  ...(ouverte ? {} : { overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' })
                }}>
                  {a.contenu}
                </p>
              )}

              {/* Ligne de fermeture quand ouverte */}
              {ouverte && (
                <p style={{ fontSize: 11, color: '#CBD5E1', margin: '8px 0 0', textAlign: 'right' }}>
                  Appuyer pour réduire ↑
                </p>
              )}
            </div>
          )
        })}
      </div>
    </AdminLayout>
  )
}
