import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/admin/AdminLayout'

const VERSETS = [
  { texte: "Je puis tout par celui qui me fortifie.", ref: "Philippiens 4:13" },
  { texte: "L'Éternel est mon berger, je ne manquerai de rien.", ref: "Psaume 23:1" },
  { texte: "Confie-toi en l'Éternel de tout ton cœur.", ref: "Proverbes 3:5" },
  { texte: "Car je connais les projets que j'ai formés sur vous.", ref: "Jérémie 29:11" },
  { texte: "Ceux qui se confient en l'Éternel renouvellent leur force.", ref: "Ésaïe 40:31" },
  { texte: "Ne crains rien, car je suis avec toi.", ref: "Ésaïe 41:10" },
  { texte: "Cherchez premièrement le royaume et la justice de Dieu.", ref: "Matthieu 6:33" },
  { texte: "Je suis avec vous tous les jours, jusqu'à la fin du monde.", ref: "Matthieu 28:20" },
  { texte: "Si Dieu est pour nous, qui sera contre nous ?", ref: "Romains 8:31" },
  { texte: "Aimez-vous les uns les autres comme je vous ai aimés.", ref: "Jean 15:12" },
  { texte: "Ta parole est une lampe à mes pieds.", ref: "Psaume 119:105" },
  { texte: "Que tout ce que vous faites soit fait avec amour.", ref: "1 Corinthiens 16:14" },
  { texte: "Réjouissez-vous toujours dans le Seigneur.", ref: "Philippiens 4:4" },
  { texte: "Rendez grâces en toutes choses.", ref: "1 Thessaloniciens 5:18" },
  { texte: "En toutes choses, nous sommes plus que vainqueurs.", ref: "Romains 8:37" },
  { texte: "Venez à moi, vous tous qui êtes fatigués et chargés.", ref: "Matthieu 11:28" },
  { texte: "Que la paix de Dieu garde vos cœurs.", ref: "Philippiens 4:7" },
  { texte: "L'amour de Dieu a été répandu dans nos cœurs.", ref: "Romains 5:5" },
  { texte: "Ne vous lassez pas de faire le bien.", ref: "2 Thessaloniciens 3:13" },
  { texte: "L'Éternel est proche de ceux qui ont le cœur brisé.", ref: "Psaume 34:18" },
  { texte: "Dieu a tant aimé le monde qu'il a donné son Fils unique.", ref: "Jean 3:16" },
  { texte: "Heureux les artisans de paix.", ref: "Matthieu 5:9" },
  { texte: "L'Éternel est ma lumière et mon salut.", ref: "Psaume 27:1" },
  { texte: "Fortifiez-vous et prenez courage !", ref: "Psaume 31:24" },
  { texte: "Celui qui habite sous l'abri du Très-Haut.", ref: "Psaume 91:1" },
  { texte: "C'est par la grâce que vous êtes sauvés.", ref: "Éphésiens 2:8" },
  { texte: "Que votre lumière brille ainsi devant les hommes.", ref: "Matthieu 5:16" },
  { texte: "L'Éternel te bénisse et te garde !", ref: "Nombres 6:24" },
  { texte: "Je suis la résurrection et la vie.", ref: "Jean 11:25" },
  { texte: "Soyez forts et courageux. Ne craignez rien.", ref: "Deutéronome 31:6" },
]

function getVerset() {
  const jour = new Date().getDate() + new Date().getMonth() * 31
  return VERSETS[jour % VERSETS.length]
}

function getMontantDu(ins) {
  if (ins.montant_personnalise != null) return ins.montant_personnalise
  return ins.tranche_age === 'Enfants & Adolescents' ? 25000 : 30000
}

const statutBadge = {
  'payé':       { bg: '#DCFCE7', color: '#166534', label: 'Payé' },
  'en attente': { bg: '#FEF9C3', color: '#854D0E', label: 'En attente' },
  'partiel':    { bg: '#DBEAFE', color: '#1E40AF', label: 'Partiel' },
}

const VERT = '#1B3B2B'

