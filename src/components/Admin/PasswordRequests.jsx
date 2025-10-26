// src/pages/admin/PasswordRequests.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../../utils/supabaseClient'
import { useAuth } from '../../contexts/AuthContext'
import { CheckCircle2, XCircle, KeyRound } from 'lucide-react'

export default function PasswordRequests() {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [tempPassword, setTempPassword] = useState('')
  const [modalType, setModalType] = useState(null) // 'approve' | 'reject'

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('password_requests')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) setError('Failed to load requests')
    else setRequests(data || [])
    setLoading(false)
  }

  const handleApprove = async () => {
    if (!selectedRequest || !tempPassword) return
    const { error: userError } = await supabase
      .from('users')
      .update({ password_hash: tempPassword, password_last_changed: new Date() })
      .eq('employee_id', selectedRequest.employee_id)

    if (userError) return setError('Failed to update user password')

    const { error: updateError } = await supabase
      .from('password_requests')
      .update({
        status: 'Approved',
        temp_password: tempPassword,
        approved_by: user?.email || 'Admin',
        approved_at: new Date()
      })
      .eq('id', selectedRequest.id)

    if (updateError) setError('Failed to update request status')
    else {
      setSelectedRequest(null)
      setTempPassword('')
      setModalType(null)
      fetchRequests()
    }
  }

  const handleReject = async () => {
    if (!selectedRequest) return
    const { error: rejectError } = await supabase
      .from('password_requests')
      .update({
        status: 'Rejected',
        approved_by: user?.email || 'Admin',
        approved_at: new Date()
      })
      .eq('id', selectedRequest.id)

    if (rejectError) setError('Failed to reject request')
    else {
      setSelectedRequest(null)
      setModalType(null)
      fetchRequests()
    }
  }

  const card =
    'rounded-2xl border border-white/20 bg-white/60 dark:bg-white/10 ' +
    'backdrop-blur-xl shadow-xl transition-all'

  const btn =
    'inline-flex items-center gap-2 rounded-xl px-3 py-2 font-semibold transition-all ' +
    'focus-visible:outline-none focus-visible:ring-2'

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white">
        Password Reset Requests
      </h2>

      <div className={`${card} p-5`}>
        {loading ? (
          <p className="text-sm text-gray-600">Loading password requests…</p>
        ) : error ? (
          <p className="text-sm text-rose-600">{error}</p>
        ) : (
          <div className="overflow-x-auto rounded-xl">
            <table className="min-w-full text-sm">
              <thead className="bg-white/60 backdrop-blur-md text-left">
                <tr>
                  <th className="p-2">Employee ID</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Reason</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Requested At</th>
                  <th className="p-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/20">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-white/40">
                    <td className="p-2">{req.employee_id}</td>
                    <td className="p-2">{req.email}</td>
                    <td className="p-2">{req.reason}</td>
                    <td className="p-2">{req.status}</td>
                    <td className="p-2">{new Date(req.created_at).toLocaleString()}</td>
                    <td className="p-2">
                      {req.status === 'Pending' && (
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => { setSelectedRequest(req); setModalType('approve') }}
                            className={`${btn} bg-emerald-600 text-white focus-visible:ring-emerald-300`}
                            aria-label={`Approve request for ${req.employee_id}`}
                          >
                            <CheckCircle2 size={16} aria-hidden />
                            Approve
                          </button>
                          <button
                            onClick={() => { setSelectedRequest(req); setModalType('reject') }}
                            className={`${btn} bg-rose-600 text-white focus-visible:ring-rose-300`}
                            aria-label={`Reject request for ${req.employee_id}`}
                          >
                            <XCircle size={16} aria-hidden />
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Approve Modal */}
      {modalType === 'approve' && selectedRequest && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/80 p-6 shadow-2xl backdrop-blur-xl">
            <h3 className="mb-2 text-lg font-extrabold">Approve Request</h3>
            <p className="mb-4 text-sm text-gray-700">
              Enter a temporary password for <b>{selectedRequest.employee_id}</b>.
            </p>
            <label className="block">
              <span className="sr-only">Temporary Password</span>
              <input
                type="text"
                placeholder="Temporary Password"
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                className="mb-4 w-full rounded-xl border border-white/30 bg-white/70 px-3 py-2 shadow-sm outline-none backdrop-blur-md focus:ring-2 focus:ring-emerald-300"
              />
            </label>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => { setModalType(null); setSelectedRequest(null) }}
                className={`${btn} bg-white/70`}
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                className={`${btn} bg-emerald-600 text-white focus-visible:ring-emerald-300`}
              >
                <KeyRound size={16} aria-hidden />
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {modalType === 'reject' && selectedRequest && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/80 p-6 shadow-2xl backdrop-blur-xl">
            <h3 className="mb-2 text-lg font-extrabold">Reject Request</h3>
            <p className="mb-4 text-sm text-gray-700">
              Are you sure you want to reject password reset for <b>{selectedRequest.employee_id}</b>?
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => { setModalType(null); setSelectedRequest(null) }}
                className={`${btn} bg-white/70`}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className={`${btn} bg-rose-600 text-white focus-visible:ring-rose-300`}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
