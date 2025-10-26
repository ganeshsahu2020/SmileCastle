// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'

import StoreLogin from './components/StoreLogin'
import EmployeeLogin from './components/EmployeeLogin'
import EmployeePanel from './components/EmployeePanel'

// NOTE: matches src/components/Admin/AdminLayout.jsx (capital Admin)
import AdminLayout from './components/Admin/AdminLayout'
import EmployeeManagement from './components/admin/EmployeeManagement'
import PunchHistory from './components/admin/PunchHistory'
import PunchRequests from './components/admin/PunchRequests'
import Reports from './components/admin/Reports'
import PasswordRequests from './components/admin/PasswordRequests'

// 🆕 Chat page (common room + DMs)
import ChatPage from './pages/ChatPage'

function App() {
  const { storeAuthenticated, user } = useAuth()

  // Gate 1: Store password
  if (!storeAuthenticated) return <StoreLogin />

  // Gate 2: Employee login
  if (!user) return <EmployeeLogin />

  return (
    <Routes>
      {/* 🆕 Chat is available to any authenticated user (Employee or Admin) */}
      <Route path="/chat" element={<ChatPage />} />

      {/* Employee-only routes */}
      {user?.role === 'Employee' && (
        <>
          <Route path="/" element={<EmployeePanel />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      )}

      {/* Admin-only routes */}
      {user?.role === 'Admin' && (
        <>
          <Route path="/admin/*" element={<AdminLayout />}>
            <Route path="employees" element={<EmployeeManagement />} />
            <Route path="punch-history" element={<PunchHistory />} />
            <Route path="punch-requests" element={<PunchRequests />} />
            <Route path="reports" element={<Reports />} />
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

          {/* Default fallback for admins */}
          <Route path="*" element={<Navigate to="/admin/employees" replace />} />
        </>
      )}
    </Routes>
  )
}

export default App
