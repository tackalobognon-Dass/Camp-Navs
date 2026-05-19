import { useEffect, useState, useRef } from 'react'
import { supabase } from '../../lib/supabase'

const EMOJIS = ['❤️', '😂', '🙌', '🔥', '🙏', '😍']

export default function CommentairesPage() {
  const [messages, setMessages] = useState([])
  const [reactions, setReactions] = useState([])
  const [prenom, setPrenom] = useState(() => localStorage.getItem('camp_prenom') || '')
  const [texte, setTexte] = useState('')
  const [replyTo, setReplyTo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    fetchData()
    const channel = supabase
      .channel('commentaires')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'commentaires' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reactions' }, fetchReactions)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchData() {
    const { data } = await supabase
      .from('commentaires')
      .select('*')
      .order('created_at', { ascending: true })
    setMessages(data || [])
    setLoading(false)
    await fetchReactions()
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  async function fetchReactions() {
    const { data } = await supabase.from('reactions').select('*')
    setReactions(data || [])
  }

  function savePrenom(val) {
    setPrenom(val)
    localStorage.setItem('camp_prenom', val)
  }

  async function handleSend() {
    if (!texte.trim() || !prenom.trim()) return
    setSending(true)
    await supabase.from('commentaires').insert([{
      prenom: prenom.trim(),
      message: texte.trim(),
      reply_to: replyTo?.id || null,
      reply_preview: replyTo ? `${replyTo.prenom} : ${replyTo.message.slice(0, 50)}...` : null,
    }])
    setTexte('')
    setReplyTo(null)
    setSending(false)
  }

  async function handleReaction(commentaireId, emoji) {
    if (!prenom.trim()) return
    const exists = reactions.find(r => r.commentaire_id === commentaireId && r.emoji === emoji && r.prenom === prenom)
    if (exists) {
      await supabase.from('reactions').delete().eq('id', exists.id)
    } else {
      await supabase.from('reactions').insert([{ commentaire_id: commentaireId, emoji, prenom }])
    }
    fetchReactions()
  }

  function getReactions(commentaireId) {
    const grouped = {}
    reactions.filter(r => r.commentaire_id === commentaireId).forEach(r => {
      grouped[r.emoji] = (grouped[r.emoji] || 0) + 1
    })
    return grouped
  }

  function formatTime(dateStr) {
    return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  const isMe = (msg) => msg.prenom === prenom && prenom.trim()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto">

      {/* Header */}
      <div className="bg-emerald-700 text-white px-4 pt-10 pb-3 flex items-center gap-3 sticky top-0 z-10">
        <a href="/" className="text-emerald-200">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
        </a>
        <div className="w-9 h-9 bg-white bg-opacity-15 rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium">Discussion Camp-Navs 2026</p>
          <p className="text-xs text-emerald-200">{messages.length} message(s)</p>
        </div>
      </div>

      {/* Champ prénom */}
      <div className="bg-white px-4 py-2 border-b border-gray-100 flex items-center gap-2 sticky top-16 z-10">
        <svg className="w-4 h-4 text-emerald-700 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <input
          type="text"
          value={prenom}
          onChange={e => savePrenom(e.target.value)}
          placeholder="Votre prénom pour participer..."
          className="flex-1 text-sm outline-none bg-transparent text-gray-800"
        />
      </div>

      {/* Messages */}
      <div className="flex-1 px-4 py-4 overflow-y-auto pb-36 space-y-4">
        {loading && <p className="text-center text-sm text-gray-400 py-8">Chargement...</p>}
        {!loading && messages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-gray-400">Aucun message pour le moment.</p>
            <p className="text-xs text-gray-300 mt-1">Soyez le premier à écrire !</p>
          </div>
        )}

        {messages.map((msg) => {
          const mine = isMe(msg)
          const msgReactions = getReactions(msg.id)
          const initials = msg.prenom.slice(0, 2).toUpperCase()
          return (
            <div key={msg.id} className={`flex gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 self-start mt-1 ${mine ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-700'}`}>
                {initials}
              </div>

              {/* Contenu */}
              <div className={`max-w-xs flex flex-col ${mine ? 'items-end' : ''}`}>
                <p className={`text-xs font-medium mb-1 ${mine ? 'text-gray-400' : 'text-emerald-700'}`}>
                  {mine ? 'Moi' : msg.prenom}
                </p>

                {/* Réponse citée */}
                {msg.reply_preview && (
                  <div className="bg-gray-50 border-l-2 border-emerald-500 rounded-md px-2 py-1 mb-1 text-xs text-gray-500 leading-relaxed">
                    {msg.reply_preview}
                  </div>
                )}

                {/* Bulle */}
                <div className={`px-3 py-2 rounded-2xl text-sm leading-relaxed shadow-sm ${mine ? 'bg-emerald-700 text-white' : 'bg-white text-gray-800'}`}>
                  {msg.message}
                </div>

                {/* Réactions + heure + répondre */}
                <div className={`flex items-center gap-2 mt-1 flex-wrap ${mine ? 'flex-row-reverse' : ''}`}>
                  {Object.entries(msgReactions).map(([emoji, count]) => (
                    <button
                      key={emoji}
                      onClick={() => handleReaction(msg.id, emoji)}
                      className="bg-white rounded-full px-2 py-0.5 text-xs flex items-center gap-1 shadow-sm"
                    >
                      {emoji}<span className="text-gray-400">{count}</span>
                    </button>
                  ))}
                  <span className="text-xs text-gray-300">{formatTime(msg.created_at)}</span>
                  {!mine && (
                    <button
                      onClick={() => setReplyTo(msg)}
                      className="text-xs text-emerald-700"
                    >
                      Répondre
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Zone de saisie */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-100 px-4 py-3">
        {replyTo && (
          <div className="bg-gray-50 border-l-2 border-emerald-500 rounded-md px-3 py-1.5 mb-2 flex items-center justify-between">
            <span className="text-xs text-emerald-700 truncate">Répondre à {replyTo.prenom}</span>
            <button onClick={() => setReplyTo(null)}>
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Emojis rapides */}
        <div className="flex gap-3 mb-2">
          {EMOJIS.map(emoji => (
            <button
              key={emoji}
              onClick={() => messages.length > 0 && handleReaction(messages[messages.length - 1].id, emoji)}
              className="text-lg"
            >
              {emoji}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={texte}
            onChange={e => setTexte(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder={prenom ? 'Écrire un message...' : 'Entrez votre prénom d\'abord'}
            disabled={!prenom.trim()}
            className="flex-1 bg-gray-50 rounded-full px-4 py-2 text-sm outline-none text-gray-800 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={sending || !texte.trim() || !prenom.trim()}
            className="w-9 h-9 bg-emerald-700 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-50"
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
