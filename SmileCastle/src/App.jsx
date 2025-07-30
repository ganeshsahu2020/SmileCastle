import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import StoreLogin from './components/StoreLogin'
import EmployeeLogin from './components/EmployeeLogin'
import EmployeePanel from './components/EmployeePanel'
import AdminLayout from './components/admin/AdminLayout'
import EmployeeManagement from './components/admin/EmployeeManagement'
import PunchHistory from './components/admin/PunchHistory'
import PunchRequests from './components/admin/PunchRequests'
import Reports from './components/admin/Reports'
import PasswordRequests from './components/admin/PasswordRequests'

function App() {
  const { storeAuthenticated, user } = useAuth()

  console.log('🔄 Store Authenticated:', storeAuthenticated)
  console.log('🔄 Current User:', user)

  // ✅ Step 1: Store password gate
  if (!storeAuthenticated) {
    return <StoreLogin />
  }

  // ✅ Step 2: Employee login gate
  if (!user) {
    return <EmployeeLogin />
  }

  return (
    <Routes>
      {/* ✅ Employee Routes */}
      {user?.role === 'Employee' && (
        <>
          <Route path="/" element={<EmployeePanel />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      )}

      {/* ✅ Admin Routes */}
      {user?.role === 'Admin' && (
        <>
          <Route path="/admin/*" element={<AdminLayout />}>
            <Route path="employees" element={<EmployeeManagement />} />
            <Route path="punch-history" element={<PunchHistory />} />
            <Route path="punch-requests" element={<PunchRequests />} />
            <Route path="reports" element={<Reports />} />

            {/* ✅ Protected Password Requests Route */}
            <Route
              path="password-requests"
              element={
                user?.role === 'Admin' ? (
                  <PasswordRequests />
                ) : (
                  <Navigate to="/admin/employees" replace />
                )
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/admin/employees" replace />} />
        </>
      )}
    </Routes>
  )
}

export default App
