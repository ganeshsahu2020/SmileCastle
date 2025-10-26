import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'

export default function ChatBell({ unread = 0, onClick }) {
  const navigate = useNavigate()
  const go = () => {
    onClick?.()
    navigate('/chat')
  }

  return (
    <button
      onClick={go}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 ring-1 ring-slate-200 shadow hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
      aria-label={unread > 0 ? `Open chat, ${unread} unread` : 'Open chat'}
    >
      <Bell size={18} className="text-slate-700" aria-hidden />
      {unread > 0 && (
        <span
          className="absolute -top-1 -right-1 inline-flex h-5 min-w-[20px] items-center justify-center
                     rounded-full bg-rose-600 px-1 text-xs font-bold text-white shadow"
        >
          {unread}
        </span>
      )}
      {/* subtle ping when unread */}
      {unread > 0 && (
        <span className="absolute -top-1 -right-1 inline-flex h-5 w-5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-60" />
        </span>
      )}
    </button>
  )
}
