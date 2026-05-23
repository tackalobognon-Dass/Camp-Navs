import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/admin/AdminLayout'

const VERSETS = [
  { texte: "Je puis tout par celui qui me fortifie.", ref: "Philippiens 4:13" },
  { texte: "L'Éternel est mon berger, je ne manquerai de rien.", ref: "Psaume 23:1" },
  { texte: "Confie-toi en l'Éternel de tout ton cœur, et ne t'appuie pas sur ta sagesse.", ref: "Proverbes 3:5" },
  { texte: "Car je connais les projets que j'ai formés sur vous, projets de paix et non de malheur.", ref: "Jérémie 29:11" },
  { texte: "Mais ceux qui se confient en l'Éternel renouvellent leur force.", ref: "Ésaïe 40:31" },
  { texte: "Ne crains rien, car je suis avec toi.", ref: "Ésaïe 41:10" },
  { texte: "Cherchez premièrement le royaume et la justice de Dieu.", ref: "Matthieu 6:33" },
  { texte: "Voici, je suis avec vous tous les jours, jusqu'à la fin du monde.", ref: "Matthieu 28:20" },
  { texte: "Si Dieu est pour nous, qui sera contre nous ?", ref: "Romains 8:31" },
  { texte: "Aimez-vous les uns les autres comme je vous ai aimés.", ref: "Jean 15:12" },
  { texte: "Ta parole est une lampe à mes pieds, et une lumière sur mon sentier.", ref: "Psaume 119:105" },
  { texte: "Que tout ce que vous faites soit fait avec amour.", ref: "1 Corinthiens 16:14" },
  { texte: "Réjouissez-vous toujours dans le Seigneur. Je le répète : réjouissez-vous !", ref: "Philippiens 4:4" },
  { texte: "Rendez grâces en toutes choses.", ref: "1 Thessaloniciens 5:18" },
  { texte: "En toutes choses, nous sommes plus que vainqueurs.", ref: "Romains 8:37" },
  { texte: "Venez à moi, vous tous qui êtes fatigués et chargés.", ref: "Matthieu 11:28" },
  { texte: "Que la paix de Dieu garde vos cœurs.", ref: "Philippiens 4:7" },
  { texte: "L'amour de Dieu a été répandu dans nos cœurs.", ref: "Romains 5:5" },
  { texte: "Ne vous lassez pas de faire le bien.", ref: "2 Thessaloniciens 3:13" },
  { texte: "L'Éternel est proche de ceux qui ont le cœur brisé.", ref: "Psaume 34:18" },
  { texte: "Dieu a tant aimé le monde qu'il a donné son Fils unique.", ref: "Jean 3:16" },
  { texte: "Heureux les artisans de paix, car ils seront appelés fils de Dieu.", ref: "Matthieu 5:9" },
  { texte: "L'Éternel est ma lumière et mon salut : de qui aurais-je crainte ?", ref: "Psaume 27:1" },
  { texte: "Fortifiez-vous et prenez courage !", ref: "Psaume 31:24" },
  { texte: "Celui qui habite sous l'abri du Très-Haut repose à l'ombre du Tout-Puissant.", ref: "Psaume 91:1" },
  { texte: "C'est par la grâce que vous êtes sauvés, par le moyen de la foi.", ref: "Éphésiens 2:8" },
  { texte: "Que votre lumière brille ainsi devant les hommes.", ref: "Matthieu 5:16" },
  { texte: "L'Éternel te bénisse et te garde !", ref: "Nombres 6:24" },
  { texte: "Je suis la résurrection et la vie.", ref: "Jean 11:25" },
  { texte: "Soyez forts et courageux. Ne craignez rien.", ref: "Deutéronome 31:6" },
  { texte: "Car je sais que c'est pour mon salut.", ref: "Philippiens 1:19" },
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
  'payé':       { bg: 'rgba(16,185,129,0.1)', color: '#065f46', label: 'Payé' },
  'en attente': { bg: 'rgba(245,158,11,0.1)', color: '#92400e', label: 'En attente' },
  'partiel':    { bg: 'rgba(59,130,246,0.1)', color: '#1e3a8a', label: 'Partiel' },
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalInscrits: 0, jeunes: 0, enfants: 0,
    payes: 0, enAttente: 0, partiels: 0,
    montantCollecte: 0, solde: 0, budgetGlobal: 0, totalRecettes: 0,
  })
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
      const montantCollecte = inscrits.reduce((s, i) => {
        const du = getMontantDu(i)
        return s + (i.statut_paiement === 'payé' ? du : (i.montant_paye || 0))
      }, 0)
      const totalRec = (rec || []).reduce((s, r) => s + (r.montant || r.valeur_estimee || 0), 0)
      const totalDep = (dep || []).reduce((s, d) => s + (d.montant || 0), 0)
      const budget = bg && bg.length > 0 ? bg[0].montant : 0

      setStats({
        totalInscrits: inscrits.length,
        jeunes: inscrits.filter(i => i.tranche_age === 'Jeunes & Adultes').length,
        enfants: inscrits.filter(i => i.tranche_age === 'Enfants & Adolescents').length,
        payes: inscrits.filter(i => i.statut_paiement === 'payé').length,
        enAttente: inscrits.filter(i => i.statut_paiement === 'en attente').length,
        partiels: inscrits.filter(i => i.statut_paiement === 'partiel').length,
        montantCollecte,
        solde: totalRec - totalDep,
        budgetGlobal: budget,
        totalRecettes: totalRec,
      })
      setDernieres(inscrits.slice(0, 5))
      setLoading(false)
    }
    fetchData()
  }, [])

  const pctBudget = stats.budgetGlobal > 0 ? Math.min((stats.totalRecettes / stats.budgetGlobal) * 100, 100) : 0

  const kpis = [
    {
      label: 'Total inscrits', val: stats.totalInscrits,
      icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
      iconBg: '#EFF6FF', iconColor: '#2563EB',
    },
    {
      label: 'Payés', val: stats.payes,
      icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      iconBg: '#ECFDF5', iconColor: '#059669',
    },
    {
      label: 'En attente', val: stats.enAttente,
      icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      iconBg: '#FFFBEB', iconColor: '#D97706',
    },
    {
      label: 'Partiels', val: stats.partiels,
      icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
      iconBg: '#EFF6FF', iconColor: '#3B82F6',
    },
  ]

  return (
    <AdminLayout>

      {/* Verset du jour — bandeau compact */}
      <div style={{
        background: '#fff',
        borderRadius: 10,
        borderLeft: '3px solid #054035',
        padding: '10px 14px',
        marginBottom: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#054035" strokeWidth="1.5" style={{ flexShrink: 0 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 12, fontStyle: 'italic', color: '#374151' }}>« {verset.texte} »</span>
          <span style={{ fontSize: 10, color: '#9CA3AF', marginLeft: 6 }}>{verset.ref}</span>
        </div>
      </div>

      {loading && <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: '32px 0' }}>Chargement...</p>}

      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* KPI Cards — Inscriptions */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.07em', marginBottom: 10 }}>INSCRIPTIONS</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {kpis.map(k => (
                <div key={k.label} style={{
                  background: '#fff',
                  borderRadius: 12,
                  border: '0.5px solid #F3F4F6',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  padding: '14px 14px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: k.iconBg, color: k.iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {k.icon}
                  </div>
                  <div>
                    <p style={{ fontSize: 24, fontWeight: 700, color: '#111827', margin: 0, lineHeight: 1 }}>{k.val}</p>
                    <p style={{ fontSize: 11, color: '#6B7280', margin: '4px 0 0' }}>{k.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Finances */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.07em', marginBottom: 10 }}>FINANCES</p>
            <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #F3F4F6', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', padding: 16 }}>

              {/* Montant collecté mis en valeur */}
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>Montant collecté</p>
                <p style={{ fontSize: 30, fontWeight: 700, color: '#059669', margin: 0, lineHeight: 1 }}>
                  {stats.montantCollecte.toLocaleString()}
                  <span style={{ fontSize: 14, fontWeight: 400, color: '#6B7280', marginLeft: 4 }}>FCFA</span>
                </p>
              </div>

              {/* Solde */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '0.5px solid #F3F4F6', marginBottom: 16 }}>
                <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>Solde disponible</p>
                <p style={{ fontSize: 15, fontWeight: 600, color: stats.solde >= 0 ? '#2563EB' : '#DC2626', margin: 0 }}>
                  {stats.solde.toLocaleString()} FCFA
                </p>
              </div>

              {/* Jauge budget global */}
              {stats.budgetGlobal > 0 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: '#6B7280' }}>Budget global</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#054035' }}>{Math.round(pctBudget)}% atteint</span>
                  </div>
                  <div style={{ background: '#F3F4F6', borderRadius: 8, height: 10, overflow: 'hidden' }}>
                    <div style={{
                      height: 10,
                      borderRadius: 8,
                      width: `${pctBudget}%`,
                      background: pctBudget >= 100 ? '#059669' : pctBudget >= 60 ? '#0EA5E9' : '#F59E0B',
                      transition: 'width .4s ease',
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                    <span style={{ fontSize: 10, color: '#9CA3AF' }}>{stats.totalRecettes.toLocaleString()} collectés</span>
                    <span style={{ fontSize: 10, color: '#9CA3AF' }}>Objectif : {stats.budgetGlobal.toLocaleString()} FCFA</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dernières inscriptions */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.07em', margin: 0 }}>DERNIÈRES INSCRIPTIONS</p>
              <button onClick={() => navigate('/admin/campeurs')}
                style={{ fontSize: 11, color: '#054035', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                Voir tout →
              </button>
            </div>

            {dernieres.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #F3F4F6', padding: '20px', textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: '#9CA3AF' }}>Aucune inscription.</p>
              </div>
            ) : (
              <div style={{ background: '#fff', borderRadius: 12, border: '0.5px solid #F3F4F6', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                {dernieres.map((ins, i) => {
                  const sb = statutBadge[ins.statut_paiement] || { bg: '#F3F4F6', color: '#374151', label: ins.statut_paiement }
                  return (
                    <div key={ins.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '11px 14px',
                      borderBottom: i < dernieres.length - 1 ? '0.5px solid #F9FAFB' : 'none',
                    }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#059669' }}>{ins.nom_complet?.charAt(0)}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 500, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ins.nom_complet}</p>
                        <p style={{ fontSize: 10, color: '#9CA3AF', margin: '2px 0 0' }}>
                          {ins.tranche_age === 'Jeunes & Adultes' ? 'Jeune/Adulte' : 'Enfant/Ado'} · {new Date(ins.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <span style={{
                        fontSize: 10, fontWeight: 500,
                        background: sb.bg, color: sb.color,
                        borderRadius: 20, padding: '3px 9px',
                        flexShrink: 0,
                      }}>
                        {sb.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      )}
    </AdminLayout>
  )
}
