import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/admin/AdminLayout'

const VERSETS = [
  { texte: "Je puis tout par celui qui me fortifie.", ref: "Philippiens 4:13" },
  { texte: "L'Éternel est mon berger, je ne manquerai de rien.", ref: "Psaume 23:1" },
  { texte: "Confie-toi en l'Éternel de tout ton cœur, et ne t'appuie pas sur ta sagesse.", ref: "Proverbes 3:5" },
  { texte: "Car je connais les projets que j'ai formés sur vous, dit l'Éternel, projets de paix et non de malheur, afin de vous donner un avenir et de l'espérance.", ref: "Jérémie 29:11" },
  { texte: "Mais ceux qui se confient en l'Éternel renouvellent leur force. Ils prennent le vol comme les aigles.", ref: "Ésaïe 40:31" },
  { texte: "Ne crains rien, car je suis avec toi ; ne promène pas des regards inquiets, car je suis ton Dieu.", ref: "Ésaïe 41:10" },
  { texte: "Cherchez premièrement le royaume et la justice de Dieu ; et toutes ces choses vous seront données par-dessus.", ref: "Matthieu 6:33" },
  { texte: "Voici, je suis avec vous tous les jours, jusqu'à la fin du monde.", ref: "Matthieu 28:20" },
  { texte: "L'amour de Dieu a été répandu dans nos cœurs par le Saint-Esprit qui nous a été donné.", ref: "Romains 5:5" },
  { texte: "Soyez forts et courageux. Ne craignez rien, ne soyez pas effrayés, car l'Éternel, ton Dieu, marchera avec toi.", ref: "Deutéronome 31:6" },
  { texte: "Heureux les artisans de paix, car ils seront appelés fils de Dieu.", ref: "Matthieu 5:9" },
  { texte: "C'est par la grâce que vous êtes sauvés, par le moyen de la foi.", ref: "Éphésiens 2:8" },
  { texte: "Que votre lumière brille ainsi devant les hommes, afin qu'ils voient vos bonnes œuvres.", ref: "Matthieu 5:16" },
  { texte: "Réjouissez-vous toujours dans le Seigneur. Je le répète : réjouissez-vous !", ref: "Philippiens 4:4" },
  { texte: "Ne vous lassez pas de faire le bien.", ref: "2 Thessaloniciens 3:13" },
  { texte: "Rendez grâces en toutes choses, car c'est à votre égard la volonté de Dieu.", ref: "1 Thessaloniciens 5:18" },
  { texte: "L'Éternel est proche de ceux qui ont le cœur brisé, et il sauve ceux qui ont l'esprit dans l'abattement.", ref: "Psaume 34:18" },
  { texte: "Fortifiez-vous et prenez courage ! Ne craignez pas.", ref: "Psaume 31:24" },
  { texte: "Celui qui habite sous l'abri du Très-Haut repose à l'ombre du Tout-Puissant.", ref: "Psaume 91:1" },
  { texte: "En toutes choses, nous sommes plus que vainqueurs par celui qui nous a aimés.", ref: "Romains 8:37" },
  { texte: "Venez à moi, vous tous qui êtes fatigués et chargés, et je vous donnerai du repos.", ref: "Matthieu 11:28" },
  { texte: "Car Dieu n'est pas un Dieu de désordre, mais un Dieu de paix.", ref: "1 Corinthiens 14:33" },
  { texte: "Que la paix de Dieu, qui surpasse toute intelligence, garde vos cœurs.", ref: "Philippiens 4:7" },
  { texte: "Si Dieu est pour nous, qui sera contre nous ?", ref: "Romains 8:31" },
  { texte: "Aimez-vous les uns les autres comme je vous ai aimés.", ref: "Jean 15:12" },
  { texte: "Ta parole est une lampe à mes pieds, et une lumière sur mon sentier.", ref: "Psaume 119:105" },
  { texte: "L'Éternel te bénisse et te garde !", ref: "Nombres 6:24" },
  { texte: "Que tout ce que vous faites soit fait avec amour.", ref: "1 Corinthiens 16:14" },
  { texte: "Dieu a tant aimé le monde qu'il a donné son Fils unique.", ref: "Jean 3:16" },
  { texte: "Je suis la résurrection et la vie. Celui qui croit en moi vivra, même s'il meurt.", ref: "Jean 11:25" },
  { texte: "L'Éternel est ma lumière et mon salut : de qui aurais-je crainte ?", ref: "Psaume 27:1" },
]

