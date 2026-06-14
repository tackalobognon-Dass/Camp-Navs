import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/admin/AdminLayout'

const VERT = '#1B3B2B'
const VERT_CLAIR = '#E8F5E8'
const COULEURS_AVATAR = [
  { bg: '#DCFCE7', color: '#166534' },
  { bg: '#DBEAFE', color: '#1E40AF' },
  { bg: '#FEF9C3', color: '#854D0E' },
  { bg: '#F5F3FF', color: '#6D28D9' },
  { bg: '#FEE2E2', color: '#991B1B' },
  { bg: '#ECFDF5', color: '#065F46' },
]

function getMissionIcon(texte) {
  const t = texte.toLowerCase()
  if (t.includes('don') || t.includes('finance') || t.includes('budget') || t.includes('trésor') || t.includes('argent') || t.includes('paiement'))
    return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
  if (t.includes('communic') || t.includes('mail') || t.includes('courrier') || t.includes('message') || t.includes('annonce'))
    return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
  if (t.includes('coordin') || t.includes('équipe') || t.includes('organisat') || t.includes('planif') || t.includes('supervis'))
    return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
  if (t.includes('logistiq') || t.includes('matériel') || t.includes('transport') || t.includes('stock') || t.includes('équipement'))
    return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/></svg>
  if (t.includes('santé') || t.includes('médic') || t.includes('infirm') || t.includes('sécurit'))
    return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
  if (t.includes('prière') || t.includes('spirituel') || t.includes('dévotion') || t.includes('louange') || t.includes('culte'))
    return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
  if (t.includes('rapport') || t.includes('bilan') || t.includes('document') || t.includes('archiv'))
    return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
  if (t.includes('inscript') || t.includes('campeur') || t.includes('accueil') || t.includes('enregistr'))
    return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
  return <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>
}

function parseMissions(texte) {
  if (!texte) return []
  return texte.split('\n').map(l => l.trim()).filter(l => l.length > 0)
}

function parseLigne(ligne) {
  const idx = ligne.indexOf(':')
  if (idx > 0 && idx < 50) return { titre: ligne.slice(0, idx).trim(), desc: ligne.slice(idx + 1).trim() }
  const mots = ligne.split(' ')
  if (mots.length <= 4) return { titre: ligne, desc: '' }
  return { titre: mots.slice(0, 4).join(' '), desc: mots.slice(4).join(' ') }
}

