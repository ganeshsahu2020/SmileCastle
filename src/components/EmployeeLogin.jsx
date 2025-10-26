// src/pages/EmployeeLogin.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../utils/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { Lock, LogIn } from 'lucide-react'

export default function EmployeeLogin() {
  const { loginUser } = useAuth()

  // Controlled fields
  const [employeeId, setEmployeeId] = useState('')
  const [password, setPassword] = useState('')

  // Autofill hardening
  const [empReadonly, setEmpReadonly] = useState(true)
  const [pwdReadonly, setPwdReadonly] = useState(true)

  const [error, setError] = useState('')
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotReason, setForgotReason] = useState('')
  const [requestSuccess, setRequestSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  // 🔒 On mount: clear any app-side persistence + fields
  useEffect(() => {
    try {
      sessionStorage.clear()
      // If your app ever put creds in LS, clear them too:
      localStorage.removeItem('user')
      localStorage.removeItem('employeeId')
    } catch {}
    setEmployeeId('')
    setPassword('')
    setError('')
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const id = employeeId.trim()
    if (!id || !password) {
      setError('Enter Employee ID and Password')
      return
    }

    const { data, error: supabaseError } = await supabase
      .from('users')
      .select('*')
      .eq('employee_id', id)
      .single()

    if (supabaseError || !data) {
      setError('Invalid Employee ID')
      setPassword('') // clear password
      return
    }

    if (data.password_hash === password) {
      // ✅ No “remember me” — do not store credentials anywhere
      loginUser(data)
    } else {
      setError('Invalid password')
      setPassword('') // clear password
    }
  }

  const handleForgotPassword = async () => {
    if (!employeeId.trim()) {
      setError('Enter your Employee ID before requesting reset')
      return
    }
    setLoading(true)
    setError('')

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('employee_id', employeeId.trim())
      .single()

    if (userError || !userData) {
      setError('Employee ID not found')
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase.from('password_requests').insert([{
      employee_id: employeeId.trim(),
      email: userData.email || '',
      reason: forgotReason.trim(),
      status: 'Pending',
    }])

    if (insertError) setError('Error submitting request')
    else setRequestSuccess(true)

    setLoading(false)
    setForgotReason('')
    setShowForgotModal(false)
  }

  return (
    <div className="min-h-screen grid place-items-center bg-[radial-gradient(1200px_600px_at_20%_-10%,rgba(16,185,129,0.25),transparent),radial-gradient(1000px_600px_at_80%_10%,rgba(59,130,246,0.2),transparent)] p-6">
      <div className="w-full max-w-sm rounded-2xl border border-white/20 bg-white/60 p-6 shadow-2xl backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-center gap-2">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 text-white shadow">
            <Lock size={18} aria-hidden />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">Employee Login</h2>
        </div>

        {/* form autocomplete OFF to avoid browser reuse */}
        <form
          onSubmit={handleSubmit}
          autoComplete="off"
          className="flex flex-col gap-3"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
        >
          {/* Honeypots to soak up password-managers (hidden from users) */}
          <input type="text" name="username" autoComplete="username" tabIndex={-1} style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none' }} />
          <input type="password" name="password" autoComplete="current-password" tabIndex={-1} style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none' }} />

          <label className="block">
            <span className="sr-only">Employee ID</span>
            <input
              type="text"
              inputMode="text"
              placeholder="Employee ID"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              onFocus={() => setEmpReadonly(false)}
              readOnly={empReadonly}
              name="sc-employee-id"           // non-standard name to avoid autofill
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              className="w-full rounded-xl border border-white/30 bg-white/70 px-3 py-2 shadow-sm outline-none backdrop-blur-md focus:ring-2 focus:ring-emerald-300"
              required
            />
          </label>

          <label className="block">
            <span className="sr-only">Password</span>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setPwdReadonly(false)}
              readOnly={pwdReadonly}
              name="sc-password"              // non-standard name to avoid autofill
              autoComplete="new-password"     // tells browsers not to fill stored passwords
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              className="w-full rounded-xl border border-white/30 bg-white/70 px-3 py-2 shadow-sm outline-none backdrop-blur-md focus:ring-2 focus:ring-emerald-300"
              required
            />
          </label>

          {error && <p className="text-rose-600 text-sm">{error}</p>}
          {requestSuccess && <p className="text-emerald-600 text-sm">Password reset request sent</p>}

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white shadow transition-all hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            aria-label="Log in"
          >
            <LogIn size={16} aria-hidden />
            Login
          </button>

          <button
            type="button"
            onClick={() => setShowForgotModal(true)}
            className="text-blue-700 text-sm underline decoration-blue-300 underline-offset-2 hover:decoration-blue-500"
          >
            Forgot Password?
          </button>
        </form>
      </div>

      {/* Forgot password modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/80 p-6 shadow-2xl backdrop-blur-xl">
            <h3 className="mb-1 text-lg font-extrabold">Password Reset Request</h3>
            <p className="mb-3 text-sm text-gray-700">Submit a reason for requesting a password reset.</p>
            <textarea
              placeholder="Reason"
              value={forgotReason}
              onChange={(e) => setForgotReason(e.target.value)}
              className="mb-4 w-full rounded-xl border border-white/30 bg-white/70 px-3 py-2 shadow-sm outline-none backdrop-blur-md focus:ring-2 focus:ring-indigo-300"
              rows={3}
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowForgotModal(false)}
                className="rounded-xl bg-white/70 px-3 py-2 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleForgotPassword}
                disabled={loading}
                className="rounded-xl bg-indigo-600 px-3 py-2 font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
              >
                {loading ? 'Submitting…' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
