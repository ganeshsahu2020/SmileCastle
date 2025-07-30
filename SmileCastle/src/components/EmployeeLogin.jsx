import { useState } from 'react'
import { supabase } from '../utils/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

export default function EmployeeLogin() {
  const { loginUser } = useAuth()
  const [employeeId, setEmployeeId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotReason, setForgotReason] = useState('')
  const [requestSuccess, setRequestSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    const { data, error: supabaseError } = await supabase
      .from('users')
      .select('*')
      .eq('employee_id', employeeId.trim())
      .single()

    if (supabaseError || !data) {
      setError('Invalid Employee ID')
      return
    }

    if (data.password_hash === password) {
      loginUser(data)
      setError('')
    } else {
      setError('Invalid password')
    }
  }

  const handleForgotPassword = async () => {
    if (!employeeId) {
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

    const { error: insertError } = await supabase.from('password_requests').insert([
      {
        employee_id: employeeId.trim(),
        email: userData.email || '',
        reason: forgotReason,
        status: 'Pending'
      }
    ])

    if (insertError) {
      setError('Error submitting request')
    } else {
      setRequestSuccess(true)
    }

    setLoading(false)
    setForgotReason('')
    setShowForgotModal(false)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-6 rounded-lg shadow-md w-80">
        <h2 className="text-xl font-bold mb-4 text-center">Employee Login</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Employee ID"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="border p-2 rounded"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border p-2 rounded"
            required
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {requestSuccess && (
            <p className="text-green-600 text-sm">Password reset request sent</p>
          )}
          <button
            type="submit"
            className="bg-green-600 text-white py-2 rounded hover:bg-green-700"
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setShowForgotModal(true)}
            className="text-blue-600 text-sm underline mt-2"
          >
            Forgot Password?
          </button>
        </form>
      </div>

      {showForgotModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-bold mb-2">Password Reset Request</h3>
            <p className="text-sm text-gray-600 mb-4">
              Submit a reason for requesting a password reset.
            </p>
            <textarea
              placeholder="Reason"
              value={forgotReason}
              onChange={(e) => setForgotReason(e.target.value)}
              className="border p-2 w-full rounded mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowForgotModal(false)}
                className="px-3 py-1 rounded bg-gray-300 hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleForgotPassword}
                disabled={loading}
                className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700"
              >
                {loading ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
