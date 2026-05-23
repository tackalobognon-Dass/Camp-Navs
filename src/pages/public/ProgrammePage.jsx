import { useEffect, useState } from 'react'
import BottomNav from '../../components/public/BottomNav'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const JOURS = [
  { label: 'Dim 23', full: 'Dimanche 23 août', key: 'Dimanche' },
  { label: 'Lun 24', full: 'Lundi 24 août', key: 'Lundi' },
  { label: 'Mar 25', full: 'Mardi 25 août', key: 'Mardi' },
  { label: 'Mer 26', full: 'Mercredi 26 août', key: 'Mercredi' },
  { label: 'Jeu 27', full: 'Jeudi 27 août', key: 'Jeudi' },
  { label: 'Ven 28', full: 'Vendredi 28 août', key: 'Vendredi' },
  { label: 'Sam 29', full: 'Samedi 29 août', key: 'Samedi' },
]

const TYPES = {
  'Louange et adoration':     { emoji: '🎵', bg: '#EEEDFE', color: '#534AB7', dot: '#534AB7' },
  'Message':                  { emoji: '📖', bg: '#E1F5EE', color: '#085041', dot: '#085041' },
  'Études bibliques':         { emoji: '📚', bg: '#E1F5EE', color: '#0F6E56', dot: '#0F6E56' },
  'Méditation en groupe':     { emoji: '🧘', bg: '#E6F1FB', color: '#185FA5', dot: '#185FA5' },
  'Méditation individuelle':  { emoji: '🙏', bg: '#E6F1FB', color: '#185FA5', dot: '#185FA5' },
  'Prière d\'ensemble':       { emoji: '🤲', bg: '#EEEDFE', color: '#534AB7', dot: '#534AB7' },
  'Ateliers':                 { emoji: '✏️', bg: '#FAEEDA', color: '#854F0B', dot: '#854F0B' },
  'Repas et repos':           { emoji: '🍽️', bg: '#FAEEDA', color: '#854F0B', dot: '#854F0B' },
  'Sports et loisirs':        { emoji: '⚽', bg: '#EAF3DE', color: '#3B6D11', dot: '#3B6D11' },
  'Soirée récréative':        { emoji: '🎉', bg: '#FAECE7', color: '#993C1D', dot: '#993C1D' },
  'Temps en équipe':          { emoji: '👥', bg: '#E6F1FB', color: '#185FA5', dot: '#185FA5' },
  'Toilette et petit déjeuner': { emoji: '🌅', bg: '#FAEEDA', color: '#854F0B', dot: '#854F0B' },
  'Dîner':                    { emoji: '🍽️', bg: '#FAEEDA', color: '#854F0B', dot: '#854F0B' },
  'Jeûne':                    { emoji: '💧', bg: '#E6F1FB', color: '#185FA5', dot: '#185FA5' },
  'Pause':                    { emoji: '☕', bg: '#F1EFE8', color: '#5F5E5A', dot: '#888780' },
  'Aller au lit':             { emoji: '🌙', bg: '#F1EFE8', color: '#444441', dot: '#444441' },
  'Temps libre':              { emoji: '🌿', bg: '#EAF3DE', color: '#3B6D11', dot: '#3B6D11' },
  'Autre':                    { emoji: '📌', bg: '#F1EFE8', color: '#5F5E5A', dot: '#888780' },
}

