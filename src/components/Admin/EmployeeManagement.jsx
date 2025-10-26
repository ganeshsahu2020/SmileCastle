// src/pages/admin/EmployeeManagement.jsx
import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabaseClient'
import {
  UserPlus,
  Save,
  Pencil,
  Trash2,
  KeyRound,
  Search,
  Eye,
  EyeOff,
  Plus,
  UserCircle2,
} from 'lucide-react'

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(false)

  // ── Form state (expanded)
  const [form, setForm] = useState({
    employee_id: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    role: 'Employee',
    dob: '',
    address: '',
    mobile: '',
    password: '',
    confirm_password: '',
  })
  const [showPass, setShowPass] = useState(false)

  // Avatar state for main add/edit
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState('')

  // Edit id (null = add)
  const [editing, setEditing] = useState(null)

  // Search
  const [searchName, setSearchName] = useState('')

  // Reset Password Modal
  const [showResetModal, setShowResetModal] = useState(false)
  const [selectedEmp, setSelectedEmp] = useState(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [showResetPass, setShowResetPass] = useState(false)

  // Roles (optional roles table support)
  const [roles, setRoles] = useState(['Employee', 'Admin'])
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [newRole, setNewRole] = useState('')

  // ── Profile Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerLoading, setDrawerLoading] = useState(false)
  const [drawerUser, setDrawerUser] = useState(null) // { id, employee_id, name, email, role }
  const [profile, setProfile] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    dob: '',
    address: '',
    mobile: '',
    avatar_url: '',
  })
  const [drawerAvatarFile, setDrawerAvatarFile] = useState(null)
  const [drawerAvatarPreview, setDrawerAvatarPreview] = useState('')

  // ─────────────────── Loaders
  const loadEmployees = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: true })
    if (data) setEmployees(data)
    setLoading(false)
  }

  const loadRoles = async () => {
    const { data, error } = await supabase
      .from('roles')
      .select('name')
      .order('name', { ascending: true })
    if (!error && data?.length) setRoles(data.map((r) => r.name))
  }

  useEffect(() => {
    loadEmployees()
    loadRoles()
  }, [])

  // ─────────────────── Helpers
  const fullName = ({ first_name, middle_name, last_name }) =>
    [first_name?.trim(), middle_name?.trim(), last_name?.trim()]
      .filter(Boolean)
      .join(' ')

  const validateForm = () => {
    if (!editing && !form.employee_id?.trim())
      return 'Employee ID is required.'
    if (!form.first_name?.trim() || !form.last_name?.trim())
      return 'First and Last name are required.'
    if (!form.role) return 'Role is required.'
    if (!editing) {
      if (!form.password) return 'Password is required.'
      if (form.password !== form.confirm_password)
        return 'Passwords do not match.'
    }
    if (form.mobile && !/^\+?[0-9\s\-]{7,15}$/.test(form.mobile))
      return 'Enter a valid mobile number.'
    return null
  }

  // Upload avatar to storage bucket `avatars` and return public URL.
  const uploadAvatar = async (userId, file) => {
    try {
      if (!file || !userId) return null
      const ext = (file.name.split('.').pop() || 'png').toLowerCase()
      const path = `${userId}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type || `image/${ext}`,
        })
      if (upErr) {
        console.error('Upload error:', upErr)
        return null
      }
      const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path)
      return pub?.publicUrl || null
    } catch (e) {
      console.error('Upload exception:', e)
      return null
    }
  }

  // ─────────────────── CRUD (main form)
  const saveEmployee = async (e) => {
    e.preventDefault()
    const err = validateForm()
    if (err) return alert(err)

    const name = fullName(form)

    if (editing) {
      const { error: upErr } = await supabase
        .from('users')
        .update({
          name,
          email: form.email || null,
          role: form.role,
        })
        .eq('id', editing)
      if (upErr) return alert('Update failed: ' + upErr.message)

      let avatar_url = null
      if (avatarFile) avatar_url = await uploadAvatar(editing, avatarFile)

      const payload = {
        user_id: editing,
        first_name: form.first_name,
        middle_name: form.middle_name || null,
        last_name: form.last_name,
        dob: form.dob || null,
        address: form.address || null,
        mobile: form.mobile || null,
      }
      if (avatar_url) payload.avatar_url = avatar_url

      // tolerant upsert (avatar_url column may not exist)
      try {
        await supabase.from('user_profiles').upsert(payload, {
          onConflict: 'user_id',
        })
      } catch {
        try {
          const { avatar_url: _, ...noAvatar } = payload
          await supabase
            .from('user_profiles')
            .upsert(noAvatar, { onConflict: 'user_id' })
        } catch {}
      }

      setEditing(null)
    } else {
      const { data, error: insErr } = await supabase
        .from('users')
        .insert([
          {
            employee_id: form.employee_id.trim(),
            name,
            email: form.email || null,
            role: form.role,
            password_hash: form.password,
            password_last_changed: new Date().toISOString(),
          },
        ])
        .select('id')
        .single()

      if (insErr) return alert('Add failed: ' + insErr.message)
      const newUserId = data.id

      const avatar_url = avatarFile
        ? await uploadAvatar(newUserId, avatarFile)
        : null

      const payload = {
        user_id: newUserId,
        first_name: form.first_name,
        middle_name: form.middle_name || null,
        last_name: form.last_name,
        dob: form.dob || null,
        address: form.address || null,
        mobile: form.mobile || null,
      }
      if (avatar_url) payload.avatar_url = avatar_url

      try {
        await supabase.from('user_profiles').insert([payload])
      } catch {
        try {
          const { avatar_url: _, ...noAvatar } = payload
          await supabase.from('user_profiles').insert([noAvatar])
        } catch {}
      }
    }

    // Reset form
    setForm({
      employee_id: '',
      first_name: '',
      middle_name: '',
      last_name: '',
      email: '',
      role: roles[0] || 'Employee',
      dob: '',
      address: '',
      mobile: '',
      password: '',
      confirm_password: '',
    })
    setAvatarFile(null)
    setAvatarPreview('')
    setShowPass(false)
    loadEmployees()
  }

  const editEmployee = async (emp) => {
    setEditing(emp.id)
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', emp.id)
      .maybeSingle()

    const parts = (emp.name || '').trim().split(/\s+/)
    const first_name = profile?.first_name || parts[0] || ''
    const last_name =
      profile?.last_name || (parts.length > 1 ? parts[parts.length - 1] : '')
    const middle_name =
      profile?.middle_name ||
      (parts.length > 2 ? parts.slice(1, -1).join(' ') : '')

    setForm({
      employee_id: emp.employee_id,
      first_name,
      middle_name,
      last_name,
      email: emp.email || '',
      role: emp.role || roles[0] || 'Employee',
      dob: profile?.dob ? new Date(profile.dob).toISOString().slice(0, 10) : '',
      address: profile?.address || '',
      mobile: profile?.mobile || '',
      password: '',
      confirm_password: '',
    })

    setAvatarPreview(profile?.avatar_url || '')
    setAvatarFile(null)
  }

  const deleteEmployee = async (id) => {
    if (!confirm('Delete this employee?')) return
    await supabase.from('users').delete().eq('id', id)
    try {
      await supabase.from('user_profiles').delete().eq('user_id', id)
    } catch {}
    loadEmployees()
  }

  // Reset Password Modal
  const openResetModal = (emp) => {
    setSelectedEmp(emp)
    setNewPassword('')
    setConfirmNewPassword('')
    setShowResetPass(false)
    setShowResetModal(true)
  }

  const handleResetPassword = async () => {
    if (!newPassword) return alert('Enter a new password')
    if (newPassword !== confirmNewPassword)
      return alert('Passwords do not match')

    const { error } = await supabase
      .from('users')
      .update({
        password_hash: newPassword,
        password_last_changed: new Date().toISOString(),
      })
      .eq('id', selectedEmp.id)

    if (error) alert('Password reset failed: ' + error.message)
    else {
      alert(`Password reset for ${selectedEmp.name}`)
      setShowResetModal(false)
      setSelectedEmp(null)
      loadEmployees()
    }
  }

  // Roles
  const openRoleModal = () => {
    setNewRole('')
    setShowRoleModal(true)
  }
  const createRole = async () => {
    const role = (newRole || '').trim()
    if (!role) return
    const { error } = await supabase.from('roles').insert([{ name: role }])
    if (error) {
      alert(
        'Could not create role. Your users.role has a CHECK for Employee/Admin only.'
      )
      return
    }
    setRoles((prev) => Array.from(new Set([...prev, role])))
    setForm((f) => ({ ...f, role }))
    setShowRoleModal(false)
  }

  // Avatar select handler (main form)
  const onAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setAvatarPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  // ─────────────────── UI tokens
  const card =
    'rounded-2xl border border-white/20 bg-white/60 dark:bg-white/10 backdrop-blur-xl shadow-xl transition-all'
  const btn =
    'inline-flex items-center gap-2 rounded-xl px-3 py-2 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 transition-transform hover:scale-[1.01] active:scale-[0.98]'
  const primary =
    'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow'
  const subtle =
    'bg-white/60 dark:bg-white/10 text-gray-800 dark:text-gray-100 border border-white/20'

  const filtered = employees.filter(
    (emp) =>
      (emp.name || '').toLowerCase().includes(searchName.toLowerCase()) ||
      (emp.employee_id || '').toLowerCase().includes(searchName.toLowerCase())
  )

  // ─────────────────── Drawer helpers
  const openProfileDrawer = async (emp) => {
    setDrawerUser(emp)
    setDrawerLoading(true)
    setDrawerOpen(true)
    const { data: p } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', emp.id)
      .maybeSingle()

    const parts = (emp.name || '').trim().split(/\s+/)
    const first_name = p?.first_name || parts[0] || ''
    const last_name =
      p?.last_name || (parts.length > 1 ? parts[parts.length - 1] : '')
    const middle_name =
      p?.middle_name || (parts.length > 2 ? parts.slice(1, -1).join(' ') : '')

    setProfile({
      first_name,
      middle_name,
      last_name,
      dob: p?.dob ? new Date(p.dob).toISOString().slice(0, 10) : '',
      address: p?.address || '',
      mobile: p?.mobile || '',
      avatar_url: p?.avatar_url || '',
    })
    setDrawerAvatarFile(null)
    setDrawerAvatarPreview(p?.avatar_url || '')
    setDrawerLoading(false)
  }

  const saveProfileFromDrawer = async () => {
    if (!drawerUser) return
    setDrawerLoading(true)

    let avatar_url = profile.avatar_url || null
    if (drawerAvatarFile) {
      const uploaded = await uploadAvatar(drawerUser.id, drawerAvatarFile)
      if (uploaded) avatar_url = uploaded
    }

    const payload = {
      user_id: drawerUser.id,
      first_name: profile.first_name || '',
      middle_name: profile.middle_name || null,
      last_name: profile.last_name || '',
      dob: profile.dob || null,
      address: profile.address || null,
      mobile: profile.mobile || null,
    }
    if (avatar_url) payload.avatar_url = avatar_url

    try {
      await supabase
        .from('user_profiles')
        .upsert(payload, { onConflict: 'user_id' })
    } catch (e) {
      // if avatar_url column missing, try without it
      try {
        const { avatar_url: _, ...noAvatar } = payload
        await supabase
          .from('user_profiles')
          .upsert(noAvatar, { onConflict: 'user_id' })
      } catch {}
    }

    // also sync full name in users table
    const newName = fullName({
      first_name: profile.first_name,
      middle_name: profile.middle_name,
      last_name: profile.last_name,
    })
    await supabase
      .from('users')
      .update({ name: newName })
      .eq('id', drawerUser.id)

    // refresh list + drawer avatar
    await loadEmployees()
    setDrawerAvatarPreview(avatar_url || drawerAvatarPreview)
    setDrawerLoading(false)
    setDrawerOpen(false)
  }

  const onDrawerAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setDrawerAvatarFile(file)
    const reader = new FileReader()
    reader.onload = (ev) => setDrawerAvatarPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  return (
    <section aria-labelledby="employees-heading" className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2
          id="employees-heading"
          className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white"
        >
          Employee Management
        </h2>

        <div className="flex items-center gap-2">
          <label className="relative">
            <span className="sr-only">Search by name or ID</span>
            <input
              type="text"
              placeholder="Search name or ID…"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-64 rounded-xl border border-white/30 bg-white/70 px-9 py-2 text-sm shadow-sm outline-none backdrop-blur-md placeholder:text-gray-500 focus:ring-2 focus:ring-cyan-300"
            />
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              aria-hidden
            />
          </label>

          {/* Remove if not using custom roles */}
          <button
            onClick={openRoleModal}
            className={`${btn} ${subtle}`}
            aria-label="Create role"
          >
            <Plus size={16} aria-hidden /> Add Role
          </button>
        </div>
      </header>

      {/* Add / Edit */}
      <div className={`${card} p-5`}>
        <div className="mb-4 flex items-center gap-2">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 text-white shadow">
            <UserPlus size={16} aria-hidden />
          </div>
          <h3 className="text-lg font-bold">
            {editing ? 'Edit Employee' : 'Add Employee'}
          </h3>
        </div>

        <form onSubmit={saveEmployee} className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {!editing && (
            <input
              aria-label="Employee ID"
              type="text"
              placeholder="Employee ID"
              value={form.employee_id}
              onChange={(e) =>
                setForm({ ...form, employee_id: e.target.value })
              }
              className="rounded-xl border border-white/30 bg-white/70 px-3 py-2 shadow-sm outline-none backdrop-blur-md focus:ring-2 focus:ring-emerald-300"
              required
            />
          )}

          {/* Avatar upload (main form) */}
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 overflow-hidden rounded-full bg-gradient-to-br from-emerald-200 to-cyan-200 ring-2 ring-white/60">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-emerald-900/70">
                  {form.first_name?.[0]?.toUpperCase() || 'A'}
                </div>
              )}
            </div>
            <label className="cursor-pointer rounded-xl border border-white/30 bg-white/70 px-3 py-2 text-sm shadow-sm outline-none backdrop-blur-md hover:bg-white/80">
              <input
                type="file"
                accept="image/*"
                onChange={onAvatarChange}
                className="hidden"
              />
              Upload Avatar
            </label>
          </div>

          {/* Names */}
          <input
            aria-label="First Name"
            type="text"
            placeholder="First Name"
            value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
            className="rounded-xl border border-white/30 bg-white/70 px-3 py-2 shadow-sm outline-none backdrop-blur-md focus:ring-2 focus:ring-emerald-300"
            required
          />
          <input
            aria-label="Middle Name"
            type="text"
            placeholder="Middle Name (optional)"
            value={form.middle_name}
            onChange={(e) => setForm({ ...form, middle_name: e.target.value })}
            className="rounded- xl border border-white/30 bg-white/70 px-3 py-2 shadow-sm outline-none backdrop-blur-md focus:ring-2 focus:ring-emerald-300"
          />
          <input
            aria-label="Last Name"
            type="text"
            placeholder="Last Name"
            value={form.last_name}
            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
            className="rounded-xl border border-white/30 bg-white/70 px-3 py-2 shadow-sm outline-none backdrop-blur-md focus:ring-2 focus:ring-emerald-300"
            required
          />

          {/* Contact */}
          <input
            aria-label="Email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="rounded-xl border border-white/30 bg-white/70 px-3 py-2 shadow-sm outline-none backdrop-blur-md focus:ring-2 focus:ring-emerald-300"
          />
          <input
            aria-label="Mobile Number"
            type="tel"
            placeholder="Mobile (e.g. +1 555-555-5555)"
            value={form.mobile}
            onChange={(e) => setForm({ ...form, mobile: e.target.value })}
            className="rounded-xl border border-white/30 bg-white/70 px-3 py-2 shadow-sm outline-none backdrop-blur-md focus:ring-2 focus:ring-emerald-300"
          />

          {/* Personal */}
          <input
            aria-label="Date of Birth"
            type="date"
            placeholder="Date of Birth"
            value={form.dob}
            onChange={(e) => setForm({ ...form, dob: e.target.value })}
            className="rounded-xl border border-white/30 bg-white/70 px-3 py-2 shadow-sm outline-none backdrop-blur-md focus:ring-2 focus:ring-emerald-300"
          />
          <input
            aria-label="Address"
            type="text"
            placeholder="Address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="rounded-xl border border-white/30 bg-white/70 px-3 py-2 shadow-sm outline-none backdrop-blur-md focus:ring-2 focus:ring-emerald-300 md:col-span-2"
          />

          {/* Role */}
          <select
            aria-label="Role"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="rounded-xl border border-white/30 bg-white/70 px-3 py-2 shadow-sm outline-none backdrop-blur-md focus:ring-2 focus:ring-emerald-300"
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          {/* Passwords (only when adding) */}
          {!editing && (
            <>
              <div className="relative">
                <input
                  aria-label="Password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full rounded-xl border border-white/30 bg-white/70 px-3 py-2 pr-10 shadow-sm outline-none backdrop-blur-md focus:ring-2 focus:ring-emerald-300"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-600 hover:bg-white/60"
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <input
                aria-label="Confirm Password"
                type={showPass ? 'text' : 'password'}
                placeholder="Confirm Password"
                value={form.confirm_password}
                onChange={(e) =>
                  setForm({ ...form, confirm_password: e.target.value })
                }
                className="rounded-xl border border-white/30 bg-white/70 px-3 py-2 shadow-sm outline-none backdrop-blur-md focus:ring-2 focus:ring-emerald-300"
                required
              />
            </>
          )}

          <div className="md:col-span-2">
            <button
              className={`${btn} ${primary}`}
              aria-label={editing ? 'Update Employee' : 'Add Employee'}
            >
              <Save size={16} aria-hidden />
              {editing ? 'Update Employee' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>

      {/* Table */}
      <div className={`${card} p-5`}>
        <h3 className="mb-3 text-lg font-bold">Employee List</h3>
        {loading ? (
          <p className="text-sm text-gray-600">Loading employees…</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-600">No employees found</p>
        ) : (
          <div className="overflow-x-auto rounded-xl">
            <table className="min-w-full text-sm">
              <thead className="bg-white/60 backdrop-blur-md text-left">
                <tr>
                  <th className="p-2">ID</th>
                  <th className="p-2">Name</th>
                  <th className="p-2">Email</th>
                  <th className="p-2">Role</th>
                  <th className="p-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/20">
                {filtered.map((emp) => (
                  <tr key={emp.id} className="hover:bg-white/40">
                    <td className="p-2 font-medium">{emp.employee_id}</td>
                    <td className="p-2">
                      <EmployeeNameWithAvatar userId={emp.id} name={emp.name} />
                    </td>
                    <td className="p-2">{emp.email || '—'}</td>
                    <td className="p-2">{emp.role}</td>
                    <td className="p-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => openProfileDrawer(emp)}
                          className={`${btn} ${subtle}`}
                          aria-label={`View/Edit profile for ${emp.name}`}
                          title="Profile"
                        >
                          <UserCircle2 size={16} aria-hidden />
                          Profile
                        </button>
                        <button
                          onClick={() => editEmployee(emp)}
                          className={`${btn} ${subtle}`}
                          aria-label={`Edit ${emp.name}`}
                          title="Edit (basic)"
                        >
                          <Pencil size={16} aria-hidden />
                          Edit
                        </button>
                        <button
                          onClick={() => deleteEmployee(emp.id)}
                          className={`${btn} bg-rose-500/90 text-white`}
                          aria-label={`Delete ${emp.name}`}
                          title="Delete"
                        >
                          <Trash2 size={16} aria-hidden />
                          Delete
                        </button>
                        <button
                          onClick={() => openResetModal(emp)}
                          className={`${btn} bg-indigo-600 text-white`}
                          aria-label={`Reset password for ${emp.name}`}
                          title="Reset Password"
                        >
                          <KeyRound size={16} aria-hidden />
                          Reset
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

      {/* Reset Password Modal */}
      {showResetModal && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Reset Password Modal"
        >
          <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/80 p-6 shadow-2xl backdrop-blur-xl">
            <h4 className="mb-1 text-lg font-extrabold">
              Reset Password for {selectedEmp?.name}
            </h4>
            <p className="mb-4 text-sm text-gray-700">
              Enter a new password (user can change later).
            </p>

            <div className="space-y-3">
              <div className="relative">
                <input
                  type={showResetPass ? 'text' : 'password'}
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/30 bg-white/70 px-3 py-2 pr-10 shadow-sm outline-none backdrop-blur-md focus:ring-2 focus:ring-indigo-300"
                />
                <button
                  type="button"
                  onClick={() => setShowResetPass((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-600 hover:bg-white/60"
                  aria-label={showResetPass ? 'Hide password' : 'Show password'}
                >
                  {showResetPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <input
                type={showResetPass ? 'text' : 'password'}
                placeholder="Confirm new password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full rounded-xl border border-white/30 bg-white/70 px-3 py-2 shadow-sm outline-none backdrop-blur-md focus:ring-2 focus:ring-indigo-300"
              />
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowResetModal(false)}
                className={`${btn} bg-white/70`}
                aria-label="Cancel password reset"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPassword}
                className={`${btn} bg-indigo-600 text-white`}
                aria-label="Confirm password reset"
              >
                <KeyRound size={16} aria-hidden />
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Role Modal */}
      {showRoleModal && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Add Role Modal"
        >
          <div className="w-full max-w-sm rounded-2xl border border-white/20 bg-white/90 p-5 shadow-2xl backdrop-blur">
            <h4 className="mb-3 text-lg font-extrabold">Create Role</h4>
            <input
              type="text"
              placeholder="e.g. Manager"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="mb-3 w-full rounded-xl border border-white/30 bg-white/70 px-3 py-2 shadow-sm outline-none backdrop-blur-md focus:ring-2 focus:ring-emerald-300"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowRoleModal(false)}
                className={`${btn} bg-white/70`}
              >
                Cancel
              </button>
              <button onClick={createRole} className={`${btn} ${primary}`}>
                Add Role
              </button>
            </div>
            <p className="mt-3 text-xs text-slate-600">
              If this fails, your <code>users.role</code> has a CHECK for
              Employee/Admin only.
            </p>
          </div>
        </div>
      )}

      {/* Profile Drawer (slide-in) */}
      <div
        className={`fixed inset-0 z-50 ${drawerOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        aria-hidden={!drawerOpen}
      >
        {/* Backdrop */}
        <div
          onClick={() => setDrawerOpen(false)}
          className={`absolute inset-0 bg-black/40 transition-opacity ${drawerOpen ? 'opacity-100' : 'opacity-0'}`}
        />
        {/* Panel */}
        <aside
          className={`absolute right-0 top-0 h-full w-full max-w-md transform bg-white shadow-2xl transition-transform duration-300 ease-out
          ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-400 via-cyan-400 to-blue-500" />
              <div className="text-sm font-bold tracking-tight">
                {drawerUser?.name || 'Profile'}
              </div>
            </div>
            <button
              onClick={() => setDrawerOpen(false)}
              className="rounded-lg px-2 py-1 text-slate-700 hover:bg-slate-100"
            >
              Close
            </button>
          </div>

          <div className="h-[calc(100%-52px)] overflow-y-auto px-4 py-4">
            {drawerLoading ? (
              <p className="text-sm text-gray-600">Loading profile…</p>
            ) : (
              <>
                {/* Avatar */}
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-16 w-16 overflow-hidden rounded-full bg-gradient-to-br from-emerald-200 to-cyan-200 ring-2 ring-white/60">
                    {drawerAvatarPreview ? (
                      <img
                        src={drawerAvatarPreview}
                        alt="Avatar"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-emerald-900/70">
                        {(drawerUser?.name || 'SC')
                          .split(' ')
                          .map((s) => s[0])
                          .join('')
                          .toUpperCase()}
                      </div>
                    )}
                  </div>
                  <label className="cursor-pointer rounded-xl border border-white/30 bg-white px-3 py-2 text-sm shadow-sm hover:bg-white/80">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={onDrawerAvatarChange}
                      className="hidden"
                    />
                    Change Avatar
                  </label>
                </div>

                {/* Profile form */}
                <div className="grid grid-cols-1 gap-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <input
                      type="text"
                      placeholder="First Name"
                      value={profile.first_name}
                      onChange={(e) =>
                        setProfile({ ...profile, first_name: e.target.value })
                      }
                      className="rounded-xl border border-slate-200 px-3 py-2"
                    />
                    <input
                      type="text"
                      placeholder="Middle Name"
                      value={profile.middle_name}
                      onChange={(e) =>
                        setProfile({ ...profile, middle_name: e.target.value })
                      }
                      className="rounded-xl border border-slate-200 px-3 py-2"
                    />
                    <input
                      type="text"
                      placeholder="Last Name"
                      value={profile.last_name}
                      onChange={(e) =>
                        setProfile({ ...profile, last_name: e.target.value })
                      }
                      className="rounded-xl border border-slate-200 px-3 py-2"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <input
                      type="date"
                      placeholder="DOB"
                      value={profile.dob}
                      onChange={(e) =>
                        setProfile({ ...profile, dob: e.target.value })
                      }
                      className="rounded-xl border border-slate-200 px-3 py-2"
                    />
                    <input
                      type="tel"
                      placeholder="Mobile"
                      value={profile.mobile}
                      onChange={(e) =>
                        setProfile({ ...profile, mobile: e.target.value })
                      }
                      className="rounded-xl border border-slate-200 px-3 py-2"
                    />
                  </div>

                  <input
                    type="text"
                    placeholder="Address"
                    value={profile.address}
                    onChange={(e) =>
                      setProfile({ ...profile, address: e.target.value })
                    }
                    className="rounded-xl border border-slate-200 px-3 py-2"
                  />

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setDrawerOpen(false)}
                      className="rounded-xl bg-slate-100 px-4 py-2 font-semibold hover:bg-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveProfileFromDrawer}
                      disabled={drawerLoading}
                      className="rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700"
                    >
                      {drawerLoading ? 'Saving…' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </aside>
      </div>
    </section>
  )
}

/**
 * Small helper component that renders avatar next to a user's name
 */
function EmployeeNameWithAvatar({ userId, name }) {
  const [url, setUrl] = useState(null)

  useEffect(() => {
    let ignore = false
    ;(async () => {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('avatar_url')
          .eq('user_id', userId)
          .maybeSingle()
        if (!ignore && !error) setUrl(data?.avatar_url || null)
      } catch {}
    })()
    return () => {
      ignore = true
    }
  }, [userId])

  const initials =
    name
      ?.split(' ')
      .filter(Boolean)
      .map((s) => s[0]?.toUpperCase())
      .slice(0, 2)
      .join('') || 'SC'

  return (
    <div className="flex items-center gap-2">
      <div className="h-8 w-8 overflow-hidden rounded-full bg-gradient-to-br from-emerald-200 to-cyan-200 ring-1 ring-white/60">
        {url ? (
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-emerald-900/70">
            {initials}
          </div>
        )}
      </div>
      <span>{name}</span>
    </div>
  )
}
