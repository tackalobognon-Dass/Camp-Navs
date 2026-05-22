import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/admin/AdminLayout'

const DECISIONS = ['Aucune', 'Accepté Christ', 'Rengagement', 'Baptême', 'Autre']
const STATUTS = ['En attente', 'Suivi en cours', 'Intégré groupe étude', 'Perdu de vue']

const STATUT_CONFIG = {
  'En attente':           { bg: '#F1EFE8', color: '#5F5E5A' },
  'Suivi en cours':       { bg: '#E6F1FB', color: '#185FA5' },
  'Intégré groupe étude': { bg: '#E1F5EE', color: '#085041' },
  'Perdu de vue':         { bg: '#FCEBEB', color: '#A32D2D' },
}

const EMPTY_FORM = {
  nom_campeur: '', telephone: '', decision_camp: 'Aucune', engagement: '',
  contacte: false, date_contact: '', lieu_vie: '', responsable: '',
  statut: 'En attente', groupe_etude: '', notes: '',
}

export default function SuiviPostCampPage() {
  const [suivis, setSuivis] = useState([])
  const [inscriptions, setInscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [recherche, setRecherche] = useState('')
  const [filtreStatut, setFiltreStatut] = useState('tous')
  const [ficheOuverte, setFicheOuverte] = useState(null)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const [{ data: s }, { data: ins }] = await Promise.all([
      supabase.from('suivi_post_camp').select('*').order('created_at', { ascending: false }),
      supabase.from('inscriptions').select('id, nom_complet, telephone').order('nom_complet'),
    ])
    setSuivis(s || [])
    setInscriptions(ins || [])
    setLoading(false)
  }

  function setF(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function openNew() {
    setForm(EMPTY_FORM)
    setEditId(null)
    setShowForm(true)
  }

  function openEdit(s) {
    setForm({
      nom_campeur: s.nom_campeur, telephone: s.telephone || '',
      decision_camp: s.decision_camp || 'Aucune', engagement: s.engagement || '',
      contacte: s.contacte || false, date_contact: s.date_contact || '',
      lieu_vie: s.lieu_vie || '', responsable: s.responsable || '',
      statut: s.statut || 'En attente', groupe_etude: s.groupe_etude || '',
      notes: s.notes || '',
    })
    setEditId(s.id)
    setShowForm(true)
    setFicheOuverte(null)
  }

  async function handleSave() {
    if (!form.nom_campeur) return
    setSaving(true)
    const payload = { ...form, updated_at: new Date().toISOString() }
    if (editId) {
      await supabase.from('suivi_post_camp').update(payload).eq('id', editId)
    } else {
      await supabase.from('suivi_post_camp').insert([payload])
    }
    setSaving(false)
    setShowForm(false)
    setEditId(null)
    setForm(EMPTY_FORM)
    fetchData()
  }

  async function supprimerSuivi(id) {
    if (!window.confirm('Supprimer cette fiche de suivi ?')) return
    await supabase.from('suivi_post_camp').delete().eq('id', id)
    setFicheOuverte(null)
    fetchData()
  }

  const filtres = suivis
    .filter(s => filtreStatut === 'tous' || s.statut === filtreStatut)
    .filter(s =>
      s.nom_campeur.toLowerCase().includes(recherche.toLowerCase()) ||
      (s.responsable && s.responsable.toLowerCase().includes(recherche.toLowerCase()))
    )

  // Stats
  const total = suivis.length
  const integres = suivis.filter(s => s.statut === 'Intégré groupe étude').length
  const perdus = suivis.filter(s => s.statut === 'Perdu de vue').length
  const decisions = suivis.filter(s => s.decision_camp && s.decision_camp !== 'Aucune').length

  const inputStyle = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400"
  const labelStyle = "block text-xs text-gray-500 mb-1"

  return (
    <AdminLayout>
      <div className="mb-5 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-medium text-gray-800">Suivi post-camp</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total} fiche(s) de suivi</p>
        </div>
        <button onClick={() => { showForm && !editId ? setShowForm(false) : openNew() }}
          className="bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-xl flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showForm && !editId ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"} />
          </svg>
          {showForm && !editId ? 'Fermer' : 'Ajouter'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div style={{ background: '#E6F1FB', borderRadius: 12, padding: '12px 14px' }}>
          <p style={{ fontSize: 22, fontWeight: 600, color: '#185FA5' }}>{total}</p>
          <p style={{ fontSize: 11, color: '#185FA5' }}>Total suivis</p>
        </div>
        <div style={{ background: '#E1F5EE', borderRadius: 12, padding: '12px 14px' }}>
          <p style={{ fontSize: 22, fontWeight: 600, color: '#085041' }}>{decisions}</p>
          <p style={{ fontSize: 11, color: '#085041' }}>Décisions au camp</p>
        </div>
        <div style={{ background: '#E1F5EE', borderRadius: 12, padding: '12px 14px' }}>
          <p style={{ fontSize: 22, fontWeight: 600, color: '#085041' }}>{integres}</p>
          <p style={{ fontSize: 11, color: '#085041' }}>Intégrés en groupe</p>
        </div>
        <div style={{ background: perdus > 0 ? '#FCEBEB' : '#F1EFE8', borderRadius: 12, padding: '12px 14px' }}>
          <p style={{ fontSize: 22, fontWeight: 600, color: perdus > 0 ? '#A32D2D' : '#5F5E5A' }}>{perdus}</p>
          <p style={{ fontSize: 11, color: perdus > 0 ? '#993C1D' : '#888' }}>Perdus de vue</p>
        </div>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-5">
          <h2 className="text-sm font-medium text-gray-700 mb-4">
            {editId ? 'Modifier la fiche' : 'Nouvelle fiche de suivi'}
          </h2>

          {/* Sélectionner depuis inscription ou saisir manuellement */}
          <div className="mb-3">
            <label className={labelStyle}>Choisir un campeur inscrit</label>
            <select onChange={e => {
              const ins = inscriptions.find(i => i.id === e.target.value)
              if (ins) { setF('nom_campeur', ins.nom_complet); setF('telephone', ins.telephone || '') }
            }} className={inputStyle} defaultValue="">
              <option value="">-- Sélectionner depuis les inscriptions --</option>
              {inscriptions.map(i => <option key={i.id} value={i.id}>{i.nom_complet}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className={labelStyle}>Nom complet *</label>
              <input type="text" value={form.nom_campeur} onChange={e => setF('nom_campeur', e.target.value)}
                placeholder="Nom du campeur" className={inputStyle} />
            </div>
            <div>
              <label className={labelStyle}>Téléphone</label>
              <input type="text" value={form.telephone} onChange={e => setF('telephone', e.target.value)}
                placeholder="07 XX XX XX XX" className={inputStyle} />
            </div>
          </div>

          {/* Suivi spirituel */}
          <div style={{ background: '#f8f8f6', borderRadius: 12, padding: '12px', marginBottom: 12 }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: '#085041', marginBottom: 10, letterSpacing: '0.05em' }}>SUIVI SPIRITUEL</p>
            <div className="mb-3">
              <label className={labelStyle}>Décision prise au camp</label>
              <select value={form.decision_camp} onChange={e => setF('decision_camp', e.target.value)} className={inputStyle}>
                {DECISIONS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className={labelStyle}>Engagement / Description</label>
              <textarea value={form.engagement} onChange={e => setF('engagement', e.target.value)}
                placeholder="Décrivez l'engagement pris..." rows={2}
                className={inputStyle + " resize-none"} />
            </div>
          </div>

          {/* Contact après camp */}
          <div style={{ background: '#f8f8f6', borderRadius: 12, padding: '12px', marginBottom: 12 }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: '#085041', marginBottom: 10, letterSpacing: '0.05em' }}>CONTACT APRÈS CAMP</p>
            <div className="flex items-center gap-3 mb-3">
              <input type="checkbox" id="contacte" checked={form.contacte} onChange={e => setF('contacte', e.target.checked)}
                style={{ width: 16, height: 16, accentColor: '#085041' }} />
              <label htmlFor="contacte" style={{ fontSize: 12, color: '#444' }}>Le campeur a été recontacté</label>
            </div>
            {form.contacte && (
              <div className="mb-3">
                <label className={labelStyle}>Date du contact</label>
                <input type="date" value={form.date_contact} onChange={e => setF('date_contact', e.target.value)} className={inputStyle} />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelStyle}>Lieu de vie</label>
                <input type="text" value={form.lieu_vie} onChange={e => setF('lieu_vie', e.target.value)}
                  placeholder="Ex : Cocody, Yopougon..." className={inputStyle} />
              </div>
              <div>
                <label className={labelStyle}>Responsable du suivi</label>
                <input type="text" value={form.responsable} onChange={e => setF('responsable', e.target.value)}
                  placeholder="Nom du responsable" className={inputStyle} />
              </div>
            </div>
          </div>

          {/* Statut */}
          <div style={{ background: '#f8f8f6', borderRadius: 12, padding: '12px', marginBottom: 14 }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: '#085041', marginBottom: 10, letterSpacing: '0.05em' }}>STATUT</p>
            <div className="mb-3">
              <label className={labelStyle}>Statut actuel</label>
              <select value={form.statut} onChange={e => setF('statut', e.target.value)} className={inputStyle}>
                {STATUTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            {form.statut === 'Intégré groupe étude' && (
              <div className="mb-3">
                <label className={labelStyle}>Nom du groupe d'étude biblique</label>
                <input type="text" value={form.groupe_etude} onChange={e => setF('groupe_etude', e.target.value)}
                  placeholder="Ex : Groupe Cocody Nord" className={inputStyle} />
              </div>
            )}
            <div>
              <label className={labelStyle}>Notes / Observations</label>
              <textarea value={form.notes} onChange={e => setF('notes', e.target.value)}
                placeholder="Informations complémentaires..." rows={2}
                className={inputStyle + " resize-none"} />
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => { setShowForm(false); setEditId(null) }}
              className="flex-1 bg-gray-100 text-gray-600 text-sm font-medium py-3 rounded-xl">Annuler</button>
            <button onClick={handleSave} disabled={saving || !form.nom_campeur}
              className="flex-1 bg-emerald-700 text-white text-sm font-medium py-3 rounded-xl disabled:opacity-60">
              {saving ? 'Enregistrement...' : editId ? 'Modifier' : 'Enregistrer'}
            </button>
          </div>
        </div>
      )}

      {/* Filtres statut */}
      <div className="flex gap-2 overflow-x-auto mb-3 pb-1" style={{ scrollbarWidth: 'none' }}>
        {['tous', ...STATUTS].map(s => (
          <button key={s} onClick={() => setFiltreStatut(s)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ border: `0.5px solid ${filtreStatut === s ? '#085041' : '#e5e5e0'}`, background: filtreStatut === s ? '#085041' : '#fff', color: filtreStatut === s ? '#fff' : '#666' }}>
            {s === 'tous' ? 'Tous' : s}
          </button>
        ))}
      </div>

      {/* Recherche */}
      <input type="text" value={recherche} onChange={e => setRecherche(e.target.value)}
        placeholder="Rechercher par nom ou responsable..."
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-4 bg-white outline-none focus:border-emerald-400" />

      {loading && <p className="text-sm text-gray-400 text-center py-8">Chargement...</p>}
      {!loading && filtres.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-xl p-6 text-center">
          <p className="text-sm text-gray-400">Aucune fiche de suivi.</p>
        </div>
      )}

      {/* Liste */}
      <div className="space-y-2">
        {filtres.map(s => {
          const sc = STATUT_CONFIG[s.statut] || STATUT_CONFIG['En attente']
          return (
            <div key={s.id} onClick={() => setFicheOuverte(s)}
              style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #e5e5e0', padding: '12px 14px', cursor: 'pointer' }}>
              <div className="flex items-center gap-3">
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#085041' }}>{s.nom_campeur?.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>{s.nom_campeur}</p>
                  <div className="flex gap-2 mt-0.5 flex-wrap">
                    {s.responsable && <span style={{ fontSize: 10, color: '#888' }}>Resp : {s.responsable}</span>}
                    {s.decision_camp && s.decision_camp !== 'Aucune' && (
                      <span style={{ fontSize: 9, background: '#EEEDFE', color: '#534AB7', borderRadius: 20, padding: '1px 6px' }}>{s.decision_camp}</span>
                    )}
                    {s.contacte && <span style={{ fontSize: 9, background: '#E1F5EE', color: '#085041', borderRadius: 20, padding: '1px 6px' }}>Contacté</span>}
                  </div>
                </div>
                <span style={{ fontSize: 9, background: sc.bg, color: sc.color, borderRadius: 20, padding: '2px 8px', fontWeight: 500, flexShrink: 0 }}>
                  {s.statut}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Fiche détaillée */}
      {ficheOuverte && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
          onClick={() => setFicheOuverte(null)}>
          <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 480, maxHeight: '85vh', overflowY: 'auto', padding: '20px 16px 32px' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: 36, height: 3, background: '#e0e0e0', borderRadius: 2, margin: '0 auto 16px' }} />

            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 16, fontWeight: 600, color: '#085041' }}>{ficheOuverte.nom_campeur?.charAt(0)}</span>
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 500, color: '#1a1a1a' }}>{ficheOuverte.nom_campeur}</p>
                {ficheOuverte.telephone && <p style={{ fontSize: 11, color: '#888' }}>{ficheOuverte.telephone}</p>}
                <span style={{ fontSize: 10, background: STATUT_CONFIG[ficheOuverte.statut]?.bg, color: STATUT_CONFIG[ficheOuverte.statut]?.color, borderRadius: 20, padding: '2px 8px', fontWeight: 500, display: 'inline-block', marginTop: 2 }}>
                  {ficheOuverte.statut}
                </span>
              </div>
            </div>

            {/* Suivi spirituel */}
            <div style={{ background: '#f8f8f6', borderRadius: 12, padding: '12px 14px', marginBottom: 10 }}>
              <p style={{ fontSize: 9, fontWeight: 600, color: '#085041', marginBottom: 8, letterSpacing: '0.05em' }}>SUIVI SPIRITUEL</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '0.5px solid #f0f0ee' }}>
                <span style={{ fontSize: 11, color: '#888' }}>Décision</span>
                <span style={{ fontSize: 11, color: '#1a1a1a', fontWeight: 500 }}>{ficheOuverte.decision_camp || 'Aucune'}</span>
              </div>
              {ficheOuverte.engagement && (
                <p style={{ fontSize: 11, color: '#444', marginTop: 6, lineHeight: 1.5 }}>{ficheOuverte.engagement}</p>
              )}
            </div>

            {/* Contact */}
            <div style={{ background: '#f8f8f6', borderRadius: 12, padding: '12px 14px', marginBottom: 10 }}>
              <p style={{ fontSize: 9, fontWeight: 600, color: '#085041', marginBottom: 8, letterSpacing: '0.05em' }}>CONTACT APRÈS CAMP</p>
              {[
                { label: 'Contacté', val: ficheOuverte.contacte ? 'Oui' : 'Non' },
                { label: 'Date contact', val: ficheOuverte.date_contact ? new Date(ficheOuverte.date_contact).toLocaleDateString('fr-FR') : '-' },
                { label: 'Lieu de vie', val: ficheOuverte.lieu_vie || '-' },
                { label: 'Responsable', val: ficheOuverte.responsable || '-' },
              ].map(({ label, val }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '0.5px solid #f0f0ee' }}>
                  <span style={{ fontSize: 11, color: '#888' }}>{label}</span>
                  <span style={{ fontSize: 11, color: '#1a1a1a' }}>{val}</span>
                </div>
              ))}
            </div>

            {/* Groupe */}
            {ficheOuverte.groupe_etude && (
              <div style={{ background: '#E1F5EE', borderRadius: 12, padding: '10px 14px', marginBottom: 10 }}>
                <p style={{ fontSize: 9, fontWeight: 600, color: '#085041', marginBottom: 4 }}>GROUPE D'ÉTUDE BIBLIQUE</p>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#085041' }}>{ficheOuverte.groupe_etude}</p>
              </div>
            )}

            {ficheOuverte.notes && (
              <div style={{ background: '#f8f8f6', borderRadius: 12, padding: '10px 14px', marginBottom: 14 }}>
                <p style={{ fontSize: 9, fontWeight: 600, color: '#666', marginBottom: 4 }}>NOTES</p>
                <p style={{ fontSize: 11, color: '#444', lineHeight: 1.6 }}>{ficheOuverte.notes}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => supprimerSuivi(ficheOuverte.id)}
                style={{ padding: '12px 16px', borderRadius: 12, background: '#FCEBEB', color: '#A32D2D', border: 'none', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                Supprimer
              </button>
              <button onClick={() => openEdit(ficheOuverte)}
                style={{ flex: 1, background: '#085041', color: '#fff', border: 'none', borderRadius: 12, padding: '12px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                Modifier
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