export default function ProgrammePage() {
  const navigate = useNavigate()
  const [programme, setProgramme] = useState([])
  const [loading, setLoading] = useState(true)
  const [jourActif, setJourActif] = useState('Dimanche')

  useEffect(() => {
    async function fetchProgramme() {
      const { data } = await supabase
        .from('programme_camp')
        .select('*')
        .order('heure_debut', { ascending: true })
      setProgramme(data || [])
      setLoading(false)
    }
    fetchProgramme()
  }, [])

  const activitesDuJour = programme
    .filter(p => p.jour === jourActif)
    .sort((a, b) => (a.heure_debut || '').localeCompare(b.heure_debut || ''))

  const jourInfo = JOURS.find(j => j.key === jourActif)

  return (
    <div style={{ minHeight: '100vh', background: '#f8f8f6', maxWidth: 480, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(160deg,#054035,#085041)', padding: '44px 16px 16px', color: '#fff' }}>
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#9FE1CB', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 10 }}>
          ← Retour
        </button>
        <div style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 2 }}>Programme du camp</div>
        <div style={{ fontSize: 10, color: '#9FE1CB' }}>Camp-Navs 2026 · La Sablière, Bingerville</div>
      </div>

      {/* Sélecteur de jours */}
      <div style={{ background: '#fff', borderBottom: '0.5px solid #e5e5e0', padding: '10px 14px', overflowX: 'auto', display: 'flex', gap: 6, scrollbarWidth: 'none' }}>
        {JOURS.map(j => (
          <button key={j.key} onClick={() => setJourActif(j.key)}
            style={{
              flexShrink: 0, padding: '6px 12px', borderRadius: 20, fontSize: 10, fontWeight: 500,
              cursor: 'pointer', border: `0.5px solid ${jourActif === j.key ? '#085041' : '#e5e5e0'}`,
              background: jourActif === j.key ? '#085041' : '#fff',
              color: jourActif === j.key ? '#fff' : '#666',
              transition: 'all .2s',
            }}>
            {j.label}
          </button>
        ))}
      </div>

      {/* Titre du jour */}
      {jourInfo && (
        <div style={{ padding: '12px 16px 4px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#085041' }}>{jourInfo.full}</div>
          <div style={{ fontSize: 10, color: '#888780', marginTop: 2 }}>{activitesDuJour.length} activité(s)</div>
        </div>
      )}

      {/* Timeline */}
      <div style={{ padding: '8px 16px 100px' }}>
        {loading && <p style={{ textAlign: 'center', fontSize: 13, color: '#888', padding: '30px 0' }}>Chargement...</p>}

        {!loading && activitesDuJour.length === 0 && (
          <div style={{ background: '#fff', borderRadius: 16, border: '0.5px solid #e5e5e0', padding: 24, textAlign: 'center', marginTop: 8 }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>📅</div>
            <p style={{ fontSize: 13, color: '#888' }}>Programme non disponible pour ce jour.</p>
            <p style={{ fontSize: 11, color: '#bbb', marginTop: 4 }}>Revenez bientôt.</p>
          </div>
        )}

        {activitesDuJour.map((item, index) => {
          const type = TYPES[item.type_activite] || TYPES['Autre']
          const isLast = index === activitesDuJour.length - 1
          return (
            <div key={item.id} style={{ display: 'flex', gap: 10, marginBottom: 0 }}>
              {/* Colonne gauche : heure */}
              <div style={{ width: 46, flexShrink: 0, paddingTop: 4 }}>
                <div style={{ fontSize: 9, color: '#888780', fontWeight: 500, textAlign: 'right' }}>
                  {item.heure_debut || '--'}
                </div>
              </div>

              {/* Ligne verticale + dot */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 16, flexShrink: 0 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: type.dot, marginTop: 5, flexShrink: 0 }} />
                {!isLast && <div style={{ width: 1.5, flex: 1, background: '#e5e5e0', marginTop: 3, minHeight: 20 }} />}
              </div>

              {/* Carte activité */}
              <div style={{ flex: 1, marginBottom: 10 }}>
                <div style={{ background: type.bg, borderRadius: 12, padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: type.dot, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 15 }}>
                    {type.emoji}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: type.color }}>{item.activite}</div>
                    <div style={{ fontSize: 9, color: type.color, opacity: 0.75, marginTop: 2 }}>
                      {item.heure_debut}{item.heure_fin ? ` – ${item.heure_fin}` : ''}
                      {item.lieu ? ` · ${item.lieu}` : ''}
                    </div>
                    {item.responsable && (
                      <div style={{ fontSize: 9, color: '#888780', marginTop: 2 }}>{item.responsable}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom nav */}
      <BottomNav />
    </div>
  )
}
