// src/pages/admin/PunchRequests.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabaseClient'
import { ThumbsUp, Ban } from 'lucide-react'

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

  const card =
    'rounded-2xl border border-white/20 bg-white/60 dark:bg-white/10 ' +
    'backdrop-blur-xl shadow-xl transition-all'

  const btn =
    'inline-flex items-center gap-2 rounded-xl px-3 py-2 font-semibold transition-all ' +
    'focus-visible:outline-none focus-visible:ring-2'

  return (
    <section className="space-y-6">
      <h2 className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white">
        Punch Edit Requests
      </h2>

      <div className={`${card} p-5`}>
        {loading ? (
          <p className="text-sm text-gray-600">Loading…</p>
        ) : requests.length === 0 ? (
          <p className="text-sm text-gray-600">No pending requests</p>
        ) : (
          <div className="overflow-x-auto rounded-xl">
            <table className="min-w-full text-sm">
              <thead className="bg-white/60 backdrop-blur-md text-left">
                <tr>
                  <th className="p-2">Employee</th>
                  <th className="p-2">Type</th>
                  <th className="p-2">Requested Time</th>
                  <th className="p-2">Reason</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/20">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-white/40">
                    <td className="p-2">
                      {req.users?.name} <span className="opacity-70">({req.users?.employee_id})</span>
                    </td>
                    <td className="p-2">{req.punch_type}</td>
                    <td className="p-2">{new Date(req.timestamp).toLocaleString()}</td>
                    <td className="p-2">{req.comment || '—'}</td>
                    <td className="p-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => approveRequest(req)}
                          className={`${btn} bg-emerald-600 text-white focus-visible:ring-emerald-300`}
                          aria-label="Approve request"
                        >
                          <ThumbsUp size={16} aria-hidden />
                          Approve
                        </button>
                        <button
                          onClick={() => denyRequest(req.id)}
                          className={`${btn} bg-rose-600 text-white focus-visible:ring-rose-300`}
                          aria-label="Deny request"
                        >
                          <Ban size={16} aria-hidden />
                          Deny
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
