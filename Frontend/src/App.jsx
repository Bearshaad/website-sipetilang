import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Penjualan from './pages/Penjualan'
import DetailTransaksi from './pages/DetailTransaksi'
import KelolaTiket from './pages/KelolaTiket'
import LaporanPenjualan from './pages/LaporanPenjualan'
import Akun from './pages/Akun'
import AppLayout from './components/layout/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'
import ValidasiTiket from "./pages/ValidasiTiket"

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/validasi-tiket" element={<ValidasiTiket />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route
          path="/penjualan"
          element={
            <ProtectedRoute allowedRoles={['petugas']}>
              <Penjualan />
            </ProtectedRoute>
          }
        />
        <Route
          path="/penjualan/transaksi"
          element={
            <ProtectedRoute allowedRoles={['petugas']}>
              <DetailTransaksi />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tiket"
          element={
            <ProtectedRoute allowedRoles={['petugas']}>
              <KelolaTiket />
            </ProtectedRoute>
          }
        />
        <Route path="/laporan" element={<Navigate to="/laporan/daily" replace />} />
        <Route
          path="/laporan/:period"
          element={
            <ProtectedRoute allowedRoles={['petugas', 'owner']}>
              <LaporanPenjualan />
            </ProtectedRoute>
          }
        />
        <Route
          path="/akun"
          element={
            <ProtectedRoute allowedRoles={['owner']}>
              <Akun />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