function getVerset() {
  const jour = new Date().getDate() + new Date().getMonth() * 31
  return VERSETS[jour % VERSETS.length]
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalInscrits: 0, jeunes: 0, enfants: 0,
    payes: 0, enAttente: 0, partiels: 0,
    montantCollecte: 0, solde: 0, budgetGlobal: 0,
    totalDepenses: 0,
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
      const jeunes = inscrits.filter(i => i.tranche_age === 'Jeunes & Adultes')
      const enfants = inscrits.filter(i => i.tranche_age === 'Enfants & Adolescents')
      const payes = inscrits.filter(i => i.statut_paiement === 'payé')
      const enAttente = inscrits.filter(i => i.statut_paiement === 'en attente')
      const partiels = inscrits.filter(i => i.statut_paiement === 'partiel')

      function getMontantDu(ins) {
        if (ins.montant_personnalise != null) return ins.montant_personnalise
        return ins.tranche_age === 'Enfants & Adolescents' ? 25000 : 30000
      }

      const montantCollecte = inscrits.reduce((s, i) => {
        const du = getMontantDu(i)
        return s + (i.statut_paiement === 'payé' ? du : (i.montant_paye || 0))
      }, 0)

      const totalRec = (rec || []).reduce((s, r) => s + (r.montant || r.valeur_estimee || 0), 0)
      const totalDep = (dep || []).reduce((s, d) => s + (d.montant || 0), 0)
      const budget = bg && bg.length > 0 ? bg[0].montant : 0

      setStats({
        totalInscrits: inscrits.length,
        jeunes: jeunes.length,
        enfants: enfants.length,
        payes: payes.length,
        enAttente: enAttente.length,
        partiels: partiels.length,
        montantCollecte,
        solde: totalRec - totalDep,
        budgetGlobal: budget,
        totalDepenses: totalDep,
        totalRecettes: totalRec,
      })
      setDernieres(inscrits.slice(0, 5))
      setLoading(false)
    }
    fetchData()
  }, [])

  const pctJeunes = Math.min((stats.jeunes / 100) * 100, 100)
  const pctEnfants = Math.min((stats.enfants / 50) * 100, 100)
  const pctBudget = stats.budgetGlobal > 0 ? Math.min((stats.totalRecettes / stats.budgetGlobal) * 100, 100) : 0

  const statutColor = {
    'payé': { bg: '#E1F5EE', color: '#085041' },
    'en attente': { bg: '#FAEEDA', color: '#854F0B' },
    'partiel': { bg: '#E6F1FB', color: '#185FA5' },
  }

  return (
    <AdminLayout>
      {/* Verset du jour */}
      <div style={{ background: '#fff', padding: '12px 14px', marginBottom: 20, borderLeft: '3px solid #085041' }}>
        <p style={{ fontSize: 9, color: '#085041', fontWeight: 600, letterSpacing: '0.06em', marginBottom: 4 }}>VERSET DU JOUR</p>
        <p style={{ fontSize: 13, color: '#1a1a1a', lineHeight: 1.6, fontStyle: 'italic', marginBottom: 4 }}>« {verset.texte} »</p>
        <p style={{ fontSize: 10, color: '#888' }}>{verset.ref}</p>
      </div>

      {loading && <p className="text-sm text-gray-400 text-center py-8">Chargement...</p>}

      {!loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Inscriptions */}
          <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #e5e5e0', overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px', borderBottom: '0.5px solid #f0f0ee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: 9, fontWeight: 600, color: '#085041', letterSpacing: '0.05em' }}>INSCRIPTIONS</p>
              <p style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a' }}>{stats.totalInscrits} <span style={{ fontSize: 12, color: '#888', fontWeight: 400 }}>/ 150</span></p>
            </div>

            {/* Répartition jeunes / enfants */}
            <div style={{ padding: '10px 14px', borderBottom: '0.5px solid #f0f0ee', display: 'flex', justifyContent: 'space-around' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a' }}>{stats.jeunes}</p>
                <p style={{ fontSize: 10, color: '#888' }}>Jeunes & Adultes</p>
                <p style={{ fontSize: 9, color: '#aaa' }}>sur 100</p>
              </div>
              <div style={{ width: '0.5px', background: '#f0f0ee' }} />
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a' }}>{stats.enfants}</p>
                <p style={{ fontSize: 10, color: '#888' }}>Enfants & Ados</p>
                <p style={{ fontSize: 9, color: '#aaa' }}>sur 50</p>
              </div>
            </div>

            {/* Statuts paiement — boutons distincts */}
            <div style={{ padding: '10px 14px', display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, background: '#085041', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                <p style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{stats.payes}</p>
                <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.8)' }}>Payés</p>
              </div>
              <div style={{ flex: 1, background: '#C48A00', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                <p style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{stats.enAttente}</p>
                <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.8)' }}>En attente</p>
              </div>
              <div style={{ flex: 1, background: '#185FA5', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                <p style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{stats.partiels}</p>
                <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.8)' }}>Partiel</p>
              </div>
            </div>
          </div>

          {/* Finances */}
          <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #e5e5e0', overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px', borderBottom: '0.5px solid #f0f0ee' }}>
              <p style={{ fontSize: 9, fontWeight: 600, color: '#085041', letterSpacing: '0.05em', marginBottom: 8 }}>FINANCES</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <p style={{ fontSize: 9, color: '#888', marginBottom: 2 }}>Montant collecté</p>
                  <p style={{ fontSize: 15, fontWeight: 600, color: '#085041' }}>{stats.montantCollecte.toLocaleString()}</p>
                  <p style={{ fontSize: 9, color: '#888' }}>FCFA</p>
                </div>
                <div>
                  <p style={{ fontSize: 9, color: '#888', marginBottom: 2 }}>Solde disponible</p>
                  <p style={{ fontSize: 15, fontWeight: 600, color: stats.solde >= 0 ? '#185FA5' : '#A32D2D' }}>{stats.solde.toLocaleString()}</p>
                  <p style={{ fontSize: 9, color: '#888' }}>FCFA</p>
                </div>
              </div>
            </div>

            {/* Budget global */}
            {stats.budgetGlobal > 0 && (
              <div style={{ padding: '10px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: '#444' }}>Budget global</span>
                  <span style={{ fontSize: 11, fontWeight: 500, color: '#1a1a1a' }}>{Math.round(pctBudget)}% — {stats.totalRecettes.toLocaleString()} / {stats.budgetGlobal.toLocaleString()} FCFA</span>
                </div>
                <div style={{ background: '#f0f0ee', borderRadius: 3, height: 5 }}>
                  <div style={{ background: pctBudget >= 100 ? '#085041' : '#854F0B', borderRadius: 3, height: 5, width: `${pctBudget}%`, transition: 'width .4s' }} />
                </div>
                <p style={{ fontSize: 10, color: '#888', marginTop: 4 }}>
                  {pctBudget >= 100 ? '✓ Objectif atteint' : `Reste ${(stats.budgetGlobal - stats.totalRecettes).toLocaleString()} FCFA à collecter`}
                </p>
              </div>
            )}
          </div>

          {/* Dernières inscriptions */}
          <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #e5e5e0', overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px', borderBottom: '0.5px solid #f0f0ee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: 9, fontWeight: 600, color: '#085041', letterSpacing: '0.05em' }}>DERNIÈRES INSCRIPTIONS</p>
              <button onClick={() => navigate('/admin/campeurs')}
                style={{ fontSize: 10, color: '#085041', background: 'none', border: 'none', cursor: 'pointer' }}>Voir tout →</button>
            </div>
            {dernieres.length === 0 && (
              <p style={{ fontSize: 12, color: '#888', textAlign: 'center', padding: '16px' }}>Aucune inscription.</p>
            )}
            {dernieres.map((ins, i) => {
              const sc = statutColor[ins.statut_paiement] || { bg: '#f0f0f0', color: '#666' }
              return (
                <div key={ins.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: i < dernieres.length - 1 ? '0.5px solid #f0f0ee' : 'none' }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#085041' }}>{ins.nom_complet?.charAt(0)}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 500, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ins.nom_complet}</p>
                    <p style={{ fontSize: 10, color: '#888' }}>
                      {ins.tranche_age === 'Jeunes & Adultes' ? 'Jeune/Adulte' : 'Enfant/Ado'} · {new Date(ins.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <span style={{ fontSize: 9, background: sc.bg, color: sc.color, borderRadius: 20, padding: '2px 7px', fontWeight: 500, flexShrink: 0 }}>
                    {ins.statut_paiement}
                  </span>
                </div>
              )
            })}
          </div>

        </div>
      )}
    </AdminLayout>
  )
}
