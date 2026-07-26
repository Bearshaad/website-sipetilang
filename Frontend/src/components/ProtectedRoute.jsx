import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, isLoading, role } = useAuth()

  if (isLoading) return null // bisa diganti spinner nanti

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect ke halaman default masing-masing role, supaya tidak nyasar
    // ke halaman yang juga tidak diizinkan.
    return <Navigate to={role === 'owner' ? '/akun' : '/penjualan'} replace />
  }

  return children
}
