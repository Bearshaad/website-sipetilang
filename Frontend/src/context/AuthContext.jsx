import { createContext, useContext, useEffect, useState } from 'react'
import { loginRequest, logoutRequest } from '../services/authService'

const AuthContext = createContext(null)
const STORAGE_KEY = 'sipetilang_auth'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Muat sesi yang tersimpan (agar user tidak perlu login ulang tiap refresh)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        setUser(JSON.parse(saved))
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    setIsLoading(false)
  }, [])

  async function login(username, password) {
    const { token, user: loggedInUser } = await loginRequest(username, password)
    const session = { ...loggedInUser, token }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    setUser(session)
    return session
  }

  // Session berakhir saat logout
  async function logout() {
    await logoutRequest()
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
}

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    role: user?.role ?? null,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth harus dipakai di dalam <AuthProvider>')
  return ctx
}
