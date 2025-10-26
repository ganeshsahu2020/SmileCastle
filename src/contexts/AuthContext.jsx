import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext()
const STORE_PASSWORD = 'STORE123'

export const AuthProvider = ({ children }) => {
  const [storeAuthenticated, setStoreAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  // ✅ Load session from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("user")
    const savedStoreAuth = localStorage.getItem("storeAuthenticated") === "true"
    if (savedUser) setUser(JSON.parse(savedUser))
    if (savedStoreAuth) setStoreAuthenticated(true)
  }, [])

  const verifyStorePassword = (password) => {
    if (password === STORE_PASSWORD) {
      setStoreAuthenticated(true)
      localStorage.setItem("storeAuthenticated", "true")
      return true
    }
    return false
  }

  const loginUser = (userData) => {
    console.log('✅ Setting user:', userData)
    setUser(userData)
    localStorage.setItem("user", JSON.stringify(userData))
  }

  const logoutUser = () => {
    console.log("🔴 Logging out user...")
    setUser(null)
    setStoreAuthenticated(false)
    localStorage.removeItem("user")
    localStorage.removeItem("storeAuthenticated")
    navigate("/")  // ✅ Auto-redirect to StoreLogin
  }

  return (
    <AuthContext.Provider value={{ storeAuthenticated, verifyStorePassword, user, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
