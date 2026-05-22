import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/admin/AdminLayout'

export default function ParametresPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [showChangeMdp, setShowChangeMdp] = useState(false)
  const [mdpForm, setMdpForm] = useState({ nouveau: '', confirmer: '' })
  const [saving, setSaving] = useState(false)
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
  }, [])

  async function handleChangerMdp() {
    setErreur('')
    setSucces('')
    if (!mdpForm.nouveau || !mdpForm.confirmer) { setErreur('Remplissez les deux champs.'); return }
    if (mdpForm.nouveau !== mdpForm.confirmer) { setErreur('Les mots de passe ne correspondent pas.'); return }
    if (mdpForm.nouveau.length < 6) { setErreur('Minimum 6 caractères.'); return }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: mdpForm.nouveau })
    if (error) {
      setErreur(`Erreur : ${error.message}`)
    } else {
      setSucces('Mot de passe mis à jour avec succès.')
      setMdpForm({ nouveau: '', confirmer: '' })
      setShowChangeMdp(false)
    }
    setSaving(false)
  }

  async function handleDeconnexion() {
    if (!window.confirm('Voulez-vous vous déconnecter ?')) return
    await supabase.auth.signOut()
    navigate('/admin/login')
  }

  const inputStyle = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-emerald-400"

  return (
    <AdminLayout>
      <div className="mb-5">
        <h1 className="text-xl font-medium text-gray-800">Paramètres</h1>
        <p className="text-sm text-gray-400 mt-0.5">Gestion du compte et de l'application</p>
      </div>

      {/* Messages */}
      {erreur && (
        <div style={{ background: '#FCEBEB', border: '0.5px solid #F09595', borderRadius: 12, padding: '12px 14px', marginBottom: 14 }}>
          <p style={{ fontSize: 12, color: '#A32D2D' }}>{erreur}</p>
        </div>
      )}
      {succes && (
        <div style={{ background: '#E1F5EE', border: '0.5px solid #9FE1CB', borderRadius: 12, padding: '12px 14px', marginBottom: 14 }}>
          <p style={{ fontSize: 12, color: '#085041' }}>{succes}</p>
        </div>
      )}

      {/* Compte connecté */}
      <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #e5e5e0', overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ padding: '12px 14px', borderBottom: '0.5px solid #f0f0ee' }}>
          <p style={{ fontSize: 9, fontWeight: 600, color: '#085041', letterSpacing: '0.05em', marginBottom: 8 }}>COMPTE CONNECTÉ</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#054035', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>
                {user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a' }}>{user?.email}</p>
              <p style={{ fontSize: 10, color: '#888', marginTop: 2 }}>
                Dernière connexion : {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Changer mot de passe */}
        <div style={{ padding: '12px 14px', borderBottom: '0.5px solid #f0f0ee' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showChangeMdp ? 12 : 0 }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 500, color: '#1a1a1a' }}>Mot de passe</p>
              <p style={{ fontSize: 10, color: '#888' }}>Modifier votre mot de passe</p>
            </div>
            <button onClick={() => { setShowChangeMdp(!showChangeMdp); setErreur(''); setSucces('') }}
              style={{ fontSize: 11, color: '#085041', background: '#E1F5EE', border: 'none', borderRadius: 8, padding: '5px 10px', cursor: 'pointer' }}>
              {showChangeMdp ? 'Annuler' : 'Modifier'}
            </button>
          </div>
          {showChangeMdp && (
            <div>
              <div className="mb-3">
                <label className="block text-xs text-gray-500 mb-1">Nouveau mot de passe</label>
                <input type="password" value={mdpForm.nouveau} onChange={e => setMdpForm(f => ({ ...f, nouveau: e.target.value }))}
                  placeholder="Minimum 6 caractères" className={inputStyle} />
              </div>
              <div className="mb-3">
                <label className="block text-xs text-gray-500 mb-1">Confirmer le mot de passe</label>
                <input type="password" value={mdpForm.confirmer} onChange={e => setMdpForm(f => ({ ...f, confirmer: e.target.value }))}
                  placeholder="Répéter le mot de passe" className={inputStyle} />
              </div>
              <button onClick={handleChangerMdp} disabled={saving}
                className="w-full bg-emerald-700 text-white text-sm font-medium py-3 rounded-xl disabled:opacity-60">
                {saving ? 'Mise à jour...' : 'Mettre à jour'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Gestion des comptes admin */}
      <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #e5e5e0', overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ padding: '12px 14px', borderBottom: '0.5px solid #f0f0ee' }}>
          <p style={{ fontSize: 9, fontWeight: 600, color: '#085041', letterSpacing: '0.05em', marginBottom: 4 }}>COMPTES ADMINISTRATEURS</p>
          <p style={{ fontSize: 11, color: '#888' }}>Créer ou supprimer des comptes admin depuis Supabase</p>
        </div>
        <a href="https://supabase.com/dashboard/project/zkyzcemlndruwgirmfgy/auth/users"
          target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg style={{ width: 18, height: 18, color: '#085041' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 500, color: '#1a1a1a' }}>Gérer les comptes</p>
              <p style={{ fontSize: 10, color: '#888' }}>Ouvrir Supabase Authentication</p>
            </div>
          </div>
          <svg style={{ width: 16, height: 16, color: '#ccc' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>

      {/* Infos app */}
      <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #e5e5e0', padding: '12px 14px', marginBottom: 14 }}>
        <p style={{ fontSize: 9, fontWeight: 600, color: '#085041', letterSpacing: '0.05em', marginBottom: 10 }}>À PROPOS</p>
        {[
          { label: 'Application', val: 'Camp-Navs 2026' },
          { label: 'Dates', val: '23 – 29 août 2026' },
          { label: 'Lieu', val: 'La Sablière, Bingerville' },
          { label: 'Organisation', val: 'Mission Évangélique des Navigateurs CI' },
          { label: 'Version', val: '1.0.0' },
        ].map(({ label, val }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '0.5px solid #f0f0ee' }}>
            <span style={{ fontSize: 11, color: '#888' }}>{label}</span>
            <span style={{ fontSize: 11, color: '#1a1a1a', textAlign: 'right', maxWidth: 200 }}>{val}</span>
          </div>
        ))}
      </div>

      {/* Déconnexion */}
      <button onClick={handleDeconnexion}
        style={{ width: '100%', background: '#FCEBEB', color: '#A32D2D', border: '0.5px solid #F09595', borderRadius: 14, padding: '14px', fontSize: 14, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <svg style={{ width: 18, height: 18 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Se déconnecter
      </button>
    </AdminLayout>
  )
}
