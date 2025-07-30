import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabaseClient'

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState([])
  const [form, setForm] = useState({ employee_id: '', name: '', email: '', role: 'Employee', password: '' })
  const [editing, setEditing] = useState(null)
  const [searchName, setSearchName] = useState('')
  const [loading, setLoading] = useState(false)

  // ✅ Reset Password Modal
  const [showResetModal, setShowResetModal] = useState(false)
  const [selectedEmp, setSelectedEmp] = useState(null)
  const [newPassword, setNewPassword] = useState('')

  // ✅ Load Employees
  const loadEmployees = async () => {
    setLoading(true)
    const { data } = await supabase.from('users').select('*').order('created_at', { ascending: true })
    if (data) setEmployees(data)
    setLoading(false)
  }

  useEffect(() => { loadEmployees() }, [])

  // ✅ Save Employee (Add or Update)
  const saveEmployee = async (e) => {
    e.preventDefault()
    if (editing) {
      await supabase.from('users').update({
        name: form.name,
        email: form.email,
        role: form.role
      }).eq('id', editing)
      setEditing(null)
    } else {
      await supabase.from('users').insert([{
        employee_id: form.employee_id,
        name: form.name,
        email: form.email,
        role: form.role,
        password_hash: form.password,
        password_last_changed: new Date().toISOString()
      }])
    }
    setForm({ employee_id: '', name: '', email: '', role: 'Employee', password: '' })
    loadEmployees()
  }

  const editEmployee = (emp) => {
    setEditing(emp.id)
    setForm({ employee_id: emp.employee_id, name: emp.name, email: emp.email, role: emp.role, password: '' })
  }

  const deleteEmployee = async (id) => {
    if (!confirm('Delete this employee?')) return
    await supabase.from('users').delete().eq('id', id)
    loadEmployees()
  }

  // ✅ Open Reset Password Modal
  const openResetModal = (emp) => {
    setSelectedEmp(emp)
    setNewPassword('')
    setShowResetModal(true)
  }

  // ✅ Handle Reset Password
  const handleResetPassword = async () => {
    if (!newPassword.trim()) return alert('Enter a new password')

    const { error } = await supabase.from('users')
      .update({ password_hash: newPassword, password_last_changed: new Date().toISOString() })
      .eq('id', selectedEmp.id)

    if (error) {
      alert('Password reset failed: ' + error.message)
    } else {
      alert(`✅ Password reset for ${selectedEmp.name}`)
      setShowResetModal(false)
      setSelectedEmp(null)
      loadEmployees()
    }
  }

  const filteredEmployees = employees.filter(emp => emp.name.toLowerCase().includes(searchName.toLowerCase()))

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4 text-blue-600">Employee Management</h2>

      {/* ✅ Search */}
      <input
        type="text"
        placeholder="Search by name..."
        value={searchName}
        onChange={(e) => setSearchName(e.target.value)}
        className="mb-4 p-2 border rounded w-full max-w-xs"
      />

      {/* ✅ Add/Edit Employee */}
      <div className="p-4 bg-white rounded shadow mb-6">
        <h3 className="text-lg font-semibold mb-3">{editing ? 'Edit Employee' : 'Add Employee'}</h3>
        <form onSubmit={saveEmployee} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {!editing && (
            <input
              type="text"
              placeholder="Employee ID"
              value={form.employee_id}
              onChange={(e) => setForm({ ...form, employee_id: e.target.value })}
              className="p-2 border rounded"
              required
            />
          )}
          <input
            type="text"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="p-2 border rounded"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="p-2 border rounded"
          />
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="p-2 border rounded"
          >
            <option>Employee</option>
            <option>Admin</option>
          </select>
          {!editing && (
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="p-2 border rounded"
              required
            />
          )}
          <button className="col-span-1 sm:col-span-2 bg-blue-600 text-white py-2 rounded">
            {editing ? 'Update Employee' : 'Add Employee'}
          </button>
        </form>
      </div>

      {/* ✅ Employee Table */}
      <div className="p-4 bg-white rounded shadow">
        <h3 className="text-lg font-semibold mb-3">Employee List</h3>
        {loading ? (
          <p>Loading employees...</p>
        ) : filteredEmployees.length === 0 ? (
          <p className="text-gray-500">No employees found</p>
        ) : (
          <table className="w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">ID</th>
                <th className="p-2 border">Name</th>
                <th className="p-2 border">Email</th>
                <th className="p-2 border">Role</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map(emp => (
                <tr key={emp.id} className="border-b">
                  <td className="p-2 border">{emp.employee_id}</td>
                  <td className="p-2 border">{emp.name}</td>
                  <td className="p-2 border">{emp.email}</td>
                  <td className="p-2 border">{emp.role}</td>
                  <td className="p-2 border flex gap-2">
                    <button onClick={() => editEmployee(emp)} className="bg-yellow-400 px-2 rounded">Edit</button>
                    <button onClick={() => deleteEmployee(emp.id)} className="bg-red-500 text-white px-2 rounded">Delete</button>
                    <button onClick={() => openResetModal(emp)} className="bg-purple-500 text-white px-2 rounded">Reset Password</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ✅ Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <h3 className="text-lg font-bold mb-3">Reset Password for {selectedEmp.name}</h3>
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="border p-2 rounded w-full mb-3"
            />
            <button onClick={handleResetPassword} className="bg-green-600 text-white px-4 py-2 rounded w-full mb-2">
              Confirm Reset
            </button>
            <button onClick={() => setShowResetModal(false)} className="bg-gray-500 text-white px-4 py-2 rounded w-full">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
