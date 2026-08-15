import { createContext, useContext, useEffect, useState } from 'react'
import { loginRequest, logoutRequest, heartbeatRequest } from '../services/authService'

const AuthContext = createContext(null)
const STORAGE_KEY = 'sipetilang_auth'
const HEARTBEAT_INTERVAL_MS = 2 * 60 * 1000

function isTokenExpired(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        return payload.exp * 1000 < Date.now()
    } catch {
        return true
    }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Muat sesi yang tersimpan (agar user tidak perlu login ulang tiap refresh)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const session = JSON.parse(saved)
        if (session.token && !isTokenExpired(session.token)) {
          setUser(session)
        } else {
          localStorage.removeItem(STORAGE_KEY)
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (!user || user.role !== 'petugas') return

    const interval = setInterval(() => {
      heartbeatRequest()
    }, HEARTBEAT_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [user])

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