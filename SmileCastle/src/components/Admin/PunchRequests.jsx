import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabaseClient'

export default function PunchRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(false)

  const loadRequests = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('edit_requests')
      .select('*, users(name, employee_id)')
      .order('timestamp', { ascending: true })
    if (data) setRequests(data)
    setLoading(false)
  }

  useEffect(() => { loadRequests() }, [])

  const approveRequest = async (req) => {
    await supabase.from('punches').insert([{
      user_id: req.user_id,
      punch_type: req.punch_type,
      timestamp: req.timestamp
    }])
    await supabase.from('edit_requests').delete().eq('id', req.id)
    loadRequests()
  }

  const denyRequest = async (id) => {
    await supabase.from('edit_requests').delete().eq('id', id)
    loadRequests()
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4 text-blue-600">Punch Edit Requests</h2>
      {loading ? <p>Loading...</p> : requests.length === 0 ? (
        <p className="text-gray-500">No pending requests</p>
      ) : (
        <table className="w-full text-sm border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Employee</th>
              <th className="p-2 border">Type</th>
              <th className="p-2 border">Requested Time</th>
              <th className="p-2 border">Reason</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(req => (
              <tr key={req.id} className="border-b">
                <td className="p-2 border">{req.users?.name} ({req.users?.employee_id})</td>
                <td className="p-2 border">{req.punch_type}</td>
                <td className="p-2 border">{new Date(req.timestamp).toLocaleString()}</td>
                <td className="p-2 border">{req.comment || '—'}</td>
                <td className="p-2 border flex gap-2">
                  <button onClick={() => approveRequest(req)} className="bg-green-600 text-white px-2 rounded">Approve</button>
                  <button onClick={() => denyRequest(req.id)} className="bg-red-500 text-white px-2 rounded">Deny</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
