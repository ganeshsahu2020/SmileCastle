// src/components/chat/ChatToast.jsx
import { X, MessageSquare } from 'lucide-react'

export default function ChatToast({ toast, onClose, onOpen }) {
  if (!toast) return null
  return (
    <div className="fixed bottom-4 right-4 z-[60]">
      <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-2xl">
        <div className="mt-[2px] rounded-xl bg-emerald-600 p-2 text-white">
          <MessageSquare size={16} />
        </div>
        <div className="min-w-[180px]">
          <div className="text-sm font-semibold">{toast.text}</div>
          <div className="mt-2 flex gap-2">
            <button
              onClick={onOpen}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:brightness-110"
            >
              Open Chat
            </button>
            <button
              onClick={onClose}
              className="rounded-lg bg-slate-200 px-3 py-1.5 text-sm font-semibold hover:brightness-105"
            >
              Dismiss
            </button>
          </div>
        </div>
        <button onClick={onClose} className="rounded-md p-1 hover:bg-slate-100">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
