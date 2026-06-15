import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/admin/AdminLayout'

const VERT = '#1B3B2B'
const VERT_CLAIR = '#E8F5E8'

function InfoLigne({ label, valeur, last }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: last ? 'none' : '1px solid #F1F5F9' }}>
      <span style={{ fontSize: 13, color: '#64748B' }}>{label}</span>
      <span style={{ fontSize: 13, color: '#1E293B', fontWeight: 500, textAlign: 'right', maxWidth: 200 }}>{valeur}</span>
    </div>
  )
}

export default function ParametresPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [showChangeMdp, setShowChangeMdp] = useState(false)
  const [mdpForm, setMdpForm] = useState({ nouveau: '', confirmer: '' })
  const [saving, setSaving] = useState(false)
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState('')
  const [inscriptionsOuvertes, setInscriptionsOuvertes] = useState(true)
  const [configId, setConfigId] = useState(null)
  const [togglingInscriptions, setTogglingInscriptions] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
    supabase.from('config_camp').select('*').limit(1).then(({ data }) => {
      if (data && data.length > 0) {
        setInscriptionsOuvertes(data[0].inscriptions_ouvertes)
        setConfigId(data[0].id)
      }
    })
  }, [])

  async function toggleInscriptions() {
    setTogglingInscriptions(true)
    const newVal = !inscriptionsOuvertes
    await supabase.from('config_camp').update({ inscriptions_ouvertes: newVal, updated_at: new Date().toISOString() }).eq('id', configId)
    setInscriptionsOuvertes(newVal)
    setTogglingInscriptions(false)
  }

  async function handleChangerMdp() {
    setErreur(''); setSucces('')
    if (!mdpForm.nouveau || !mdpForm.confirmer) { setErreur('Remplissez les deux champs.'); return }
    if (mdpForm.nouveau !== mdpForm.confirmer) { setErreur('Les mots de passe ne correspondent pas.'); return }
    if (mdpForm.nouveau.length < 6) { setErreur('Minimum 6 caractères.'); return }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: mdpForm.nouveau })
    if (error) setErreur(`Erreur : ${error.message}`)
    else { setSucces('Mot de passe mis à jour.'); setMdpForm({ nouveau: '', confirmer: '' }); setShowChangeMdp(false) }
    setSaving(false)
  }

  async function handleDeconnexion() {
    if (!window.confirm('Voulez-vous vous déconnecter ?')) return
    await supabase.auth.signOut()
    navigate('/admin/login')
  }

  const iS = { width: '100%', border: '1px solid #E2E8F0', borderRadius: 10, padding: '9px 12px', fontSize: 13, outline: 'none', background: '#fff', color: '#1E293B' }
  const lS = { fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4, fontWeight: 500 }

  return (
    <AdminLayout>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', background: '#F8FAFC', overflow: 'hidden' }}>

        {/* ── HEADER FIXE ── */}
        <div style={{ flexShrink: 0, padding: '14px 14px 12px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFC', zIndex: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1E293B', margin: 0 }}>Paramètres</h1>
          <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 0' }}>Compte et informations de l'application</p>
        </div>

        {/* ── ZONE SCROLLABLE ── */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '14px 14px 28px' }}>

          {/* Messages */}
          {erreur && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '10px 14px', marginBottom: 12 }}>
              <p style={{ fontSize: 12, color: '#DC2626', margin: 0 }}>{erreur}</p>
            </div>
          )}
          {succes && (
            <div style={{ background: VERT_CLAIR, border: `1px solid ${VERT}`, borderRadius: 10, padding: '10px 14px', marginBottom: 12 }}>
              <p style={{ fontSize: 12, color: VERT, margin: 0 }}>{succes}</p>
            </div>
          )}

          {/* Compte connecté */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', overflow: 'hidden', marginBottom: 12 }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', padding: '10px 14px 0', margin: 0, textTransform: 'uppercase' }}>Compte connecté</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderBottom: '1px solid #F1F5F9' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: VERT, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>{user?.email?.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', margin: 0 }}>{user?.email}</p>
                <p style={{ fontSize: 10, color: '#94A3B8', margin: '2px 0 0' }}>
                  Dernière connexion : {user?.last_sign_in_at
                    ? new Date(user.last_sign_in_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : '-'}
                </p>
              </div>
            </div>

            {/* Mot de passe */}
            <div style={{ padding: '0 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: showChangeMdp ? '1px solid #F1F5F9' : 'none' }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: '#1E293B', margin: 0 }}>Mot de passe</p>
                  <p style={{ fontSize: 11, color: '#94A3B8', margin: '1px 0 0' }}>Modifier votre mot de passe</p>
                </div>
                <button type="button" onClick={() => { setShowChangeMdp(!showChangeMdp); setErreur(''); setSucces('') }}
                  style={{ fontSize: 12, fontWeight: 600, color: showChangeMdp ? '#DC2626' : VERT, background: 'transparent', border: `1px solid ${showChangeMdp ? '#FCA5A5' : VERT}`, borderRadius: 10, padding: '5px 12px', cursor: 'pointer' }}>
                  {showChangeMdp ? 'Annuler' : 'Modifier'}
                </button>
              </div>
              {showChangeMdp && (
                <div style={{ paddingBottom: 12 }}>
                  <div style={{ marginBottom: 8, marginTop: 10 }}>
                    <label style={lS}>Nouveau mot de passe</label>
                    <input type="password" value={mdpForm.nouveau} onChange={e => setMdpForm(f => ({ ...f, nouveau: e.target.value }))} placeholder="Minimum 6 caractères" style={iS} />
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={lS}>Confirmer</label>
                    <input type="password" value={mdpForm.confirmer} onChange={e => setMdpForm(f => ({ ...f, confirmer: e.target.value }))} placeholder="Répéter le mot de passe" style={iS} />
                  </div>
                  <button type="button" onClick={handleChangerMdp} disabled={saving}
                    style={{ width: '100%', background: VERT, color: '#fff', border: 'none', borderRadius: 10, padding: 11, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
                    {saving ? 'Mise à jour...' : 'Mettre à jour'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Comptes administrateurs */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', overflow: 'hidden', marginBottom: 12 }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', padding: '10px 14px 0', margin: 0, textTransform: 'uppercase' }}>Comptes administrateurs</p>
            <a href="https://supabase.com/dashboard/project/zkyzcemlndruwgirmfgy/auth/users"
              target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', textDecoration: 'none' }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#1E293B', margin: 0 }}>Gérer les comptes</p>
                <p style={{ fontSize: 11, color: '#94A3B8', margin: '1px 0 0' }}>Ouvrir Supabase Authentication</p>
              </div>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#94A3B8" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
            </a>
          </div>

          {/* À propos */}
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E2E8F0', padding: '10px 14px', marginBottom: 12 }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', margin: '0 0 4px', textTransform: 'uppercase' }}>À propos</p>
            <InfoLigne label="Application"   valeur="Camp-Navs 2026" />
            <InfoLigne label="Dates"         valeur="23 – 29 août 2026" />
            <InfoLigne label="Lieu"          valeur="La Sablière, Bingerville" />
            <InfoLigne label="Organisation"  valeur="Mission Évangélique des Navigateurs CI" />
            <InfoLigne label="Version"       valeur="1.0.0" last />
          </div>

          {/* Inscriptions ouvertes/fermées */}
          <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${inscriptionsOuvertes ? '#86EFAC' : '#FCA5A5'}`, padding: '14px', marginBottom: 12 }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 10px' }}>Inscriptions</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: inscriptionsOuvertes ? '#065F46' : '#DC2626', margin: '0 0 3px' }}>
                  {inscriptionsOuvertes ? '🟢 Inscriptions ouvertes' : '🔴 Inscriptions fermées'}
                </p>
                <p style={{ fontSize: 11, color: '#64748B', margin: 0 }}>
                  {inscriptionsOuvertes ? 'Les campeurs peuvent s’inscrire sur le portail.' : 'Le formulaire d’inscription est désactivé.'}
                </p>
              </div>
              <button type="button" onClick={toggleInscriptions} disabled={togglingInscriptions || !configId}
                style={{ flexShrink: 0, marginLeft: 12, background: inscriptionsOuvertes ? '#FEF2F2' : '#ECFDF5', color: inscriptionsOuvertes ? '#DC2626' : '#065F46', border: `1px solid ${inscriptionsOuvertes ? '#FCA5A5' : '#6EE7B7'}`, borderRadius: 10, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: togglingInscriptions || !configId ? 'not-allowed' : 'pointer', opacity: togglingInscriptions ? 0.7 : 1, whiteSpace: 'nowrap' }}>
                {togglingInscriptions ? '...' : inscriptionsOuvertes ? 'Fermer' : 'Ouvrir'}
              </button>
            </div>
          </div>

          {/* Déconnexion */}
          <button type="button" onClick={handleDeconnexion}
            style={{ width: '100%', background: '#FEF2F2', color: '#EF4444', border: '1px solid #FCA5A5', borderRadius: 12, padding: 13, fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            Se déconnecter
          </button>

        </div>
      </div>
    </AdminLayout>
  )
}
