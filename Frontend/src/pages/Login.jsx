import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, User, Lock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/ui/Logo'
import bgLogin from '../assets/bgLogin.jpg'
import { Navigate } from 'react-router-dom'

export default function Login() {
  const { login, isAuthenticated, role } = useAuth()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

    if (isAuthenticated) {
      return <Navigate to={role === 'owner' ? '/akun' : '/penjualan'} replace />
    }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!username.trim() || !password) {
      setError('Username dan password wajib diisi')
      return
    }

    setIsSubmitting(true)
    try {
      const session = await login(username.trim(), password)

      const redirectTo = session.role === 'owner' ? '/akun' : '/penjualan'

      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan, silakan coba lagi')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-primary-100 px-4 py-10">
      {/* 1. GAMBAR LATAR BELAKANG */}
      <img
        src={bgLogin}
        alt="Latar Belakang Kolam Renang"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-50"
      />

      {/* 2. LAPISAN BLUR / OVERLAY (Opsional) */}
      <div className="pointer-events-none absolute inset-0 bg-slate-950/20 backdrop-blur-sm" aria-hidden="true" />


      <div className="relative z-10 w-full max-w-md rounded-3xl bg-white p-8 shadow-xl sm:p-10">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          SELAMAT DATANG
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Silahkan masuk sebagai owner atau petugas loket
        </p>

        <form onSubmit={handleSubmit} className="mt-10 space-y-5">
          <div>
            <label htmlFor="username" className="form-label">
              Username
            </label>
            <div className="relative">
              <User
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                id="username"
                type="text"
                autoComplete="username"
                placeholder="Masukan username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="form-input pl-11"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <div className="relative">
              <Lock
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Masukan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input pl-11 pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" className="text-sm font-medium text-red-600">
              {error}
            </p>
          )}

          <button type="submit" disabled={isSubmitting} className="btn-primary w-full !py-3.5 text-base">
            {isSubmitting ? 'Memproses...' : 'Login'}
          </button>
        </form>

        <div className="mt-10 flex flex-col items-center gap-4 border-t border-slate-100 pt-6">
          <Logo size={28} />
        </div>
      </div>
    </div>
  )
}