const EMPTY_FORM = { nom_complet: '', role: '', telephone: '', email: '', commission: '', missions: '' }
const iS = { width: '100%', border: '1px solid #E2E8F0', borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none', background: '#fff', color: '#1E293B' }
const lS = { fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4, fontWeight: 500 }

export default function MembresPage() {
  const [membres, setMembres] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [recherche, setRecherche] = useState('')
  const [menuOuvert, setMenuOuvert] = useState(null)
  const [ficheOuverte, setFicheOuverte] = useState(null)
  const menuRef = useRef(null)

  useEffect(() => { fetchMembres() }, [])
  useEffect(() => {
    function handleClick(e) { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOuvert(null) }
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
    setForm({ nom_complet: m.nom_complet, role: m.role || '', telephone: m.telephone || '', email: m.email || '', commission: m.commission || '', missions: m.missions || '' })
    setEditId(m.id); setShowForm(true); setMenuOuvert(null)
  }

  async function handleSave() {
    if (!form.nom_complet || !form.role) return
    setSaving(true)
    if (editId) await supabase.from('bureau_membres').update(form).eq('id', editId)
    else await supabase.from('bureau_membres').insert([form])
    setSaving(false); setShowForm(false); setEditId(null); setForm(EMPTY_FORM); fetchMembres()
  }

  async function supprimerMembre(id) {
    if (!window.confirm('Supprimer ce membre ?')) return
    await supabase.from('bureau_membres').delete().eq('id', id)
    setMenuOuvert(null); setFicheOuverte(null); fetchMembres()
  }

  function monterOrdre(index) {
    if (index === 0) return
    const newList = [...membres];
    [newList[index], newList[index - 1]] = [newList[index - 1], newList[index]]
    setMembres(newList); setMenuOuvert(null)
  }

  function descendreOrdre(index) {
    if (index === membres.length - 1) return
    const newList = [...membres];
    [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]]
    setMembres(newList); setMenuOuvert(null)
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
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#F8FAFC', overflow: 'hidden' }}>

        {/* ── HEADER FIXE ── */}
        <div style={{ flexShrink: 0, padding: '14px 14px 10px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC', zIndex: 2, position: 'relative', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1E293B', margin: 0 }}>Membres du bureau</h1>
              <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 0' }}>{membres.length} membre(s)</p>
            </div>
            <button type="button" onClick={() => { setShowForm(!showForm); setEditId(null); setForm(EMPTY_FORM) }}
              style={{ width: 32, height: 32, borderRadius: '50%', background: showForm && !editId ? '#FEF2F2' : VERT, color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 300 }}>
              {showForm && !editId ? '×' : '+'}
            </button>
          </div>
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#94A3B8" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input type="text" value={recherche} onChange={e => setRecherche(e.target.value)} placeholder="Rechercher par nom, rôle ou commission..."
              style={{ ...iS, paddingLeft: 30, fontSize: 12 }} />
          </div>
        </div>

        {/* ── ZONE SCROLLABLE ── */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '12px 14px 14px' }}>

          {/* Formulaire */}
          {showForm && (
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: 14, marginBottom: 12 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', margin: '0 0 12px' }}>{editId ? 'Modifier' : 'Nouveau membre'}</p>
              <div style={{ marginBottom: 8 }}><label style={lS}>Nom complet *</label><input type="text" value={form.nom_complet} onChange={e => setF('nom_complet', e.target.value)} placeholder="Ex : N'DRI SERGE PACOME" style={iS} /></div>
              <div style={{ marginBottom: 8 }}><label style={lS}>Rôle *</label><input type="text" value={form.role} onChange={e => setF('role', e.target.value)} placeholder="Ex : Directeur du camp" style={iS} /></div>
              <div style={{ marginBottom: 8 }}><label style={lS}>Commission</label><input type="text" value={form.commission} onChange={e => setF('commission', e.target.value)} placeholder="Ex : Logistique, Louange..." style={iS} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                <div><label style={lS}>Téléphone</label><input type="text" value={form.telephone} onChange={e => setF('telephone', e.target.value)} placeholder="07 XX XX XX XX" style={iS} /></div>
                <div><label style={lS}>Email</label><input type="email" value={form.email} onChange={e => setF('email', e.target.value)} placeholder="email@exemple.com" style={iS} /></div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={lS}>Missions & Responsabilités</label>
                <p style={{ fontSize: 10, color: '#94A3B8', margin: '0 0 6px' }}>Une mission par ligne. Format : "Titre : description"</p>
                <textarea value={form.missions} onChange={e => setF('missions', e.target.value)}
                  placeholder={'Ex :
Gestion financière : Superviser le budget.
Suivi des inscriptions : Valider les dossiers.'}
                  rows={5} style={{ ...iS, resize: 'vertical', lineHeight: 1.5 }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => { setShowForm(false); setEditId(null) }}
                  style={{ flex: 1, background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 10, padding: 10, fontSize: 13, cursor: 'pointer' }}>Annuler</button>
                <button type="button" onClick={handleSave} disabled={saving || !form.nom_complet || !form.role}
                  style={{ flex: 1, background: VERT, color: '#fff', border: 'none', borderRadius: 10, padding: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving || !form.nom_complet || !form.role ? 0.7 : 1 }}>
                  {saving ? '...' : editId ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </div>
          )}

          {loading && <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '20px 0' }}>Chargement...</p>}

          {/* Liste */}
          <div ref={menuRef} style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            {filtres.length === 0 && !loading && (
              <div style={{ padding: 28, textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: '#94A3B8', margin: '0 0 10px' }}>Aucun membre enregistré.</p>
                <button type="button" onClick={openNew} style={{ fontSize: 13, color: VERT, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>+ Ajouter le premier membre</button>
              </div>
            )}
            {filtres.map((m, index) => {
              const av = getAvatar(m.nom_complet, index)
              return (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: index < filtres.length - 1 ? '1px solid #F1F5F9' : 'none', cursor: 'pointer' }}
                  onClick={() => setFicheOuverte(m)}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: av.bg, color: av.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                    {av.initiales}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.nom_complet}</p>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: VERT, background: VERT_CLAIR, borderRadius: 20, padding: '1px 8px' }}>{m.role}</span>
                      {m.commission && <span style={{ fontSize: 10, color: '#94A3B8' }}>{m.commission}</span>}
                    </div>
                  </div>
                  <div style={{ position: 'relative', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                    <button type="button" onClick={() => setMenuOuvert(menuOuvert === m.id ? null : m.id)}
                      style={{ width: 26, height: 26, borderRadius: 7, background: '#F8FAFC', border: '1px solid #E2E8F0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#94A3B8' }}>
                      ···
                    </button>
                    {menuOuvert === m.id && (
                      <div style={{ position: 'absolute', right: 0, top: 30, background: '#fff', borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', zIndex: 100, minWidth: 150, overflow: 'hidden' }}>
                        {[
                          { label: 'Modifier',  action: () => openEdit(m),              color: '#1E293B' },
                          { label: '↑ Monter',    action: () => monterOrdre(index),   color: '#1E293B' },
                          { label: '↓ Descendre', action: () => descendreOrdre(index),color: '#1E293B' },
                          { label: 'Supprimer', action: () => supprimerMembre(m.id),     color: '#DC2626' },
                        ].map((item, i, arr) => (
                          <div key={item.label}>
                            <button type="button" onClick={item.action} style={{ width: '100%', padding: '9px 14px', fontSize: 13, color: item.color, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                              {item.label}
                            </button>
                            {i < arr.length - 1 && <div style={{ height: 1, background: '#F1F5F9' }} />}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── FICHE MISSIONS ── */}
      {ficheOuverte && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={() => setFicheOuverte(null)}>
          <div style={{ background: '#F8FAFC', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', paddingBottom: 28 }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 36, height: 3, background: '#E2E8F0', borderRadius: 2, margin: '16px auto 0' }} />

            {/* En-tête vert */}
            <div style={{ background: VERT, margin: '14px 14px 0', borderRadius: 16, padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{ficheOuverte.nom_complet?.charAt(0)}</span>
              </div>
              <div>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: '0 0 3px' }}>{ficheOuverte.nom_complet}</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', margin: 0 }}>{ficheOuverte.role}</p>
                {ficheOuverte.commission && <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', margin: '2px 0 0' }}>{ficheOuverte.commission}</p>}
              </div>
            </div>

            {/* Contacts */}
            {(ficheOuverte.telephone || ficheOuverte.email) && (
              <div style={{ margin: '10px 14px 0', background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: '10px 14px', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {ficheOuverte.telephone && (
                  <a href={`tel:${ficheOuverte.telephone}`} style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke={VERT} strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                    <span style={{ fontSize: 12, color: VERT, fontWeight: 600 }}>{ficheOuverte.telephone}</span>
                  </a>
                )}
                {ficheOuverte.email && (
                  <a href={`mailto:${ficheOuverte.email}`} style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#64748B" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                    <span style={{ fontSize: 12, color: '#64748B' }}>{ficheOuverte.email}</span>
                  </a>
                )}
              </div>
            )}

            {/* Missions */}
            <div style={{ margin: '14px 14px 0' }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', margin: '0 0 10px', textTransform: 'uppercase' }}>Missions & Responsabilités</p>
              {parseMissions(ficheOuverte.missions).length === 0 ? (
                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: 20, textAlign: 'center' }}>
                  <p style={{ fontSize: 13, color: '#94A3B8', margin: '0 0 8px' }}>Aucune mission définie.</p>
                  <button type="button" onClick={() => { setFicheOuverte(null); openEdit(ficheOuverte) }}
                    style={{ fontSize: 12, fontWeight: 600, color: VERT, background: 'none', border: 'none', cursor: 'pointer' }}>+ Ajouter des missions</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {parseMissions(ficheOuverte.missions).map((ligne, i) => {
                    const { titre, desc } = parseLigne(ligne)
                    return (
                      <div key={i} style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: '12px 14px', display: 'flex', gap: 12 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: VERT_CLAIR, color: VERT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {getMissionIcon(ligne)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', margin: '0 0 3px', lineHeight: 1.3 }}>{titre}</p>
                          {desc && <p style={{ fontSize: 12, color: '#64748B', margin: 0, lineHeight: 1.5 }}>{desc}</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Boutons */}
            <div style={{ display: 'flex', gap: 10, margin: '14px 14px 0' }}>
              <button type="button" onClick={() => { setFicheOuverte(null); openEdit(ficheOuverte) }}
                style={{ flex: 1, background: VERT_CLAIR, color: VERT, border: 'none', borderRadius: 10, padding: 11, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Modifier les missions
              </button>
              <button type="button" onClick={() => setFicheOuverte(null)}
                style={{ background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 10, padding: '11px 16px', fontSize: 13, cursor: 'pointer' }}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
