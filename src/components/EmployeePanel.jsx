// src/components/EmployeePanel.jsx
import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../utils/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import AppHeader from './AppHeader'
import {
  LogOut,
  AlarmClock,
  Coffee,
  ArrowRightLeft,
  ShieldCheck,
  UserRoundCog,
  X,
  Upload as UploadIcon,
} from 'lucide-react'

// 🔔 chat notifications (badge + toast + bell)
import useChatNotifications from '../hooks/useChatNotifications'
import ChatToast from './chat/ChatToast'
import ChatBell from './chat/ChatBell'

export default function EmployeePanel() {
  const { user, logoutUser } = useAuth()
  const [status, setStatus] = useState('Loading…')
  const [history, setHistory] = useState([])
  const [requests, setRequests] = useState([])
  const [modal, setModal] = useState(null)
  const [expanded, setExpanded] = useState({})
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [requestData, setRequestData] = useState({ punch_type: 'IN', timestamp: '', comment: '' })

  // Change Password Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ old_password: '', new_password: '', confirm_password: '' })

  // PROFILE DRAWER (view/edit own profile)
  const [profileOpen, setProfileOpen] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState('') // remote or data URL
  const [avatarFile, setAvatarFile] = useState(null)
  const profileRef = useRef(null)
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    dob: '',
    address: '',
    mobile: '',
  })

  // 🔔 notifications hook
  const { unread, clearUnread, toast, setToast, openChat } = useChatNotifications()

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
    if (!data || data.length === 0) setStatus('Not Clocked In')
    else {
      const last = data[0].punch_type
      setStatus(
        last === 'IN'
          ? 'Clocked In'
          : last === 'OUT'
          ? 'Clocked Out'
          : last === 'BREAK_IN'
          ? 'On Break'
          : last === 'BREAK_OUT'
          ? 'Returned from Break'
          : 'Unknown'
      )
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

  // ─────────────────── Avatar upload helper
  const uploadAvatar = async (userId, file) => {
    try {
      if (!file || !userId) return null
      const ext = (file.name.split('.').pop() || 'png').toLowerCase()
      const path = `${userId}/${Date.now()}.${ext}`
      const { error } = await supabase.storage
        .from('avatars')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type || `image/${ext}`,
        })
      if (error) {
        const msg = (error?.message || '').toLowerCase()
        if (msg.includes('bucket not found')) {
          alert('Avatar upload failed: missing "avatars" bucket. Create it in Supabase → Storage.')
        }
        console.error('Upload error:', error)
        return null
      }
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      return data?.publicUrl || null
    } catch (e) {
      console.error('Upload exception:', e)
      return null
    }
  }

  // ─────────────────── Profile fetch (for drawer)
  const fetchMyProfile = async () => {
    setProfileLoading(true)
    try {
      const { data: userRow, error: userErr } = await supabase
        .from('users')
        .select('name,email')
        .eq('id', user.id)
        .single()
      if (userErr) throw userErr

      const { data: profile, error: profErr } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      if (profErr) throw profErr

      const parts = (userRow?.name || '').trim().split(/\s+/)
      const first = profile?.first_name || parts[0] || ''
      const last = profile?.last_name || (parts.length > 1 ? parts[parts.length - 1] : '')
      const middle = profile?.middle_name || (parts.length > 2 ? parts.slice(1, -1).join(' ') : '')

      setProfileForm({
        first_name: first,
        middle_name: middle,
        last_name: last,
        email: userRow?.email || '',
        dob: profile?.dob ? new Date(profile.dob).toISOString().slice(0, 10) : '',
        address: profile?.address || '',
        mobile: profile?.mobile || '',
      })
      setAvatarPreview(profile?.avatar_url || '')
      setAvatarFile(null)
    } catch (e) {
      console.error('Profile fetch error:', e)
      const partsFallback = (user?.name || '').trim().split(/\s+/)
      setProfileForm((f) => ({
        ...f,
        first_name: partsFallback[0] || '',
        last_name: partsFallback.length > 1 ? partsFallback[partsFallback.length - 1] : '',
        middle_name: partsFallback.length > 2 ? partsFallback.slice(1, -1).join(' ') : '',
        email: user?.email || '',
      }))
      setAvatarPreview('')
    } finally {
      setProfileLoading(false)
    }
  }

  // ─────────────────── Save profile
  const saveMyProfile = async () => {
    if (!profileForm.first_name?.trim() || !profileForm.last_name?.trim()) {
      alert('First and last name are required.')
      return
    }
    if (profileForm.mobile && !/^\+?[0-9\s\-]{7,15}$/.test(profileForm.mobile)) {
      alert('Enter a valid mobile number.')
      return
    }

    setProfileSaving(true)
    try {
      let avatar_url = null
      if (avatarFile) {
        avatar_url = await uploadAvatar(user.id, avatarFile)
      }

      const displayName = [profileForm.first_name, profileForm.middle_name, profileForm.last_name]
        .map((s) => (s || '').trim())
        .filter(Boolean)
        .join(' ')
      const { error: uErr } = await supabase
        .from('users')
        .update({ name: displayName, email: profileForm.email || null })
        .eq('id', user.id)
      if (uErr) throw uErr

      const payload = {
        user_id: user.id,
        first_name: profileForm.first_name,
        middle_name: profileForm.middle_name || null,
        last_name: profileForm.last_name,
        dob: profileForm.dob || null,
        address: profileForm.address || null,
        mobile: profileForm.mobile || null,
      }
      if (avatar_url) payload.avatar_url = avatar_url

      try {
        await supabase.from('user_profiles').upsert(payload, { onConflict: 'user_id' })
      } catch {
        const { avatar_url: _, ...noAvatar } = payload
        await supabase.from('user_profiles').upsert(noAvatar, { onConflict: 'user_id' })
      }

      alert('Profile updated.')
      setProfileOpen(false)
      fetchStatus()
      loadHistory()
      loadRequests()
    } catch (e) {
      console.error('Profile save error:', e)
      alert('Failed to update profile.')
    } finally {
      setProfileSaving(false)
    }
  }

  const onAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setAvatarPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  const punch = async (type) => {
    const { error } = await supabase.from('punches').insert([{ user_id: user.id, punch_type: type }])
    if (error) alert('Punch failed: ' + error.message)
    else {
      const time = new Date().toLocaleTimeString()
      beep()
      setModal({ type, time })
      fetchStatus()
      loadHistory()
      setTimeout(() => setModal(null), 1600)
    }
  }

  const submitPunchRequest = async () => {
    if (!requestData.timestamp) return alert('Select timestamp')
    if (!requestData.comment.trim()) return alert('Please provide a reason/comment')
    const { error } = await supabase.from('edit_requests').insert([
      {
        user_id: user.id,
        punch_type: requestData.punch_type,
        timestamp: requestData.timestamp,
        comment: requestData.comment,
        status: 'Pending',
      },
    ])
    if (error) alert('Request failed: ' + error.message)
    else {
      alert('Request submitted for admin approval')
      setShowRequestModal(false)
      setRequestData({ punch_type: 'IN', timestamp: '', comment: '' })
      loadRequests()
    }
  }

  const handleChangePassword = async () => {
    if (!passwordForm.old_password || !passwordForm.new_password || !passwordForm.confirm_password)
      return alert('All fields are required')
    if (passwordForm.new_password !== passwordForm.confirm_password) return alert('New passwords do not match')

    const { data: userData } = await supabase.from('users').select('password_hash').eq('id', user.id).single()
    if (!userData || userData.password_hash !== passwordForm.old_password) return alert('Old password is incorrect')

    const { error } = await supabase
      .from('users')
      .update({ password_hash: passwordForm.new_password, password_last_changed: new Date().toISOString() })
      .eq('id', user.id)
    if (error) alert('Password change failed: ' + error.message)
    else {
      alert('Password changed successfully. Please log in again.')
      setShowPasswordModal(false)
      logoutUser()
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
      grouped[year] ??= {}
      grouped[year][month] ??= {}
      grouped[year][month][week] ??= {}
      grouped[year][month][week][day] ??= []
      grouped[year][month][week][day].push(p)
    })
    return grouped
  }

  const toggle = (key) => setExpanded((s) => ({ ...s, [key]: !s[key] }))

  useEffect(() => {
    fetchStatus()
    loadHistory()
    loadRequests()
  }, [])

  const hierarchical = groupHierarchical()

  const glassCard =
    'rounded-2xl border border-white/20 bg-white/60 dark:bg-white/10 backdrop-blur-xl shadow-xl transition-all'

  const actionBtn =
    'inline-flex items-center gap-2 rounded-xl px-3 py-2 font-semibold text-white shadow transition-all ' +
    'hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2'

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_10%_-10%,rgba(16,185,129,0.12),transparent),radial-gradient(1000px_600px_at_90%_10%,rgba(59,130,246,0.12),transparent)]">
      {/* Top header visible on all breakpoints */}
      <AppHeader
        title="Employee Panel"
        brand="Smile Castle"
        visibility="all"
        onMenu={() => {}}
        rightAddon={<ChatBell unread={unread} onClick={clearUnread} />}
      />

      <div className="grid place-items-start gap-6 p-4">
        <div className="relative w-full max-w-3xl">
          <button
            onClick={logoutUser}
            className="absolute -top-1 right-0 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-3 py-2 font-semibold text-white shadow hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
            aria-label="Logout"
          >
            <LogOut size={16} aria-hidden />
            Logout
          </button>

          <h2 className="mb-1 text-2xl font-extrabold tracking-tight">Hello, {user.name}</h2>
          <div className="mb-4 rounded-2xl border border-emerald-300/30 bg-emerald-50/70 px-4 py-3 font-semibold text-emerald-900 shadow backdrop-blur-md">
            Welcome to the Smile Castle, {user.name}.
          </div>

          <p className="mb-3 text-lg font-medium">
            Current Status: <span className="font-extrabold">{status}</span>
          </p>

          <div className="mb-4 flex flex-wrap gap-3">
            <button onClick={() => punch('IN')} className={`${actionBtn} bg-emerald-600`} aria-label="Punch IN">
              <AlarmClock size={16} aria-hidden />
              Punch IN
            </button>
            <button onClick={() => punch('OUT')} className={`${actionBtn} bg-rose-600`} aria-label="Punch OUT">
              <AlarmClock size={16} aria-hidden />
              Punch OUT
            </button>
            <button onClick={() => punch('BREAK_IN')} className={`${actionBtn} bg-amber-500`} aria-label="Break IN">
              <Coffee size={16} aria-hidden />
              Break IN
            </button>
            <button onClick={() => punch('BREAK_OUT')} className={`${actionBtn} bg-blue-600`} aria-label="Break OUT">
              <Coffee size={16} aria-hidden />
              Break OUT
            </button>
          </div>

          <div className="mb-6 flex flex-wrap gap-3">
            <button
              onClick={() => {
                setProfileOpen(true)
                fetchMyProfile()
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white shadow hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
            >
              <UserRoundCog size={16} aria-hidden />
              My Profile
            </button>

            <button
              onClick={() => setShowPasswordModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white shadow hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
            >
              <ShieldCheck size={16} aria-hidden />
              Change Password
            </button>

            {/* NEW: Open Chat with unread badge */}
            <Link
              to="/chat"
              onClick={clearUnread}
              className="relative inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white shadow hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            >
              <ArrowRightLeft size={16} aria-hidden />
              Open Chat
              {unread > 0 && (
                <span className="absolute -top-2 -right-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-600 px-1 text-xs font-bold text-white">
                  {unread}
                </span>
              )}
            </Link>
          </div>

          {/* Punch History */}
          <div className={`${glassCard} mb-6 p-4`}>
            <h3 className="mb-3 font-semibold">Punch History</h3>
            {Object.keys(hierarchical).length === 0 ? (
              <p className="text-sm text-gray-600">No punches recorded.</p>
            ) : (
              Object.entries(hierarchical).map(([year, months]) => (
                <div key={year} className="mb-3">
                  <button
                    onClick={() => toggle(year)}
                    className="flex w-full items-center justify-between rounded-lg bg-white/60 px-2 py-1 font-bold hover:bg-white/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-300"
                    aria-expanded={!!expanded[year]}
                  >
                    <span>{year}</span>
                    <ArrowRightLeft className={`${expanded[year] ? 'rotate-90' : ''} transition`} size={16} aria-hidden />
                  </button>
                  {expanded[year] &&
                    Object.entries(months).map(([month, weeks]) => (
                      <div key={month} className="ml-3 mt-2">
                        <button
                          onClick={() => toggle(`${year}-${month}`)}
                          className="flex w-full items-center justify-between rounded-lg bg-white/60 px-2 py-1 font-semibold hover:bg-white/70"
                          aria-expanded={!!expanded[`${year}-${month}`]}
                        >
                          <span>{month}</span>
                          <ArrowRightLeft
                            className={`${expanded[`${year}-${month}`] ? 'rotate-90' : ''} transition`}
                            size={16}
                            aria-hidden
                          />
                        </button>
                        {expanded[`${year}-${month}`] &&
                          Object.entries(weeks).map(([week, days]) => (
                            <div key={week} className="ml-4 mt-1">
                              <button
                                onClick={() => toggle(`${year}-${month}-${week}`)}
                                className="flex w-full items-center justify-between rounded-lg bg-white/60 px-2 py-1 hover:bg-white/70"
                                aria-expanded={!!expanded[`${year}-${month}-${week}`]}
                              >
                                <span>{week}</span>
                                <ArrowRightLeft
                                  className={`${expanded[`${year}-${month}-${week}`] ? 'rotate-90' : ''} transition`}
                                  size={16}
                                  aria-hidden
                                />
                              </button>
                              {expanded[`${year}-${month}-${week}`] &&
                                Object.entries(days).map(([day, punches]) => (
                                  <div key={day} className="ml-4 mt-1 rounded-lg bg-white/40 p-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-semibold text-blue-700">{day}</span>
                                    </div>
                                    <ul className="mt-1 space-y-1">
                                      {punches.map((p) => (
                                        <li key={p.id} className="flex items-center gap-2 text-sm">
                                          <span>{p.punch_type === 'IN' ? '🟢' : p.punch_type === 'OUT' ? '🔴' : '☕'}</span>
                                          <span className="font-semibold">{p.punch_type}</span>
                                          <span className="opacity-70">— {new Date(p.timestamp).toLocaleTimeString()}</span>
                                        </li>
                                      ))}
                                    </ul>
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

          {/* Your Punch Requests */}
          <div className={`${glassCard} p-4`}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">Your Punch Requests</h3>
              <button
                onClick={() => setShowRequestModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-3 py-2 font-semibold text-white shadow hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
              >
                Request Missing Punch
              </button>
            </div>

            {requests.length === 0 ? (
              <p className="text-sm text-gray-600">No punch requests submitted.</p>
            ) : (
              <ul className="space-y-2">
                {requests.map((req) => (
                  <li key={req.id} className="rounded-xl border border-white/20 bg-white/50 p-2 text-sm">
                    <div className="font-medium">
                      {req.punch_type} — {new Date(req.timestamp).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600">
                      Status: <span className="font-semibold">{req.status}</span>
                    </div>
                    {req.comment && <div className="mt-1 text-xs text-gray-700">Reason: {req.comment}</div>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Toast-ish Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-72 rounded-2xl border border-white/20 bg-white/80 p-6 text-center shadow-2xl backdrop-blur-xl">
            <h3 className="mb-2 text-xl font-extrabold">Punch Recorded</h3>
            <p className="text-lg font-medium">{modal.type}</p>
            <p className="text-sm text-gray-600">{modal.time}</p>
          </div>
        </div>
      )}

      {/* Missing Punch Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-80 rounded-2xl border border-white/20 bg-white/80 p-6 shadow-2xl backdrop-blur-xl">
            <h3 className="mb-3 text-lg font-extrabold">Request Missing Punch</h3>
            <select
              value={requestData.punch_type}
              onChange={(e) => setRequestData({ ...requestData, punch_type: e.target.value })}
              className="mb-3 w-full rounded-xl border border-white/30 bg-white/70 px-3 py-2 shadow-sm outline-none backdrop-blur-md focus:ring-2 focus:ring-emerald-300"
              aria-label="Punch type"
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
              className="mb-3 w-full rounded-xl border border-white/30 bg-white/70 px-3 py-2 shadow-sm outline-none backdrop-blur-md focus:ring-2 focus:ring-emerald-300"
              aria-label="Timestamp"
            />
            <textarea
              placeholder="Reason for request (required)"
              value={requestData.comment}
              onChange={(e) => setRequestData({ ...requestData, comment: e.target.value })}
              className="mb-3 w-full rounded-xl border border-white/30 bg-white/70 px-3 py-2 shadow-sm outline-none backdrop-blur-md focus:ring-2 focus:ring-emerald-300"
              rows={3}
            />
            <button
              onClick={submitPunchRequest}
              className="mb-2 w-full rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white shadow hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            >
              Submit Request
            </button>
            <button
              onClick={() => setShowRequestModal(false)}
              className="w-full rounded-xl bg-gray-600 px-4 py-2 font-semibold text-white shadow hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-80 rounded-2xl border border-white/20 bg-white/80 p-6 shadow-2xl backdrop-blur-xl">
            <h3 className="mb-3 text-lg font-extrabold">Change Password</h3>
            <input
              type="password"
              placeholder="Old Password"
              value={passwordForm.old_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
              className="mb-3 w-full rounded-xl border border-white/30 bg-white/70 px-3 py-2 shadow-sm outline-none backdrop-blur-md focus:ring-2 focus:ring-indigo-300"
            />
            <input
              type="password"
              placeholder="New Password"
              value={passwordForm.new_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
              className="mb-3 w-full rounded-xl border border-white/30 bg-white/70 px-3 py-2 shadow-sm outline-none backdrop-blur-md focus:ring-2 focus:ring-indigo-300"
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={passwordForm.confirm_password}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
              className="mb-3 w-full rounded-xl border border-white/30 bg-white/70 px-3 py-2 shadow-sm outline-none backdrop-blur-md focus:ring-2 focus:ring-indigo-300"
            />
            <button
              onClick={handleChangePassword}
              className="mb-2 w-full rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white shadow hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            >
              Update Password
            </button>
            <button
              onClick={() => setShowPasswordModal(false)}
              className="w-full rounded-xl bg-gray-600 px-4 py-2 font-semibold text-white shadow hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* PROFILE DRAWER */}
      {profileOpen && (
        <ProfileDrawer
          innerRef={profileRef}
          loading={profileLoading}
          saving={profileSaving}
          onClose={() => setProfileOpen(false)}
          profileForm={profileForm}
          setProfileForm={setProfileForm}
          avatarPreview={avatarPreview}
          onAvatarChange={onAvatarChange}
          onSave={saveMyProfile}
        />
      )}

      {/* 🔔 Chat toast */}
      <ChatToast toast={toast} onOpen={openChat} onClose={() => setToast(null)} />
    </div>
  )
}

/* ──────────────────────────────────────────────────────────
   Profile Drawer (inline edit: email, names, dob, address, mobile, avatar)
   ────────────────────────────────────────────────────────── */
function ProfileDrawer({
  innerRef,
  loading,
  saving,
  onClose,
  profileForm,
  setProfileForm,
  avatarPreview,
  onAvatarChange,
  onSave,
}) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const backdropRef = useRef(null)
  const onBackdrop = (e) => {
    if (e.target === backdropRef.current) onClose()
  }

  const input =
    'rounded-xl border border-white/30 bg-white/70 px-3 py-2 shadow-sm outline-none backdrop-blur-md focus:ring-2 focus:ring-emerald-300'

  return (
    <div
      ref={backdropRef}
      onMouseDown={onBackdrop}
      className="fixed inset-0 z-50 grid grid-cols-[minmax(0,1fr)] bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-label="Edit Profile"
    >
      <aside
        ref={innerRef}
        className="h-full w-[92%] max-w-md translate-x-0 bg-white shadow-2xl transition will-change-transform md:w-[520px]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 overflow-hidden rounded-xl bg-gradient-to-br from-emerald-400 via-cyan-400 to-blue-500" />
            <div className="text-sm font-bold tracking-tight">My Profile</div>
          </div>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-lg p-2 text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
            aria-label="Close"
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[calc(100vh-56px)] overflow-y-auto px-4 py-4">
          {loading ? (
            <p className="text-sm text-gray-600">Loading profile…</p>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                onSave()
              }}
              className="grid grid-cols-1 gap-3"
            >
              {/* Avatar */}
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 overflow-hidden rounded-full bg-gradient-to-br from-emerald-200 to-cyan-200 ring-2 ring-white/60">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-emerald-900/70">
                      ?
                    </div>
                  )}
                </div>
                <label className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/70 px-3 py-2 text-sm shadow-sm outline-none backdrop-blur-md hover:bg-white/80">
                  <UploadIcon size={16} /> Upload Avatar
                  <input type="file" accept="image/*" onChange={onAvatarChange} className="hidden" />
                </label>
              </div>

              {/* Names */}
              <input
                className={input}
                placeholder="First name"
                value={profileForm.first_name}
                onChange={(e) => setProfileForm((f) => ({ ...f, first_name: e.target.value }))}
                required
                aria-label="First name"
              />
              <input
                className={input}
                placeholder="Middle name (optional)"
                value={profileForm.middle_name}
                onChange={(e) => setProfileForm((f) => ({ ...f, middle_name: e.target.value }))}
                aria-label="Middle name"
              />
              <input
                className={input}
                placeholder="Last name"
                value={profileForm.last_name}
                onChange={(e) => setProfileForm((f) => ({ ...f, last_name: e.target.value }))}
                required
                aria-label="Last name"
              />

              {/* Email */}
              <input
                className={input}
                type="email"
                placeholder="Email"
                value={profileForm.email}
                onChange={(e) => setProfileForm((f) => ({ ...f, email: e.target.value }))}
                aria-label="Email"
              />

              {/* DOB / Mobile */}
              <input
                className={input}
                type="date"
                placeholder="Date of birth"
                value={profileForm.dob}
                onChange={(e) => setProfileForm((f) => ({ ...f, dob: e.target.value }))}
                aria-label="Date of birth"
              />
              <input
                className={input}
                type="tel"
                placeholder="Mobile (e.g. +1 555-555-5555)"
                value={profileForm.mobile}
                onChange={(e) => setProfileForm((f) => ({ ...f, mobile: e.target.value }))}
                aria-label="Mobile"
              />

              {/* Address */}
              <textarea
                className={input}
                rows={3}
                placeholder="Address"
                value={profileForm.address}
                onChange={(e) => setProfileForm((f) => ({ ...f, address: e.target.value }))}
                aria-label="Address"
              />

              <div className="mt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl bg-gray-200 px-4 py-2 font-semibold text-gray-800 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white shadow hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      </aside>
      <div />
    </div>
  )
}
