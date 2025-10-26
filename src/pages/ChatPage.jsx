// src/pages/ChatPage.jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import AppHeader from '../components/AppHeader'
import {
  Send, Hash, Users, MessageSquareMore, Loader2, Menu, X, ArrowLeft
} from 'lucide-react'

export default function ChatPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const me = user

  // nav helpers
  const goBack = () => navigate(-1)
  const closeChat = () => {
    if (me?.role === 'Admin') navigate('/admin/employees')
    else navigate('/')
  }

  // people list
  const [roster, setRoster] = useState([])
  const [loadingRoster, setLoadingRoster] = useState(true)

  const [mobileOpen, setMobileOpen] = useState(false)

  // conversation selection
  const [mode, setMode] = useState('general') // 'general' | 'dm'
  const [peer, setPeer] = useState(null)

  // messages + composer
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const listRef = useRef(null)

  // header title
  const headerTitle = useMemo(() => {
    if (mode === 'general') return 'Chat — #general'
    return peer ? `Chat — ${peer.name || 'Direct'}` : 'Chat — Direct'
  }, [mode, peer])

  // load roster
  useEffect(() => {
    let isMounted = true
    ;(async () => {
      setLoadingRoster(true)
      const { data, error } = await supabase
        .from('users')
        .select('id,name,email,employee_id')
        .neq('id', me.id)
        .order('name', { ascending: true })
      if (!isMounted) return
      if (error) {
        console.error('roster error', error)
        setRoster([])
      } else {
        setRoster(data || [])
      }
      setLoadingRoster(false)
    })()
    return () => { isMounted = false }
  }, [me.id])

  // load messages for current conversation
  useEffect(() => {
    let abort = false
    const load = async () => {
      let query = supabase.from('chat_messages').select('*').order('created_at', { ascending: true }).limit(500)

      if (mode === 'general') {
        query = query.eq('room_slug', 'general')
      } else if (peer) {
        query = query.or(
          `and(sender_id.eq.${me.id},receiver_id.eq.${peer.id}),and(sender_id.eq.${peer.id},receiver_id.eq.${me.id})`
        )
      } else {
        setMessages([])
        return
      }

      const { data, error } = await query
      if (abort) return
      if (error) {
        console.error('load messages error', error)
        setMessages([])
      } else {
        setMessages(data || [])
        scrollToBottom()
      }
    }
    load()
    return () => { abort = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, peer?.id])

  // realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('realtime:chat_messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        payload => {
          const msg = payload.new
          if (mode === 'general' && msg.room_slug === 'general') {
            setMessages(m => [...m, msg]); scrollToBottom()
          } else if (
            mode === 'dm' &&
            peer &&
            (
              (msg.sender_id === me.id && msg.receiver_id === peer.id) ||
              (msg.sender_id === peer.id && msg.receiver_id === me.id)
            )
          ) {
            setMessages(m => [...m, msg]); scrollToBottom()
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [mode, peer, me.id])

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
    })
  }

  // send
  const send = async () => {
    const content = text.trim()
    if (!content) return
    setSending(true)
    try {
      const payload =
        mode === 'general'
          ? { sender_id: me.id, content, room_slug: 'general', receiver_id: null }
          : { sender_id: me.id, receiver_id: peer.id, content, room_slug: null }

      const { error } = await supabase.from('chat_messages').insert([payload])
      if (error) throw error
      setText('')
    } catch (e) {
      console.error('send error', e)
    } finally {
      setSending(false)
    }
  }

  const onEnter = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const fmt = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_10%_-10%,rgba(16,185,129,0.12),transparent),radial-gradient(1000px_600px_at_90%_10%,rgba(59,130,246,0.12),transparent)]">
      {/* Top header consistent with Admin/Employee pages */}
      <AppHeader title={headerTitle} brand="Smile Castle" visibility="all" onMenu={() => setMobileOpen(true)} />

      {/* Layout: sidebar + chat */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 lg:grid-cols-[280px_1fr]">
        {/* Sidebar (desktop) */}
        <aside className="hidden border-r border-slate-200 bg-white/95 lg:block">
          <div className="sticky top-0 h-[calc(100vh-56px)] px-4 py-4">
            <SectionTitle icon={<Hash size={16} />} title="Rooms" />
            <button
              className={`mb-2 w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition
                         ${mode === 'general' ? 'bg-emerald-100 text-emerald-900' : 'hover:bg-slate-100'}`}
              onClick={() => { setMode('general'); setPeer(null) }}
            >
              #general
            </button>

            <SectionTitle icon={<Users size={16} />} title="Direct messages" />
            <div className="space-y-1 overflow-y-auto pr-1" style={{ maxHeight: '64vh' }}>
              {loadingRoster && (
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Loader2 className="animate-spin" size={14} /> loading…
                </div>
              )}
              {!loadingRoster && roster.length === 0 && (
                <div className="text-slate-500 text-sm">No other users yet.</div>
              )}
              {roster.map(u => (
                <button
                  key={u.id}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition
                             ${mode === 'dm' && peer?.id === u.id ? 'bg-cyan-100 text-cyan-900' : 'hover:bg-slate-100'}`}
                  onClick={() => { setMode('dm'); setPeer(u) }}
                >
                  <span className="truncate">{u.name || u.email || u.employee_id}</span>
                  <MessageSquareMore size={14} className="opacity-60" />
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Mobile drawer for roster */}
        {mobileOpen && (
          <MobileDrawer onClose={() => setMobileOpen(false)}>
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="font-bold">Conversations</div>
              <button
                className="rounded-lg p-2 hover:bg-slate-100"
                onClick={() => setMobileOpen(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3">
              <div className="mb-2 text-xs font-semibold uppercase text-slate-500">Rooms</div>
              <button
                className={`mb-3 w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition
                           ${mode === 'general' ? 'bg-emerald-100 text-emerald-900' : 'hover:bg-slate-100'}`}
                onClick={() => { setMode('general'); setPeer(null); setMobileOpen(false) }}
              >
                #general
              </button>

              <div className="mb-2 text-xs font-semibold uppercase text-slate-500">Direct messages</div>
              <div className="space-y-1">
                {roster.map(u => (
                  <button
                    key={u.id}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition
                               ${mode === 'dm' && peer?.id === u.id ? 'bg-cyan-100 text-cyan-900' : 'hover:bg-slate-100'}`}
                    onClick={() => { setMode('dm'); setPeer(u); setMobileOpen(false) }}
                  >
                    <span className="truncate">{u.name || u.email || u.employee_id}</span>
                    <MessageSquareMore size={14} className="opacity-60" />
                  </button>
                ))}
              </div>
            </div>
          </MobileDrawer>
        )}

        {/* Chat pane */}
        <main className="min-h-[calc(100vh-56px)] bg-white/70">
          {/* Conversation header with Back / Cancel */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 lg:px-6">
            <div className="flex items-center gap-2">
              <button className="rounded-lg p-2 hover:bg-slate-100 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open conversations">
                <Menu size={18} />
              </button>
              <div className="text-sm font-semibold">
                {mode === 'general' ? '#general' : (peer?.name || 'Direct message')}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={goBack}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                aria-label="Back"
              >
                <ArrowLeft size={14} /> Back
              </button>
              <button
                onClick={closeChat}
                className="inline-flex items-center gap-1 rounded-xl bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white hover:brightness-110"
                aria-label="Close chat"
              >
                <X size={14} /> Close
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={listRef} className="h-[calc(100vh-56px-52px-60px)] overflow-y-auto px-4 py-3 lg:px-6">
            {messages.length === 0 ? (
              <div className="mt-10 text-center text-sm text-slate-500">No messages yet. Say hello 👋</div>
            ) : (
              <ul className="space-y-2">
                {messages.map(m => {
                  const mine = m.sender_id === me.id
                  return (
                    <li key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow
                                   ${mine ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200'}`}
                      >
                        <div className="whitespace-pre-wrap">{m.content}</div>
                        <div className={`mt-1 text-[10px] ${mine ? 'text-white/80' : 'text-slate-500'}`}>
                          {fmt(m.created_at)}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Composer */}
          <div className="sticky bottom-0 border-t border-slate-200 bg-white/90 px-4 py-3 lg:px-6">
            <div className="flex items-end gap-2">
              <textarea
                rows={1}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={onEnter}
                placeholder={mode === 'general' ? 'Message #general' : `Message ${peer?.name || 'user'}`}
                className="min-h-[44px] max-h-40 flex-1 resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm outline-none focus:ring-2 focus:ring-emerald-300"
              />
              <button
                onClick={send}
                disabled={sending || !text.trim() || (mode === 'dm' && !peer)}
                className="inline-flex h-[44px] items-center gap-2 rounded-xl bg-emerald-600 px-4 text-white shadow transition hover:brightness-110 disabled:opacity-60"
              >
                <Send size={16} />
                Send
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

/* ——— small bits ——— */

function SectionTitle({ icon, title }) {
  return (
    <div className="mb-2 mt-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
      {icon} <span>{title}</span>
    </div>
  )
}

function MobileDrawer({ children, onClose }) {
  const [entered, setEntered] = useState(false)
  useEffect(() => {
    const rAF = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(rAF)
  }, [])
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className={`fixed inset-0 z-50 grid grid-cols-[minmax(0,1fr)] lg:hidden transition-colors duration-300
                 ${entered ? 'bg-black/40' : 'bg-black/0'}`}
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`h-full w-[88%] max-w-xs bg-white shadow-2xl transition-transform duration-300 ease-out
                   ${entered ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {children}
      </div>
      <div />
    </div>
  )
}
