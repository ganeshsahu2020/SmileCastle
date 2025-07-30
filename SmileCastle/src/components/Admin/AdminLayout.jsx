import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function AdminLayout() {
  const { user, logoutUser } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logoutUser()
    navigate("/")   // ✅ Redirect to login page
  }

  const isAdmin = user?.role === 'Admin'

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-800 text-white flex flex-col justify-between">
        <div className="p-4">
          <h1 className="text-xl font-bold mb-6">Admin Panel</h1>
          <nav className="flex flex-col gap-2">
            <Link to="/admin/employees" className="hover:bg-gray-700 p-2 rounded">
              Employee Management
            </Link>
            <Link to="/admin/punch-history" className="hover:bg-gray-700 p-2 rounded">
              Punch History
            </Link>
            <Link to="/admin/punch-requests" className="hover:bg-gray-700 p-2 rounded">
              Punch Requests
            </Link>
            <Link to="/admin/reports" className="hover:bg-gray-700 p-2 rounded">
              Reports
            </Link>

            {/* ✅ Show only for Admins */}
            {isAdmin && (
              <Link to="/admin/password-requests" className="hover:bg-gray-700 p-2 rounded">
                Password Requests
              </Link>
            )}
          </nav>
        </div>

        {/* Logout Button */}
        <div className="p-4">
          <button 
            onClick={handleLogout} 
            className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded">
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-gray-100 p-6">
        {/* ✅ Welcome Banner */}
        <div className="bg-green-200 text-green-900 p-3 text-center font-semibold mb-4 rounded shadow">
          Welcome to the Smile Castle, {user?.name}.
        </div>

        {/* Nested Pages */}
        <Outlet />
      </main>
    </div>
  )
}
