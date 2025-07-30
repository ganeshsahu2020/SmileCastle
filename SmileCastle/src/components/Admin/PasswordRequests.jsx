import { useEffect, useState } from 'react'
import { supabase } from '../../utils/supabaseClient'
import { useAuth } from '../../contexts/AuthContext'

export default function PasswordRequests() {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [tempPassword, setTempPassword] = useState('')
  const [comment, setComment] = useState('')
  const [modalType, setModalType] = useState(null) // 'approve' or 'reject'

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('password_requests')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      setError('Failed to load requests')
    } else {
      setRequests(data)
    }
    setLoading(false)
  }

  const handleApprove = async () => {
    if (!selectedRequest || !tempPassword) return

    // ✅ Update password in users table (plain-text)
    const { error: userError } = await supabase
      .from('users')
      .update({ password_hash: tempPassword, password_last_changed: new Date() })
      .eq('employee_id', selectedRequest.employee_id)

    if (userError) {
      setError('Failed to update user password')
      return
    }

    // ✅ Update password_requests entry
    const { error: updateError } = await supabase
      .from('password_requests')
      .update({
        status: 'Approved',
        temp_password: tempPassword,
        approved_by: user?.email || 'Admin',
        approved_at: new Date()
      })
      .eq('id', selectedRequest.id)

    if (updateError) {
      setError('Failed to update request status')
    } else {
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

    if (rejectError) {
      setError('Failed to reject request')
    } else {
      setSelectedRequest(null)
      setComment('')
      setModalType(null)
      fetchRequests()
    }
  }

  if (loading) return <p className="p-4">Loading password requests...</p>
  if (error) return <p className="p-4 text-red-500">{error}</p>

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Password Reset Requests</h2>
      <table className="w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Employee ID</th>
            <th className="p-2 border">Email</th>
            <th className="p-2 border">Reason</th>
            <th className="p-2 border">Status</th>
            <th className="p-2 border">Requested At</th>
            <th className="p-2 border">Action</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((req) => (
            <tr key={req.id} className="border-b">
              <td className="p-2 border">{req.employee_id}</td>
              <td className="p-2 border">{req.email}</td>
              <td className="p-2 border">{req.reason}</td>
              <td className="p-2 border">{req.status}</td>
              <td className="p-2 border">
                {new Date(req.created_at).toLocaleString()}
              </td>
              <td className="p-2 border">
                {req.status === 'Pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedRequest(req)
                        setModalType('approve')
                      }}
                      className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRequest(req)
                        setModalType('reject')
                      }}
                      className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ✅ Approve Modal */}
      {modalType === 'approve' && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-bold mb-2">Approve Request</h3>
            <p className="text-sm mb-4">
              Enter a temporary password for <strong>{selectedRequest.employee_id}</strong>
            </p>
            <input
              type="text"
              placeholder="Temporary Password"
              value={tempPassword}
              onChange={(e) => setTempPassword(e.target.value)}
              className="border p-2 rounded w-full mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setModalType(null)
                  setSelectedRequest(null)
                }}
                className="px-3 py-1 rounded bg-gray-300 hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Reject Modal */}
      {modalType === 'reject' && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-bold mb-2">Reject Request</h3>
            <p className="text-sm mb-4">
              Are you sure you want to reject password reset for{' '}
              <strong>{selectedRequest.employee_id}</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setModalType(null)
                  setSelectedRequest(null)
                }}
                className="px-3 py-1 rounded bg-gray-300 hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