export default function DashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({ totalInscrits: 0, payes: 0, enAttente: 0, partiels: 0, montantCollecte: 0, solde: 0, budgetGlobal: 0, totalRecettes: 0 })
  const [dernieres, setDernieres] = useState([])
  const [loading, setLoading] = useState(true)
  const verset = getVerset()

  useEffect(() => {
    async function fetchData() {
      const [{ data: ins }, { data: rec }, { data: dep }, { data: bg }] = await Promise.all([
        supabase.from('inscriptions').select('*').order('created_at', { ascending: false }),
        supabase.from('recettes').select('montant, valeur_estimee'),
        supabase.from('depenses').select('montant'),
        supabase.from('budget_global').select('montant').limit(1),
      ])
      const inscrits = ins || []
      const montantCollecte = inscrits.reduce((s, i) => { const du = getMontantDu(i); return s + (i.statut_paiement === 'payé' ? du : (i.montant_paye || 0)) }, 0)
      const totalRec = (rec || []).reduce((s, r) => s + (r.montant || r.valeur_estimee || 0), 0)
      const totalDep = (dep || []).reduce((s, d) => s + (d.montant || 0), 0)
      const budget = bg && bg.length > 0 ? bg[0].montant : 0
      setStats({ totalInscrits: inscrits.length, payes: inscrits.filter(i => i.statut_paiement === 'payé').length, enAttente: inscrits.filter(i => i.statut_paiement === 'en attente').length, partiels: inscrits.filter(i => i.statut_paiement === 'partiel').length, montantCollecte, solde: totalRec - totalDep, budgetGlobal: budget, totalRecettes: totalRec })
      setDernieres(inscrits.slice(0, 5))
      setLoading(false)
    }
    fetchData()
  }, [])

  const pctBudget = stats.budgetGlobal > 0 ? Math.min((stats.totalRecettes / stats.budgetGlobal) * 100, 100) : 0

  return (
    <AdminLayout>

      {/* Verset du jour */}
      <div style={{ textAlign: 'center', padding: '8px 12px 14px' }}>
        <p style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 15, fontStyle: 'italic', color: '#374151', lineHeight: 1.6, margin: '0 0 6px' }}>
          « {verset.texte} »
        </p>
        <span style={{ fontSize: 11, color: '#94A3B8', fontStyle: 'normal', letterSpacing: '0.03em' }}>— {verset.ref}</span>
      </div>

      {loading && <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '20px 0' }}>Chargement...</p>}

      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* INSCRIPTIONS — 4 badges horizontaux */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', margin: '0 0 8px', textTransform: 'uppercase' }}>Inscriptions</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {[
                { label: 'Total', val: stats.totalInscrits, bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
                { label: 'Payés', val: stats.payes, bg: '#ECFDF5', color: '#065F46', border: '#6EE7B7' },
                { label: 'Attente', val: stats.enAttente, bg: '#FFFBEB', color: '#92400E', border: '#FCD34D' },
                { label: 'Partiel', val: stats.partiels, bg: '#F5F3FF', color: '#6D28D9', border: '#DDD6FE' },
              ].map(k => (
                <div key={k.label} style={{ background: '#fff', borderRadius: 10, border: `1px solid ${k.border}`, padding: '8px 6px', textAlign: 'center' }}>
                  <p style={{ fontSize: 22, fontWeight: 700, color: k.color, margin: '0 0 2px', lineHeight: 1 }}>{k.val}</p>
                  <p style={{ fontSize: 9, color: '#94A3B8', margin: 0, letterSpacing: '0.03em' }}>{k.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* FINANCES — carte unifiée compacte */}
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', margin: '0 0 8px', textTransform: 'uppercase' }}>Finances</p>
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #F1F5F9', padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 }}>
                <div>
                  <p style={{ fontSize: 10, color: '#94A3B8', margin: '0 0 3px' }}>Montant collecté</p>
                  <p style={{ fontSize: 22, fontWeight: 700, color: '#065F46', margin: 0, lineHeight: 1 }}>
                    {stats.montantCollecte.toLocaleString()}
                    <span style={{ fontSize: 11, fontWeight: 400, color: '#94A3B8', marginLeft: 3 }}>FCFA</span>
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 10, color: '#94A3B8', margin: '0 0 3px' }}>Solde disponible</p>
                  <p style={{ fontSize: 16, fontWeight: 700, color: stats.solde >= 0 ? '#1D4ED8' : '#DC2626', margin: 0 }}>
                    {stats.solde.toLocaleString()} FCFA
                  </p>
                </div>
              </div>
              {stats.budgetGlobal > 0 && (
                <>
                  <div style={{ background: '#F1F5F9', borderRadius: 4, height: 3, marginBottom: 5 }}>
                    <div style={{ background: VERT, borderRadius: 4, height: 3, width: `${pctBudget}%`, transition: 'width .4s' }} />
                  </div>
                  <p style={{ fontSize: 10, color: '#94A3B8', margin: 0 }}>
                    {Math.round(pctBudget)}% atteint · {stats.totalRecettes.toLocaleString()} collectés · Objectif : {stats.budgetGlobal.toLocaleString()} FCFA
                  </p>
                </>
              )}
            </div>
          </div>

          {/* DERNIÈRES INSCRIPTIONS */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', margin: 0, textTransform: 'uppercase' }}>Dernières inscriptions</p>
              <button type="button" onClick={() => navigate('/admin/campeurs')}
                style={{ fontSize: 12, fontWeight: 700, color: VERT, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                Voir tout →
              </button>
            </div>
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #F1F5F9', overflow: 'hidden' }}>
              {dernieres.length === 0 ? (
                <p style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '16px', margin: 0 }}>Aucune inscription.</p>
              ) : (
                dernieres.map((ins, i) => {
                  const sb = statutBadge[ins.statut_paiement] || { bg: '#F3F4F6', color: '#374151', label: ins.statut_paiement }
                  return (
                    <div key={ins.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderBottom: i < dernieres.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#E8F5E8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: VERT }}>{ins.nom_complet?.charAt(0)}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', margin: '0 0 1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ins.nom_complet}</p>
                        <p style={{ fontSize: 10, color: '#94A3B8', margin: 0 }}>
                          {ins.tranche_age === 'Jeunes & Adultes' ? 'Jeune/Adulte' : 'Enfant/Ado'} · {new Date(ins.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 600, background: sb.bg, color: sb.color, borderRadius: 20, padding: '3px 9px', flexShrink: 0 }}>
                        {sb.label}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>

        </div>
      )}
    </AdminLayout>
  )
}
