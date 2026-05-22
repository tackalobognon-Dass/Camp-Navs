import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import AdminLayout from '../../components/admin/AdminLayout'

export default function ParametresPage() {
  const navigate = useNavigate()
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' })
  const [saving, setSaving] = useState(false)
  const [erreur, setErreur] = useState('')
  const [succes, setSucces] = useState('')
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
      // Récupérer la liste des utilisateurs via Supabase Admin API
      const { data, error } = await supabase.auth.admin.listUsers()
      if (!error && data) {
        setAdmins(data.users || [])
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  async function handleCreerCompte() {
    setErreur('')
    setSucces('')
    if (!form.email || !form.password) { setErreur('Email et mot de passe requis.'); return }
    if (form.password !== form.confirmPassword) { setErreur('Les mots de passe ne correspondent pas.'); return }
    if (form.password.length < 6) { setErreur('Le mot de passe doit contenir au moins 6 caractères.'); return }
    setSaving(true)
    const { error } = await supabase.auth.admin.createUser({
      email: form.email,
      password: form.password,
      email_confirm: true,
    })
    if (error) {
      setErreur(`Erreur : ${error.message}`)
    } else {
      setSucces(`Compte créé pour ${form.email}`)
      setForm({ email: '', password: '', confirmPassword: '' })
      setShowForm(false)
      // Rafraîchir la liste
      const { data } = await supabase.auth.admin.listUsers()
      if (data) setAdmins(data.users || [])
    }
    setSaving(false)
  }

  async function handleSupprimerCompte(userId, email) {
    if (userId === currentUser?.id) { setErreur('Vous ne pouvez pas supprimer votre propre compte.'); return }
    if (!window.confirm(`Supprimer le compte ${email} ?`)) return
    setSaving(true)
    const { error } = await supabase.auth.admin.deleteUser(userId)
    if (error) {
      setErreur(`Erreur : ${error.message}`)
    } else {
      setSucces(`Compte ${email} supprimé.`)
      const { data } = await supabase.auth.admin.listUsers()
      if (data) setAdmins(data.users || [])
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
        <p className="text-sm text-gray-400 mt-0.5">Gestion des comptes et de l'application</p>
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

      {/* Comptes admin */}
      <div style={{ background: '#fff', borderRadius: 14, border: '0.5px solid #e5e5e0', overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ padding: '12px 14px', borderBottom: '0.5px solid #f0f0ee', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 10, fontWeight: 600, color: '#085041', letterSpacing: '0.05em' }}>COMPTES ADMINISTRATEURS</p>
            <p style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{admins.length} compte(s)</p>
          </div>
          <button onClick={() => { setShowForm(!showForm); setErreur(''); setSucces('') }}
            style={{ background: '#085041', color: '#fff', border: 'none', borderRadius: 10, padding: '7px 12px', fontSize: 11, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg style={{ width: 13, height: 13 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showForm ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"} />
            </svg>
            {showForm ? 'Fermer' : 'Nouveau'}
          </button>
        </div>

        {/* Formulaire nouveau compte */}
        {showForm && (
          <div style={{ padding: '14px', borderBottom: '0.5px solid #f0f0ee', background: '#f8f8f6' }}>
            <p style={{ fontSize: 12, fontWeight: 500, color: '#1a1a1a', marginBottom: 12 }}>Créer un nouveau compte</p>
            <div className="mb-3">
              <label className="block text-xs text-gray-500 mb-1">Email *</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="email@exemple.com" className={inputStyle} />
            </div>
            <div className="mb-3">
              <label className="block text-xs text-gray-500 mb-1">Mot de passe *</label>
              <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Minimum 6 caractères" className={inputStyle} />
            </div>
            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1">Confirmer le mot de passe *</label>
              <input type="password" value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                placeholder="Répéter le mot de passe" className={inputStyle} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowForm(false); setForm({ email: '', password: '', confirmPassword: '' }) }}
                className="flex-1 bg-gray-100 text-gray-600 text-sm font-medium py-3 rounded-xl">Annuler</button>
              <button onClick={handleCreerCompte} disabled={saving}
                className="flex-1 bg-emerald-700 text-white text-sm font-medium py-3 rounded-xl disabled:opacity-60">
                {saving ? 'Création...' : 'Créer le compte'}
              </button>
            </div>
          </div>
        )}

        {/* Liste des comptes */}
        {loading && <p style={{ fontSize: 12, color: '#888', textAlign: 'center', padding: '16px' }}>Chargement...</p>}
        {admins.map((admin, i) => (
          <div key={admin.id} style={{ padding: '12px 14px', borderBottom: i < admins.length - 1 ? '0.5px solid #f0f0ee' : 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: admin.id === currentUser?.id ? '#054035' : '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: admin.id === currentUser?.id ? '#fff' : '#085041' }}>
                {admin.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{admin.email}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {admin.id === currentUser?.id && (
                  <span style={{ fontSize: 9, background: '#054035', color: '#fff', borderRadius: 20, padding: '1px 7px' }}>Vous</span>
                )}
                <span style={{ fontSize: 10, color: '#888' }}>
                  {admin.last_sign_in_at ? `Dernière connexion : ${new Date(admin.last_sign_in_at).toLocaleDateString('fr-FR')}` : 'Jamais connecté'}
                </span>
              </div>
            </div>
            {admin.id !== currentUser?.id && (
              <button onClick={() => handleSupprimerCompte(admin.id, admin.email)}
                style={{ width: 30, height: 30, borderRadius: 8, background: '#FCEBEB', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg style={{ width: 13, height: 13, color: '#A32D2D' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
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
