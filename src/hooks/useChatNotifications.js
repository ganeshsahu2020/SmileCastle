// src/hooks/useChatNotifications.js
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

export default function useChatNotifications() {
  const { user } = useAuth()
  const me = user
  const location = useLocation()
  const navigate = useNavigate()

  const [unread, setUnread] = useState(0)
  const [toast, setToast] = useState(null) // { text, kind } | null

  // we don't toast if already on /chat
  const onChatPage = useMemo(() => location.pathname === '/chat', [location.pathname])

  useEffect(() => {
    if (!me?.id) return
    const channel = supabase
      .channel('realtime:chat_notify')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        payload => {
          const m = payload.new
          const isGeneral = m.room_slug === 'general'
          const isForMe = m.receiver_id && m.receiver_id === me.id

          if (!isGeneral && !isForMe) return

          if (!onChatPage) {
            setUnread(n => n + 1)
            setToast({ text: isGeneral ? 'New message in #general' : 'New direct message', kind: isGeneral ? 'room' : 'dm' })
            try {
              const audio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=')
              audio.play().catch(() => {})
            } catch {}
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [me?.id, onChatPage])

  const openChat = () => {
    setToast(null)
    navigate('/chat')
  }
  const clearUnread = () => setUnread(0)

  return { unread, clearUnread, toast, setToast, openChat }
}
