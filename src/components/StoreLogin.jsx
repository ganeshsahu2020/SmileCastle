// src/pages/StoreLogin.jsx
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Store, DoorOpen } from 'lucide-react'

export default function StoreLogin() {
  const { verifyStorePassword } = useAuth()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const ok = verifyStorePassword(password)
    if (!ok) setError('Invalid store password')
    else setError('')
  }

  return (
    <div className="min-h-screen grid place-items-center bg-[radial-gradient(1200px_600px_at_20%_-10%,rgba(16,185,129,0.25),transparent),radial-gradient(1000px_600px_at_80%_10%,rgba(59,130,246,0.2),transparent)] p-6">
      <div className="w-full max-w-sm rounded-2xl border border-white/20 bg-white/60 p-6 shadow-2xl backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-center gap-2">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 text-white shadow">
            <Store size={18} aria-hidden />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">Smile Castle Store Login</h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="block">
            <span className="sr-only">Store password</span>
            <input
              type="password"
              placeholder="Enter store password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/30 bg-white/70 px-3 py-2 shadow-sm outline-none backdrop-blur-md focus:ring-2 focus:ring-emerald-300"
              required
            />
          </label>

          {error && <p className="text-rose-600 text-sm">{error}</p>}

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white shadow transition-all hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
            aria-label="Enter store"
          >
            <DoorOpen size={16} aria-hidden />
            Enter Store
          </button>
        </form>
      </div>
    </div>
  )
}
