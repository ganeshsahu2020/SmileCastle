import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

export default function EmployeePanel() {
  const { user, logoutUser } = useAuth()
  const [status, setStatus] = useState('Loading...')
  const [history, setHistory] = useState([])
  const [requests, setRequests] = useState([])
  const [modal, setModal] = useState(null)

  const [expandedSections, setExpandedSections] = useState({})
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [requestData, setRequestData] = useState({ punch_type: 'IN', timestamp: '', comment: '' })

  // ✅ Change Password Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ old_password: '', new_password: '', confirm_password: '' })

  const beep = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=')
    audio.play()
  }

  const fetchStatus = async () => {
    const { data } = await supabase
      .from('punches')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false })
      .limit(1)

    if (!data || data.length === 0) {
      setStatus('Not Clocked In')
    } else {
      const lastPunch = data[0].punch_type
      switch (lastPunch) {
        case 'IN': setStatus('Clocked In'); break
        case 'OUT': setStatus('Clocked Out'); break
        case 'BREAK_IN': setStatus('On Break'); break
        case 'BREAK_OUT': setStatus('Returned from Break'); break
        default: setStatus('Unknown')
      }
    }
  }

  const loadHistory = async () => {
    const { data } = await supabase
      .from('punches')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false })
    if (data) setHistory(data)
  }

  const loadRequests = async () => {
    const { data } = await supabase
      .from('edit_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (data) setRequests(data)
  }

  const punch = async (type) => {
    const { error } = await supabase.from('punches').insert([{ user_id: user.id, punch_type: type }])
    if (error) {
      alert('Punch failed: ' + error.message)
    } else {
      const time = new Date().toLocaleTimeString()
      beep()
      setModal({ type, time })
      fetchStatus()
      loadHistory()
      setTimeout(() => setModal(null), 2000)
    }
  }

  const submitPunchRequest = async () => {
    if (!requestData.timestamp) return alert('Select timestamp')
    if (!requestData.comment.trim()) return alert('Please provide a reason/comment')

    const { error } = await supabase.from('edit_requests').insert([{
      user_id: user.id,
      punch_type: requestData.punch_type,
      timestamp: requestData.timestamp,
      comment: requestData.comment,
      status: 'Pending'
    }])

    if (error) {
      alert('Request failed: ' + error.message)
    } else {
      alert('✅ Request submitted for admin approval')
      setShowRequestModal(false)
      setRequestData({ punch_type: 'IN', timestamp: '', comment: '' })
      loadRequests()
    }
  }

  // ✅ Change Password Logic
  const handleChangePassword = async () => {
    if (!passwordForm.old_password || !passwordForm.new_password || !passwordForm.confirm_password) {
      return alert('All fields are required')
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      return alert('New passwords do not match')
    }

    // ✅ Verify old password
    const { data: userData } = await supabase.from('users').select('password_hash').eq('id', user.id).single()
    if (!userData || userData.password_hash !== passwordForm.old_password) {
      return alert('Old password is incorrect')
    }

    const { error } = await supabase.from('users')
      .update({ password_hash: passwordForm.new_password, password_last_changed: new Date().toISOString() })
      .eq('id', user.id)

    if (error) {
      alert('Password change failed: ' + error.message)
    } else {
      alert('✅ Password changed successfully. Please log in again.')
      setShowPasswordModal(false)
      logoutUser() // ✅ Force logout after password change
    }
  }

  const groupHierarchical = () => {
    const grouped = {}
    history.forEach((p) => {
      const ts = new Date(p.timestamp)
      const year = ts.getFullYear()
      const month = ts.toLocaleString('default', { month: 'long' })
      const week = `Week ${Math.ceil(ts.getDate() / 7)}`
      const day = ts.toLocaleDateString()

      if (!grouped[year]) grouped[year] = {}
      if (!grouped[year][month]) grouped[year][month] = {}
      if (!grouped[year][month][week]) grouped[year][month][week] = {}
      if (!grouped[year][month][week][day]) grouped[year][month][week][day] = []

      grouped[year][month][week][day].push(p)
    })
    return grouped
  }

  const toggleSection = (key) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const punchIcon = (type) => {
    if (type === 'IN') return '🟢'
    if (type === 'OUT') return '🔴'
    if (type === 'BREAK_IN' || type === 'BREAK_OUT') return '☕'
    return ''
  }

  const punchClass = (type) => {
    if (type === 'IN') return 'bg-green-100'
    if (type === 'OUT') return 'bg-red-100'
    if (type === 'BREAK_IN' || type === 'BREAK_OUT') return 'bg-yellow-100'
    return ''
  }

  const getDurationLabel = (punches, idx) => {
    const current = punches[idx]
    if (current.punch_type === 'OUT') {
      const lastIn = punches.slice(0, idx + 1).reverse().find(p => p.punch_type === 'IN')
      if (!lastIn) return ''
      const diffMs = new Date(current.timestamp) - new Date(lastIn.timestamp)
      return `(Worked ${(diffMs / 3600000).toFixed(2)}h)`
    }
    if (current.punch_type === 'BREAK_OUT') {
      const lastBreak = punches.slice(0, idx + 1).reverse().find(p => p.punch_type === 'BREAK_IN')
      if (!lastBreak) return ''
      const diffMs = new Date(current.timestamp) - new Date(lastBreak.timestamp)
      return `(Break ${(diffMs / 3600000).toFixed(2)}h)`
    }
    return ''
  }

  useEffect(() => {
    fetchStatus()
    loadHistory()
    loadRequests()
  }, [])

  const hierarchicalData = groupHierarchical()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 relative">
      <button onClick={logoutUser} className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded">
        Logout
      </button>

      <h2 className="text-2xl font-bold mb-1">Hello, {user.name}</h2>
      <div className="mb-4 p-3 rounded bg-green-200 text-green-900 font-semibold shadow">
        Welcome to the Smile Castle, {user.name}.
      </div>
      <p className="mb-2 text-lg font-medium">Current Status: {status}</p>

      {/* ✅ Change Password Button */}
      <button
        onClick={() => setShowPasswordModal(true)}
        className="mb-6 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
      >
        Change Password
      </button>

      <div className="flex flex-wrap gap-3 mb-4 justify-center">
        <button onClick={() => punch('IN')} className="bg-green-600 text-white px-4 py-2 rounded">Punch IN</button>
        <button onClick={() => punch('OUT')} className="bg-red-600 text-white px-4 py-2 rounded">Punch OUT</button>
        <button onClick={() => punch('BREAK_IN')} className="bg-yellow-500 text-white px-4 py-2 rounded">Break IN</button>
        <button onClick={() => punch('BREAK_OUT')} className="bg-blue-500 text-white px-4 py-2 rounded">Break OUT</button>
      </div>

      <button onClick={() => setShowRequestModal(true)} className="mb-8 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded">
        Request Missing Punch
      </button>

      {/* ✅ Hierarchical Punch History */}
      <div className="bg-white shadow-md rounded-lg p-4 w-full max-w-2xl mb-6">
        <h3 className="font-semibold mb-3">Punch History</h3>
        {Object.keys(hierarchicalData).length === 0 ? (
          <p className="text-gray-500 text-sm">No punches recorded.</p>
        ) : (
          Object.entries(hierarchicalData).map(([year, months]) => (
            <div key={year} className="mb-3">
              <div onClick={() => toggleSection(year)} className="cursor-pointer bg-gray-300 p-2 rounded font-bold flex justify-between">
                <span>{year}</span><span>{expandedSections[year] ? '▲' : '▼'}</span>
              </div>
              {expandedSections[year] && Object.entries(months).map(([month, weeks]) => (
                <div key={month} className="ml-4 mt-2">
                  <div onClick={() => toggleSection(`${year}-${month}`)} className="cursor-pointer bg-gray-200 p-2 rounded font-semibold flex justify-between">
                    <span>{month}</span><span>{expandedSections[`${year}-${month}`] ? '▲' : '▼'}</span>
                  </div>
                  {expandedSections[`${year}-${month}`] && Object.entries(weeks).map(([week, days]) => (
                    <div key={week} className="ml-6 mt-1">
                      <div onClick={() => toggleSection(`${year}-${month}-${week}`)} className="cursor-pointer bg-gray-100 p-1 rounded flex justify-between">
                        <span>{week}</span><span>{expandedSections[`${year}-${month}-${week}`] ? '▲' : '▼'}</span>
                      </div>
                      {expandedSections[`${year}-${month}-${week}`] && Object.entries(days).map(([day, punches]) => (
                        <div key={day} className="ml-8 mt-1">
                          <div onClick={() => toggleSection(`${day}`)} className="cursor-pointer bg-gray-50 p-1 rounded flex justify-between">
                            <span>{day}</span><span>{expandedSections[`${day}`] ? '▲' : '▼'}</span>
                          </div>
                          {expandedSections[`${day}`] && (
                            <ul className="ml-4 mt-1 space-y-1">
                              {punches.map((p, idx) => (
                                <li key={p.id} className={`flex items-center gap-2 text-sm p-1 rounded ${punchClass(p.punch_type)}`}>
                                  <span>{punchIcon(p.punch_type)}</span>
                                  <span className="font-semibold">{p.punch_type}</span> – {new Date(p.timestamp).toLocaleTimeString()} {getDurationLabel(punches, idx)}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* ✅ Punch Requests */}
      <div className="bg-white shadow-md rounded-lg p-4 w-full max-w-md">
        <h3 className="font-semibold mb-3">Your Punch Requests</h3>
        {requests.length === 0 ? (
          <p className="text-gray-500 text-sm">No punch requests submitted.</p>
        ) : (
          <ul className="space-y-2">
            {requests.map(req => (
              <li key={req.id} className="border p-2 rounded text-sm bg-gray-50">
                <div className="font-medium">
                  {punchIcon(req.punch_type)} {req.punch_type} – {new Date(req.timestamp).toLocaleString()}
                </div>
                <div className="text-xs text-gray-600">Status: <span className="font-semibold">{req.status}</span></div>
                {req.comment && <div className="text-xs mt-1 text-gray-700">💬 Reason: {req.comment}</div>}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ✅ Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-72 text-center">
            <h3 className="text-xl font-bold mb-2">✅ Punch Recorded</h3>
            <p className="text-lg font-medium">{modal.type}</p>
            <p className="text-sm text-gray-500">{modal.time}</p>
          </div>
        </div>
      )}

      {/* ✅ Missing Punch Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80">
            <h3 className="text-lg font-bold mb-3">Request Missing Punch</h3>
            <select
              value={requestData.punch_type}
              onChange={(e) => setRequestData({ ...requestData, punch_type: e.target.value })}
              className="border p-2 rounded w-full mb-3"
            >
              <option value="IN">IN</option>
              <option value="OUT">OUT</option>
              <option value="BREAK_IN">BREAK_IN</option>
              <option value="BREAK_OUT">BREAK_OUT</option>
            </select>
            <input
              type="datetime-local"
              value={requestData.timestamp}
              onChange={(e) => setRequestData({ ...requestData, timestamp: e.target.value })}
              className="border p-2 rounded w-full mb-3"
            />
            <textarea
              placeholder="Reason for request (required)"
              value={requestData.comment}
              onChange={(e) => setRequestData({ ...requestData, comment: e.target.value })}
              className="border p-2 rounded w-full mb-3"
              rows={3}
            />
            <button onClick={submitPunchRequest} className="bg-green-600 text-white px-4 py-2 rounded w-full mb-2">Submit Request</button>
            <button onClick={() => setShowRequestModal(false)} className="bg-gray-500 text-white px-4 py-2 rounded w-full">Cancel</button>
          </div>
        </div>
      )}

      {/* ✅ Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-80">
            <h3 className="text-lg font-bold mb-3">Change Password</h3>
            <input
              type="password"
              placeholder="Old Password"
              value={passwordForm.old_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
              className="border p-2 rounded w-full mb-3"
            />
            <input
              type="password"
              placeholder="New Password"
              value={passwordForm.new_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
              className="border p-2 rounded w-full mb-3"
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={passwordForm.confirm_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
              className="border p-2 rounded w-full mb-3"
            />
            <button onClick={handleChangePassword} className="bg-green-600 text-white px-4 py-2 rounded w-full mb-2">Update Password</button>
            <button onClick={() => setShowPasswordModal(false)} className="bg-gray-500 text-white px-4 py-2 rounded w-full">Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}
