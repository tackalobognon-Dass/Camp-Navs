import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/admin/AdminLayout'

const VERT = '#1B3B2B'
const VERT_CLAIR = '#E8F5E8'
const EMPTY_FORM = { titre: '', artiste: '', ordre: '', paroles: '' }

const NoteIcon = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
  </svg>
)

export default function ChantsAdminPage() {
  const [chants, setChants] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)
  const [fichierAudio, setFichierAudio] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadEtape, setUploadEtape] = useState('')
  const [erreur, setErreur] = useState('')
  const [menuOuvert, setMenuOuvert] = useState(null)
  const [carteOuverte, setCarteOuverte] = useState(null)
  const [recherche, setRecherche] = useState('')
  const menuRef = useRef(null)

  useEffect(() => { fetchChants() }, [])
  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOuvert(null)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function fetchChants() {
    const { data } = await supabase.from('chants').select('*').order('ordre', { ascending: true })
    setChants(data || [])
    setLoading(false)
  }

  function setF(key, val) { setForm(f => ({ ...f, [key]: val })) }

  function openNew() {
    setForm(EMPTY_FORM); setEditId(null); setFichierAudio(null)
    setErreur(''); setUploadProgress(0); setUploadEtape(''); setShowForm(true)
  }

  function openEdit(chant) {
    setForm({ titre: chant.titre, artiste: chant.artiste || '', ordre: chant.ordre || '', paroles: chant.paroles || '' })
    setEditId(chant.id); setFichierAudio(null); setErreur('')
    setUploadProgress(0); setUploadEtape(''); setShowForm(true); setMenuOuvert(null)
  }

  async function handleSave() {
    if (!form.titre) return
    setSaving(true); setErreur(''); setUploadProgress(0)
    let lien_audio = editId ? chants.find(c => c.id === editId)?.lien_audio : ''
    if (fichierAudio) {
      setUploadEtape('Préparation du fichier...'); setUploadProgress(5)
      await new Promise(r => setTimeout(r, 300))
      const ext = fichierAudio.name.split('.').pop().toLowerCase()
      const nomFichier = `${Date.now()}.${ext}`
      const tailleMo = (fichierAudio.size / 1024 / 1024).toFixed(1)
      setUploadEtape(`Upload de ${tailleMo} MB...`); setUploadProgress(10)
      try {
        const session = await supabase.auth.getSession()
        const token = session.data?.session?.access_token
        const projectUrl = 'https://zkyzcemlndruwgirmfgy.supabase.co'
        await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhr.open('POST', `${projectUrl}/storage/v1/object/chants-audio/${nomFichier}`)
          xhr.setRequestHeader('Authorization', `Bearer ${token}`)
          xhr.setRequestHeader('x-upsert', 'true')
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 75) + 10
              setUploadProgress(pct)
              setUploadEtape(`Upload... ${Math.round((e.loaded / e.total) * 100)}%`)
            }
          }
          xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Erreur ${xhr.status}`))
          xhr.onerror = () => reject(new Error('Erreur réseau'))
          xhr.send(fichierAudio)
        })
        setUploadProgress(88); setUploadEtape('Récupération du lien...')
        await new Promise(r => setTimeout(r, 200))
        const { data: urlData } = supabase.storage.from('chants-audio').getPublicUrl(nomFichier)
        lien_audio = urlData.publicUrl
      } catch (err) {
        setUploadEtape('Upload en cours...')
        const { error: uploadError } = await supabase.storage.from('chants-audio').upload(nomFichier, fichierAudio, { cacheControl: '3600', upsert: true })
        if (uploadError) { setErreur(`Erreur upload : ${uploadError.message}`); setSaving(false); setUploadProgress(0); setUploadEtape(''); return }
        const { data: urlData } = supabase.storage.from('chants-audio').getPublicUrl(nomFichier)
        lien_audio = urlData.publicUrl
      }
    }
    setUploadProgress(93); setUploadEtape('Sauvegarde...')
    const payload = { titre: form.titre, artiste: form.artiste, ordre: form.ordre ? parseInt(form.ordre) : chants.length + 1, paroles: form.paroles, lien_audio }
    if (editId) await supabase.from('chants').update(payload).eq('id', editId)
    else await supabase.from('chants').insert([payload])
    setUploadProgress(100); setUploadEtape('Terminé !')
    await new Promise(r => setTimeout(r, 600))
    setSaving(false); setShowForm(false); setEditId(null); setForm(EMPTY_FORM)
    setFichierAudio(null); setUploadProgress(0); setUploadEtape('')
    fetchChants()
  }

  async function supprimerChant(chant) {
    if (!window.confirm('Supprimer ce chant ?')) return
    if (chant.lien_audio) {
      const nomFichier = chant.lien_audio.split('/').pop()
      await supabase.storage.from('chants-audio').remove([nomFichier])
    }
    await supabase.from('chants').delete().eq('id', chant.id)
    setMenuOuvert(null); fetchChants()
  }

  const chantsFiltres = chants.filter(c =>
    c.titre.toLowerCase().includes(recherche.toLowerCase()) ||
    (c.artiste || '').toLowerCase().includes(recherche.toLowerCase())
  )

  const iS = { width: '100%', border: '1px solid #E2E8F0', borderRadius: 10, padding: '9px 12px', fontSize: 13, outline: 'none', background: '#fff', color: '#1E293B' }

  return (
    <AdminLayout>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#F8FAFC', overflow: 'hidden' }}>

        {/* ── HEADER FIXE ── */}
        <div style={{ flexShrink: 0, padding: '14px 14px 10px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC', zIndex: 2, position: 'relative', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1E293B', margin: 0 }}>Chants</h1>
              <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 0' }}>{chants.length} chant(s) dans le répertoire</p>
            </div>
            <button type="button" onClick={() => showForm ? setShowForm(false) : openNew()}
              style={{ width: 32, height: 32, borderRadius: '50%', background: showForm ? '#FEF2F2' : VERT, color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 300, flexShrink: 0 }}>
              {showForm ? '×' : '+'}
            </button>
          </div>

          {/* Barre de recherche */}
          <div style={{ position: 'relative' }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#94A3B8" strokeWidth="1.5"
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input type="text" value={recherche} onChange={e => setRecherche(e.target.value)}
              placeholder="Rechercher un chant ou artiste..."
              style={{ ...iS, paddingLeft: 32, fontSize: 12 }} />
          </div>
        </div>

        {/* ── ZONE SCROLLABLE ── */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '0 14px 14px' }}>

          {/* Formulaire */}
          {showForm && (
            <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, padding: 14, marginTop: 12, marginBottom: 12 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', margin: '0 0 12px' }}>
                {editId ? 'Modifier le chant' : 'Nouveau chant'}
              </p>
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4 }}>Titre *</label>
                <input type="text" value={form.titre} onChange={e => setF('titre', e.target.value)}
                  placeholder="Ex : Grand Dieu nous te louons" style={iS} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4 }}>Artiste</label>
                  <input type="text" value={form.artiste} onChange={e => setF('artiste', e.target.value)}
                    placeholder="Ex : Navigateurs CI" style={iS} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4 }}>Ordre</label>
                  <input type="number" value={form.ordre} onChange={e => setF('ordre', e.target.value)}
                    placeholder="Ex : 1" style={iS} />
                </div>
              </div>

              {/* Audio */}
              <div style={{ marginBottom: 10 }}>
                <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4 }}>
                  Fichier audio <span style={{ color: '#94A3B8' }}>· MP3 128kbps recommandé</span>
                </label>
                <div style={{ border: '1px dashed #E2E8F0', borderRadius: 10, padding: 12, textAlign: 'center' }}>
                  {fichierAudio ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, background: VERT_CLAIR, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <NoteIcon />
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <p style={{ fontSize: 11, color: '#1E293B', margin: 0 }}>{fichierAudio.name.slice(0, 30)}</p>
                          <p style={{ fontSize: 10, color: '#94A3B8', margin: 0 }}>{(fichierAudio.size / 1024 / 1024).toFixed(1)} MB</p>
                        </div>
                      </div>
                      <button type="button" onClick={() => setFichierAudio(null)}
                        style={{ fontSize: 11, color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer' }}>Retirer</button>
                    </div>
                  ) : (
                    <label style={{ cursor: 'pointer' }}>
                      <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="#CBD5E1" strokeWidth="1.5" style={{ margin: '0 auto 6px' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
                      </svg>
                      <p style={{ fontSize: 11, color: '#94A3B8', margin: 0 }}>Appuyer pour sélectionner un fichier audio</p>
                      <p style={{ fontSize: 10, color: '#CBD5E1', margin: '3px 0 0' }}>MP3, WAV, M4A</p>
                      <input type="file" accept="audio/*" style={{ display: 'none' }} onChange={e => setFichierAudio(e.target.files[0])} />
                    </label>
                  )}
                </div>
                {editId && chants.find(c => c.id === editId)?.lien_audio && !fichierAudio && (
                  <p style={{ fontSize: 10, color: VERT, margin: '4px 0 0' }}>Audio existant conservé si pas de nouveau fichier</p>
                )}
              </div>

              {/* Paroles */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4 }}>
                  Paroles <span style={{ color: '#94A3B8' }}>· Commencez le refrain par "R:" ou "Refrain :"</span>
                </label>
                <textarea value={form.paroles} onChange={e => setF('paroles', e.target.value)}
                  placeholder="Saisissez les paroles du chant ici..." rows={6}
                  style={{ ...iS, resize: 'none', lineHeight: 1.6 }} />
              </div>

              {/* Progression upload */}
              {saving && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: VERT, fontWeight: 500 }}>{uploadEtape}</span>
                    <span style={{ fontSize: 11, color: VERT, fontWeight: 600 }}>{uploadProgress}%</span>
                  </div>
                  <div style={{ background: VERT_CLAIR, borderRadius: 8, height: 6, overflow: 'hidden' }}>
                    <div style={{ background: uploadProgress === 100 ? '#059669' : VERT, height: 6, borderRadius: 8, width: `${uploadProgress}%`, transition: 'width 0.3s ease' }} />
                  </div>
                </div>
              )}

              {erreur && (
                <div style={{ marginBottom: 10, background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '8px 12px' }}>
                  <p style={{ fontSize: 11, color: '#DC2626', margin: 0 }}>{erreur}</p>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => { setShowForm(false); setEditId(null) }}
                  style={{ flex: 1, background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 10, padding: 10, fontSize: 13, cursor: 'pointer' }}>
                  Annuler
                </button>
                <button type="button" onClick={handleSave} disabled={saving || !form.titre}
                  style={{ flex: 1, background: VERT, color: '#fff', border: 'none', borderRadius: 10, padding: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving || !form.titre ? 0.7 : 1 }}>
                  {saving ? 'Enregistrement...' : editId ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </div>
          )}

          {loading && <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '20px 0' }}>Chargement...</p>}
          {!loading && chants.length === 0 && (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: 28, textAlign: 'center', marginTop: 12 }}>
              <p style={{ fontSize: 13, color: '#94A3B8', margin: '0 0 10px' }}>Aucun chant dans le répertoire.</p>
              <button type="button" onClick={openNew} style={{ fontSize: 13, color: VERT, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                + Ajouter le premier chant
              </button>
            </div>
          )}

          {!loading && chants.length > 0 && chantsFiltres.length === 0 && (
            <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '20px 0', marginTop: 12 }}>
              Aucun résultat pour "{recherche}"
            </p>
          )}

          {/* Liste */}
          <div ref={menuRef} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            {chantsFiltres.map((c) => {
              const ouverte = carteOuverte === c.id
              return (
                <div key={c.id}
                  style={{ background: '#fff', borderRadius: 12, border: `1px solid ${ouverte ? '#CBD5E1' : '#E2E8F0'}`, transition: 'border-color .2s' }}>

                  {/* Ligne principale — cliquable */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', cursor: 'pointer' }}
                    onClick={() => setCarteOuverte(prev => prev === c.id ? null : c.id)}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: VERT_CLAIR, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: VERT }}>
                      <NoteIcon />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.titre}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        {c.artiste && <span style={{ fontSize: 11, color: '#94A3B8' }}>{c.artiste}</span>}
                        {c.lien_audio && <span style={{ fontSize: 9, fontWeight: 600, color: '#1D4ED8', background: '#EFF6FF', borderRadius: 20, padding: '1px 7px' }}>Audio</span>}
                        {c.paroles && <span style={{ fontSize: 9, fontWeight: 600, color: '#6D28D9', background: '#F5F3FF', borderRadius: 20, padding: '1px 7px' }}>Paroles</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      {/* Chevron */}
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#94A3B8" strokeWidth="2"
                        style={{ transition: 'transform .25s', transform: ouverte ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
                      </svg>
                      {/* Menu */}
                      <div style={{ position: 'relative' }}>
                        <button type="button" onClick={e => { e.stopPropagation(); setMenuOuvert(menuOuvert === c.id ? null : c.id) }}
                          style={{ width: 30, height: 30, borderRadius: 8, background: '#F8FAFC', border: '1px solid #E2E8F0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#94A3B8', letterSpacing: 1 }}>
                          ···
                        </button>
                        {menuOuvert === c.id && (
                          <div style={{ position: 'absolute', right: 0, top: 34, background: '#fff', borderRadius: 10, border: '1px solid #E2E8F0', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', zIndex: 20, minWidth: 140, overflow: 'hidden' }}>
                            <button type="button" onClick={e => { e.stopPropagation(); openEdit(c) }}
                              style={{ width: '100%', padding: '9px 14px', fontSize: 13, color: '#1E293B', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}>
                              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                              Modifier
                            </button>
                            <div style={{ height: 1, background: '#F1F5F9' }} />
                            <button type="button" onClick={e => { e.stopPropagation(); supprimerChant(c) }}
                              style={{ width: '100%', padding: '9px 14px', fontSize: 13, color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8 }}>
                              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                              Supprimer
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contenu déployé */}
                  {ouverte && (
                    <div style={{ padding: '0 12px 14px', borderTop: '1px solid #F1F5F9' }}>

                      {/* Lecteur audio */}
                      {c.lien_audio && (
                        <div style={{ marginTop: 12, marginBottom: c.paroles ? 12 : 0 }}>
                          <p style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 6px' }}>Lecture audio</p>
                          <audio controls src={c.lien_audio}
                            style={{ width: '100%', height: 36, borderRadius: 8 }}>
                            Votre navigateur ne supporte pas l'audio.
                          </audio>
                        </div>
                      )}

                      {/* Paroles */}
                      {c.paroles && (
                        <div style={{ marginTop: 12 }}>
                          <p style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 8px' }}>Paroles</p>
                          <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '10px 12px' }}>
                            {c.paroles.split('\n').map((ligne, i) => {
                              const isRefrain = ligne.startsWith('R:') || ligne.toLowerCase().startsWith('refrain')
                              return (
                                <p key={i} style={{
                                  fontSize: 12, margin: '0 0 3px', lineHeight: 1.6,
                                  color: isRefrain ? VERT : '#475569',
                                  fontWeight: isRefrain ? 600 : 400,
                                  fontStyle: isRefrain ? 'italic' : 'normal',
                                }}>
                                  {ligne || ' '}
                                </p>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {!c.lien_audio && !c.paroles && (
                        <p style={{ fontSize: 12, color: '#CBD5E1', textAlign: 'center', margin: '12px 0 0' }}>Aucun contenu ajouté.</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

        </div>{/* fin zone scrollable */}
      </div>{/* fin conteneur absolu */}
    </AdminLayout>
  )
}
