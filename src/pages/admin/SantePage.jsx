import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/admin/AdminLayout'

const STATUTS = ['En traitement', 'Guéri', 'Évacué']
const STATUT_CONFIG = {
  'En traitement': { bg: '#FAEEDA', color: '#854F0B' },
  'Guéri':         { bg: '#E1F5EE', color: '#085041' },
  'Évacué':        { bg: '#FCEBEB', color: '#A32D2D' },
}

const EMPTY_FICHE = {
  nom_campeur: '', symptomes: '', traitement: '',
  statut: 'En traitement', hopital: '', accompagnateur: '', notes: ''
}

function exportPDFSante(fiches, medicaments, medUtilises) {
  const dateStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const totalMalades = fiches.length
  const totalGueris = fiches.filter(f => f.statut === 'Guéri').length
  const totalEvacues = fiches.filter(f => f.statut === 'Évacué').length
  const totalEnTraitement = fiches.filter(f => f.statut === 'En traitement').length

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Rapport Santé — Camp-Navs 2026</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 12px; color: #1a1a1a; margin: 30px; }
  h1 { font-size: 20px; color: #085041; margin-bottom: 4px; }
  h2 { font-size: 14px; color: #085041; margin: 24px 0 10px; border-bottom: 2px solid #085041; padding-bottom: 4px; }
  .subtitle { font-size: 12px; color: #666; margin-bottom: 20px; }
  .resume { display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
  .stat { background: #E1F5EE; border-radius: 8px; padding: 10px 14px; min-width: 100px; }
  .stat .num { font-size: 22px; font-weight: bold; color: #085041; }
  .stat .lbl { font-size: 10px; color: #0F6E56; }
  .stat.warn { background: #FAEEDA; } .stat.warn .num { color: #854F0B; } .stat.warn .lbl { color: #854F0B; }
  .stat.danger { background: #FCEBEB; } .stat.danger .num { color: #A32D2D; } .stat.danger .lbl { color: #993C1D; }
  .stat.blue { background: #E6F1FB; } .stat.blue .num { color: #185FA5; } .stat.blue .lbl { color: #185FA5; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th { background: #085041; color: #fff; padding: 7px 10px; text-align: left; font-size: 11px; }
  td { padding: 6px 10px; border-bottom: 0.5px solid #e5e5e0; font-size: 11px; vertical-align: top; }
  tr:nth-child(even) td { background: #f8f8f6; }
  .badge { padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: bold; }
  .badge-ok { background: #E1F5EE; color: #085041; }
  .badge-warn { background: #FAEEDA; color: #854F0B; }
  .badge-danger { background: #FCEBEB; color: #A32D2D; }
  .footer { margin-top: 30px; font-size: 10px; color: #888; text-align: center; border-top: 0.5px solid #e5e5e0; padding-top: 10px; }
</style>
</head>
<body>
<h1>Rapport Santé — Camp-Navs 2026</h1>
<p class="subtitle">La Sablière · Bingerville · 23–29 août 2026 · Généré le ${dateStr}</p>

<div class="resume">
  <div class="stat blue"><div class="num">${totalMalades}</div><div class="lbl">Total malades</div></div>
  <div class="stat"><div class="num">${totalGueris}</div><div class="lbl">Guéris</div></div>
  <div class="stat warn"><div class="num">${totalEnTraitement}</div><div class="lbl">En traitement</div></div>
  <div class="stat danger"><div class="num">${totalEvacues}</div><div class="lbl">Évacués</div></div>
</div>

<h2>Fiches des malades</h2>
<table>
  <tr><th>Campeur</th><th>Date</th><th>Symptômes</th><th>Traitement</th><th>Statut</th><th>Évacuation</th></tr>
  ${fiches.map(f => `<tr>
    <td><strong>${f.nom_campeur}</strong></td>
    <td>${new Date(f.date_heure).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
    <td>${f.symptomes}</td>
    <td>${f.traitement || '-'}</td>
    <td><span class="badge ${f.statut === 'Guéri' ? 'badge-ok' : f.statut === 'Évacué' ? 'badge-danger' : 'badge-warn'}">${f.statut}</span></td>
    <td>${f.statut === 'Évacué' ? `${f.hopital || ''} — ${f.accompagnateur || ''}` : '-'}</td>
  </tr>`).join('')}
</table>

<h2>Stock médicaments</h2>
<table>
  <tr><th>Médicament</th><th>Qté initiale</th><th>Qté utilisée</th><th>Qté restante</th><th>Unité</th></tr>
  ${medicaments.map(m => {
    const utilise = m.quantite_utilisee || 0
    const initial = m.quantite_initiale || 0
    const restant = initial - utilise
    return `<tr>
      <td><strong>${m.nom}</strong></td>
      <td>${initial}</td>
      <td>${utilise}</td>
      <td><span class="badge ${restant <= 0 ? 'badge-danger' : restant < initial * 0.2 ? 'badge-warn' : 'badge-ok'}">${restant}</span></td>
      <td>${m.unite || 'comprimé(s)'}</td>
    </tr>`
  }).join('')}
</table>

${fiches.filter(f => f.statut === 'Évacué').length > 0 ? `
<h2>Évacuations</h2>
<table>
  <tr><th>Campeur</th><th>Date</th><th>Hôpital</th><th>Accompagnateur</th><th>Notes</th></tr>
  ${fiches.filter(f => f.statut === 'Évacué').map(f => `<tr>
    <td><strong>${f.nom_campeur}</strong></td>
    <td>${new Date(f.date_heure).toLocaleDateString('fr-FR')}</td>
    <td>${f.hopital || '-'}</td>
    <td>${f.accompagnateur || '-'}</td>
    <td>${f.notes || '-'}</td>
  </tr>`).join('')}
</table>` : ''}

<div class="footer">Camp-Navs 2026 · Mission Évangélique des Navigateurs — Côte d'Ivoire · ${dateStr}</div>
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank')
  if (win) setTimeout(() => win.print(), 800)
  URL.revokeObjectURL(url)
}

export default function SantePage() {
  const [onglet, setOnglet] = useState('malades')
  const [fiches, setFiches] = useState([])
  const [medicaments, setMedicaments] = useState([])
  const [medUtilises, setMedUtilises] = useState([])
  const [loading, setLoading] = useState(true)
  const [showFiche, setShowFiche] = useState(false)
  const [showMed, setShowMed] = useState(false)
  const [fiche, setFiche] = useState(EMPTY_FICHE)
  const [editFicheId, setEditFicheId] = useState(null)
  const [medForm, setMedForm] = useState({ nom: '', quantite_initiale: 0, unite: 'comprimé(s)', statut: 'disponible' })
  const [editMedId, setEditMedId] = useState(null)
  const [medsSelectionnes, setMedsSelectionnes] = useState([])
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    const [{ data: f }, { data: m }, { data: mu }] = await Promise.all([
      supabase.from('fiches_malades').select('*').order('date_heure', { ascending: false }),
      supabase.from('stocks_medicaments').select('*').order('nom'),
      supabase.from('medicaments_utilises').select('*'),
    ])
    setFiches(f || [])
    setMedicaments(m || [])
    setMedUtilises(mu || [])
    setLoading(false)
  }

  function setF(k, v) { setFiche(f => ({ ...f, [k]: v })) }
  function setM(k, v) { setMedForm(f => ({ ...f, [k]: v })) }

  async function saveFiche() {
    if (!fiche.nom_campeur || !fiche.symptomes) return
    setSaving(true)
    let ficheId = editFicheId

    if (editFicheId) {
      await supabase.from('fiches_malades').update({
        nom_campeur: fiche.nom_campeur, symptomes: fiche.symptomes,
        traitement: fiche.traitement, statut: fiche.statut,
        hopital: fiche.hopital, accompagnateur: fiche.accompagnateur, notes: fiche.notes,
      }).eq('id', editFicheId)
    } else {
      const { data } = await supabase.from('fiches_malades').insert([{
        nom_campeur: fiche.nom_campeur, symptomes: fiche.symptomes,
        traitement: fiche.traitement, statut: fiche.statut,
        hopital: fiche.hopital, accompagnateur: fiche.accompagnateur, notes: fiche.notes,
      }]).select().single()
      ficheId = data?.id
    }

    // Enregistrer médicaments utilisés et déduire du stock
    for (const ms of medsSelectionnes) {
      await supabase.from('medicaments_utilises').insert([{
        fiche_id: ficheId, medicament_id: ms.id,
        nom_medicament: ms.nom, quantite: ms.qte,
      }])
      const med = medicaments.find(m => m.id === ms.id)
      if (med) {
        await supabase.from('stocks_medicaments').update({
          quantite_utilisee: (med.quantite_utilisee || 0) + ms.qte
        }).eq('id', ms.id)
      }
    }

    setSaving(false)
    setShowFiche(false)
    setEditFicheId(null)
    setFiche(EMPTY_FICHE)
    setMedsSelectionnes([])
    fetchData()
  }

  async function saveMedicament() {
    if (!medForm.nom) return
    setSaving(true)
    const payload = {
      nom: medForm.nom,
      quantite_initiale: parseInt(medForm.quantite_initiale) || 0,
      quantite: parseInt(medForm.quantite_initiale) || 0,
      unite: medForm.unite,
      statut: 'disponible',
      quantite_utilisee: 0,
    }
    if (editMedId) {
      await supabase.from('stocks_medicaments').update(payload).eq('id', editMedId)
    } else {
      await supabase.from('stocks_medicaments').insert([payload])
    }
    setSaving(false)
    setShowMed(false)
    setEditMedId(null)
    setMedForm({ nom: '', quantite_initiale: 0, unite: 'comprimé(s)', statut: 'disponible' })
    fetchData()
  }

  async function supprimerFiche(id) {
    if (!window.confirm('Supprimer cette fiche ?')) return
    await supabase.from('fiches_malades').delete().eq('id', id)
    fetchData()
  }

  async function supprimerMed(id) {
    if (!window.confirm('Supprimer ce médicament ?')) return
    await supabase.from('stocks_medicaments').delete().eq('id', id)
    fetchData()
  }

  function ajouterMedSelection(med) {
    if (medsSelectionnes.find(m => m.id === med.id)) return
    setMedsSelectionnes(prev => [...prev, { ...med, qte: 1 }])
  }

  function updateQteMed(id, qte) {
    setMedsSelectionnes(prev => prev.map(m => m.id === id ? { ...m, qte: parseInt(qte) || 1 } : m))
  }

  function retirerMed(id) {
    setMedsSelectionnes(prev => prev.filter(m => m.id !== id))
  }

  // Stats
  const totalMalades = fiches.length
  const enTraitement = fiches.filter(f => f.statut === 'En traitement').length
  const gueris = fiches.filter(f => f.statut === 'Guéri').length
  const evacues = fiches.filter(f => f.statut === 'Évacué').length

  const inputStyle = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400"

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-5 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl font-medium text-gray-800">Santé</h1>
          <p className="text-sm text-gray-400 mt-0.5">{totalMalades} fiche(s) · {medicaments.length} médicament(s)</p>
        </div>
        <button onClick={() => exportPDFSante(fiches, medicaments, medUtilises)}
          style={{ background: '#A32D2D', color: '#fff', border: 'none', borderRadius: 10, padding: '8px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
          <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Rapport PDF
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div style={{ background: '#E6F1FB', borderRadius: 12, padding: '12px 14px' }}>
          <p style={{ fontSize: 22, fontWeight: 600, color: '#185FA5' }}>{totalMalades}</p>
          <p style={{ fontSize: 11, color: '#185FA5' }}>Total malades</p>
        </div>
        <div style={{ background: '#E1F5EE', borderRadius: 12, padding: '12px 14px' }}>
          <p style={{ fontSize: 22, fontWeight: 600, color: '#085041' }}>{gueris}</p>
          <p style={{ fontSize: 11, color: '#085041' }}>Guéris</p>
        </div>
        <div style={{ background: enTraitement > 0 ? '#FAEEDA' : '#F1EFE8', borderRadius: 12, padding: '12px 14px' }}>
          <p style={{ fontSize: 22, fontWeight: 600, color: enTraitement > 0 ? '#854F0B' : '#5F5E5A' }}>{enTraitement}</p>
          <p style={{ fontSize: 11, color: enTraitement > 0 ? '#854F0B' : '#888780' }}>En traitement</p>
        </div>
        <div style={{ background: evacues > 0 ? '#FCEBEB' : '#F1EFE8', borderRadius: 12, padding: '12px 14px' }}>
          <p style={{ fontSize: 22, fontWeight: 600, color: evacues > 0 ? '#A32D2D' : '#5F5E5A' }}>{evacues}</p>
          <p style={{ fontSize: 11, color: evacues > 0 ? '#993C1D' : '#888780' }}>Évacués</p>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-2 mb-4">
        {[
          { key: 'malades', label: 'Malades' },
          { key: 'medicaments', label: 'Médicaments' },
          { key: 'rapport', label: 'Rapport' },
        ].map(o => (
          <button key={o.key} onClick={() => setOnglet(o.key)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              border: `0.5px solid ${onglet === o.key ? '#085041' : '#e5e5e0'}`,
              background: onglet === o.key ? '#085041' : '#fff',
              color: onglet === o.key ? '#fff' : '#666',
            }}>
            {o.label}
          </button>
        ))}
      </div>

      {/* ONGLET MALADES */}
      {onglet === 'malades' && (
        <>
          <button onClick={() => { setShowFiche(!showFiche); setEditFicheId(null); setFiche(EMPTY_FICHE); setMedsSelectionnes([]) }}
            className="w-full mb-4 bg-emerald-700 text-white text-sm font-medium py-3 rounded-xl flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showFiche && !editFicheId ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"} /></svg>
            {showFiche && !editFicheId ? 'Fermer' : 'Nouvelle fiche malade'}
          </button>

          {showFiche && (
            <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-5">
              <h2 className="text-sm font-medium text-gray-700 mb-4">{editFicheId ? 'Modifier la fiche' : 'Nouvelle fiche malade'}</h2>

              <div className="mb-3">
                <label className="block text-xs text-gray-500 mb-1">Nom du campeur *</label>
                <input type="text" value={fiche.nom_campeur} onChange={e => setF('nom_campeur', e.target.value)}
                  placeholder="Ex : YAO Jean-Pierre" className={inputStyle} />
              </div>

              <div className="mb-3">
                <label className="block text-xs text-gray-500 mb-1">Symptômes *</label>
                <textarea value={fiche.symptomes} onChange={e => setF('symptomes', e.target.value)}
                  placeholder="Décrivez les symptômes observés..." rows={3}
                  className={inputStyle + " resize-none"} />
              </div>

              <div className="mb-3">
                <label className="block text-xs text-gray-500 mb-1">Traitement administré</label>
                <textarea value={fiche.traitement} onChange={e => setF('traitement', e.target.value)}
                  placeholder="Traitement donné au campeur..." rows={2}
                  className={inputStyle + " resize-none"} />
              </div>

              {/* Médicaments utilisés */}
              <div className="mb-3">
                <label className="block text-xs text-gray-500 mb-2">Médicaments utilisés</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {medicaments.map(m => (
                    <button key={m.id} onClick={() => ajouterMedSelection(m)}
                      style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, border: '0.5px solid #085041', background: medsSelectionnes.find(ms => ms.id === m.id) ? '#085041' : '#fff', color: medsSelectionnes.find(ms => ms.id === m.id) ? '#fff' : '#085041', cursor: 'pointer' }}>
                      {m.nom}
                    </button>
                  ))}
                </div>
                {medsSelectionnes.map(ms => (
                  <div key={ms.id} className="flex items-center gap-2 mb-1">
                    <span style={{ fontSize: 11, flex: 1, color: '#333' }}>{ms.nom}</span>
                    <input type="number" min="1" value={ms.qte} onChange={e => updateQteMed(ms.id, e.target.value)}
                      style={{ width: 50, border: '0.5px solid #e5e5e0', borderRadius: 8, padding: '3px 6px', fontSize: 11, textAlign: 'center' }} />
                    <span style={{ fontSize: 10, color: '#888' }}>{ms.unite || 'cp'}</span>
                    <button onClick={() => retirerMed(ms.id)} style={{ fontSize: 10, color: '#A32D2D', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                  </div>
                ))}
              </div>

              <div className="mb-3">
                <label className="block text-xs text-gray-500 mb-1">Statut</label>
                <select value={fiche.statut} onChange={e => setF('statut', e.target.value)} className={inputStyle}>
                  {STATUTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>

              {fiche.statut === 'Évacué' && (
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Hôpital</label>
                    <input type="text" value={fiche.hopital} onChange={e => setF('hopital', e.target.value)}
                      placeholder="Ex : CHU de Bingerville" className={inputStyle} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Accompagnateur</label>
                    <input type="text" value={fiche.accompagnateur} onChange={e => setF('accompagnateur', e.target.value)}
                      placeholder="Nom de l'accompagnateur" className={inputStyle} />
                  </div>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-xs text-gray-500 mb-1">Notes</label>
                <textarea value={fiche.notes} onChange={e => setF('notes', e.target.value)}
                  placeholder="Observations complémentaires..." rows={2}
                  className={inputStyle + " resize-none"} />
              </div>

              <div className="flex gap-3">
                <button onClick={() => { setShowFiche(false); setEditFicheId(null) }}
                  className="flex-1 bg-gray-100 text-gray-600 text-sm font-medium py-3 rounded-xl">Annuler</button>
                <button onClick={saveFiche} disabled={saving}
                  className="flex-1 bg-emerald-700 text-white text-sm font-medium py-3 rounded-xl disabled:opacity-60">
                  {saving ? 'Enregistrement...' : editFicheId ? 'Modifier' : 'Enregistrer'}
                </button>
              </div>
            </div>
          )}

          {loading && <p className="text-sm text-gray-400 text-center py-8">Chargement...</p>}
          {!loading && fiches.length === 0 && (
            <div className="bg-white border border-gray-100 rounded-xl p-6 text-center">
              <p className="text-sm text-gray-400">Aucune fiche malade enregistrée.</p>
            </div>
          )}

          <div className="space-y-3">
            {fiches.map(f => {
              const sc = STATUT_CONFIG[f.statut] || STATUT_CONFIG['En traitement']
              const medsF = medUtilises.filter(mu => mu.fiche_id === f.id)
              return (
                <div key={f.id} style={{ background: '#fff', borderRadius: 14, border: `0.5px solid ${f.statut === 'Évacué' ? '#F09595' : '#e5e5e0'}`, padding: '12px 14px' }}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>{f.nom_campeur}</p>
                      <p style={{ fontSize: 10, color: '#888' }}>
                        {new Date(f.date_heure).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <span style={{ fontSize: 10, background: sc.bg, color: sc.color, borderRadius: 20, padding: '2px 8px', fontWeight: 500, flexShrink: 0 }}>{f.statut}</span>
                  </div>

                  <div style={{ background: '#f8f8f6', borderRadius: 8, padding: '8px 10px', marginBottom: 6 }}>
                    <p style={{ fontSize: 10, fontWeight: 600, color: '#085041', marginBottom: 3 }}>Symptômes</p>
                    <p style={{ fontSize: 11, color: '#333' }}>{f.symptomes}</p>
                  </div>

                  {f.traitement && (
                    <div style={{ background: '#E1F5EE', borderRadius: 8, padding: '8px 10px', marginBottom: 6 }}>
                      <p style={{ fontSize: 10, fontWeight: 600, color: '#085041', marginBottom: 3 }}>Traitement</p>
                      <p style={{ fontSize: 11, color: '#333' }}>{f.traitement}</p>
                    </div>
                  )}

                  {medsF.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {medsF.map(mu => (
                        <span key={mu.id} style={{ fontSize: 9, background: '#EEEDFE', color: '#534AB7', borderRadius: 20, padding: '1px 6px' }}>
                          {mu.nom_medicament} x{mu.quantite}
                        </span>
                      ))}
                    </div>
                  )}

                  {f.statut === 'Évacué' && (
                    <div style={{ background: '#FCEBEB', borderRadius: 8, padding: '8px 10px', marginBottom: 6 }}>
                      <p style={{ fontSize: 10, fontWeight: 600, color: '#A32D2D', marginBottom: 3 }}>Évacuation</p>
                      <p style={{ fontSize: 11, color: '#333' }}>{f.hopital} — {f.accompagnateur}</p>
                    </div>
                  )}

                  <div className="flex gap-2 mt-2">
                    <button onClick={() => {
                      setFiche({ nom_campeur: f.nom_campeur, symptomes: f.symptomes, traitement: f.traitement || '', statut: f.statut, hopital: f.hopital || '', accompagnateur: f.accompagnateur || '', notes: f.notes || '' })
                      setEditFicheId(f.id)
                      setMedsSelectionnes([])
                      setShowFiche(true)
                    }}
                      style={{ fontSize: 10, padding: '4px 8px', borderRadius: 8, border: '0.5px solid #E1F5EE', background: '#E1F5EE', color: '#085041', cursor: 'pointer' }}>
                      Modifier
                    </button>
                    <button onClick={() => supprimerFiche(f.id)}
                      style={{ fontSize: 10, padding: '4px 8px', borderRadius: 8, border: '0.5px solid #FCEBEB', background: '#FCEBEB', color: '#A32D2D', cursor: 'pointer' }}>
                      Supprimer
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ONGLET MÉDICAMENTS */}
      {onglet === 'medicaments' && (
        <>
          <button onClick={() => { setShowMed(!showMed); setEditMedId(null); setMedForm({ nom: '', quantite_initiale: 0, unite: 'comprimé(s)', statut: 'disponible' }) }}
            className="w-full mb-4 bg-emerald-700 text-white text-sm font-medium py-3 rounded-xl flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showMed && !editMedId ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"} /></svg>
            {showMed && !editMedId ? 'Fermer' : 'Ajouter un médicament'}
          </button>

          {showMed && (
            <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-5">
              <h2 className="text-sm font-medium text-gray-700 mb-4">{editMedId ? 'Modifier' : 'Nouveau médicament'}</h2>
              <div className="mb-3">
                <label className="block text-xs text-gray-500 mb-1">Nom *</label>
                <input type="text" value={medForm.nom} onChange={e => setM('nom', e.target.value)}
                  placeholder="Ex : Paracétamol, Ibuprofène..." className={inputStyle} />
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Quantité initiale</label>
                  <input type="number" min="0" value={medForm.quantite_initiale}
                    onChange={e => setM('quantite_initiale', e.target.value)} className={inputStyle} />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Unité</label>
                  <select value={medForm.unite} onChange={e => setM('unite', e.target.value)} className={inputStyle}>
                    {['comprimé(s)', 'sachet(s)', 'flacon(s)', 'ampoule(s)', 'tube(s)', 'boîte(s)'].map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setShowMed(false); setEditMedId(null) }}
                  className="flex-1 bg-gray-100 text-gray-600 text-sm font-medium py-3 rounded-xl">Annuler</button>
                <button onClick={saveMedicament} disabled={saving}
                  className="flex-1 bg-emerald-700 text-white text-sm font-medium py-3 rounded-xl disabled:opacity-60">
                  {saving ? 'Enregistrement...' : editMedId ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {medicaments.map(m => {
              const initial = m.quantite_initiale || 0
              const utilise = m.quantite_utilisee || 0
              const restant = initial - utilise
              const pct = initial > 0 ? (restant / initial) * 100 : 100
              return (
                <div key={m.id} style={{ background: '#fff', borderRadius: 14, border: `0.5px solid ${restant <= 0 ? '#F09595' : '#e5e5e0'}`, padding: '12px 14px' }}>
                  <div className="flex items-center justify-between mb-2">
                    <p style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>{m.nom}</p>
                    <div className="flex gap-1">
                      <button onClick={() => { setMedForm({ nom: m.nom, quantite_initiale: m.quantite_initiale || 0, unite: m.unite || 'comprimé(s)', statut: m.statut }); setEditMedId(m.id); setShowMed(true) }}
                        style={{ width: 28, height: 28, borderRadius: 7, background: '#E1F5EE', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg style={{ width: 12, height: 12, color: '#085041' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => supprimerMed(m.id)}
                        style={{ width: 28, height: 28, borderRadius: 7, background: '#FCEBEB', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg style={{ width: 12, height: 12, color: '#A32D2D' }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-4 mb-2">
                    <span style={{ fontSize: 10, color: '#888' }}>Initial : {initial} {m.unite}</span>
                    <span style={{ fontSize: 10, color: '#A32D2D' }}>Utilisé : {utilise}</span>
                    <span style={{ fontSize: 10, color: restant <= 0 ? '#A32D2D' : '#085041', fontWeight: 500 }}>Restant : {restant}</span>
                  </div>
                  <div style={{ background: '#f0f0ee', borderRadius: 4, height: 4 }}>
                    <div style={{ background: restant <= 0 ? '#A32D2D' : restant < initial * 0.2 ? '#854F0B' : '#085041', borderRadius: 4, height: 4, width: `${Math.max(0, pct)}%`, transition: 'width .3s' }} />
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ONGLET RAPPORT */}
      {onglet === 'rapport' && (
        <div className="space-y-4">

          <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #e5e5e0', padding: '14px' }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#085041', marginBottom: 10, letterSpacing: '0.05em' }}>RÉSUMÉ GÉNÉRAL</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total malades', val: totalMalades, bg: '#E6F1FB', color: '#185FA5' },
                { label: 'Guéris', val: gueris, bg: '#E1F5EE', color: '#085041' },
                { label: 'En traitement', val: enTraitement, bg: '#FAEEDA', color: '#854F0B' },
                { label: 'Évacués', val: evacues, bg: '#FCEBEB', color: '#A32D2D' },
              ].map(s => (
                <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: '10px 12px' }}>
                  <p style={{ fontSize: 20, fontWeight: 600, color: s.color }}>{s.val}</p>
                  <p style={{ fontSize: 10, color: s.color }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Évacuations */}
          {evacues > 0 && (
            <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #F09595', padding: '14px' }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#A32D2D', marginBottom: 10, letterSpacing: '0.05em' }}>ÉVACUATIONS</p>
              {fiches.filter(f => f.statut === 'Évacué').map(f => (
                <div key={f.id} style={{ background: '#FCEBEB', borderRadius: 10, padding: '10px 12px', marginBottom: 6 }}>
                  <p style={{ fontSize: 12, fontWeight: 500, color: '#A32D2D' }}>{f.nom_campeur}</p>
                  <p style={{ fontSize: 10, color: '#993C1D' }}>Hôpital : {f.hopital || '-'}</p>
                  <p style={{ fontSize: 10, color: '#993C1D' }}>Accompagnateur : {f.accompagnateur || '-'}</p>
                  <p style={{ fontSize: 10, color: '#993C1D' }}>{new Date(f.date_heure).toLocaleDateString('fr-FR')}</p>
                </div>
              ))}
            </div>
          )}

          {/* Médicaments les plus utilisés */}
          <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #e5e5e0', padding: '14px' }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#085041', marginBottom: 10, letterSpacing: '0.05em' }}>STOCK MÉDICAMENTS</p>
            {medicaments.map(m => {
              const initial = m.quantite_initiale || 0
              const utilise = m.quantite_utilisee || 0
              const restant = initial - utilise
              return (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '0.5px solid #f0f0ee' }}>
                  <p style={{ fontSize: 12, color: '#333' }}>{m.nom}</p>
                  <div style={{ display: 'flex', gap: 10, fontSize: 11 }}>
                    <span style={{ color: '#888' }}>Initial : {initial}</span>
                    <span style={{ color: '#A32D2D' }}>Utilisé : {utilise}</span>
                    <span style={{ color: restant <= 0 ? '#A32D2D' : '#085041', fontWeight: 500 }}>Restant : {restant}</span>
                  </div>
                </div>
              )
            })}
          </div>

          <button onClick={() => exportPDFSante(fiches, medicaments, medUtilises)}
            style={{ width: '100%', background: '#A32D2D', color: '#fff', border: 'none', borderRadius: 12, padding: '13px', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Exporter le rapport en PDF
          </button>
        </div>
      )}
    </AdminLayout>
  )
}
