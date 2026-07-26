import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

//Topbar dan Footer tidak digunakan di sini karena sudah ada di masing-masing halaman (Topbar di halaman penjualan, Footer di halaman akun). Hal ini untuk menghindari duplikasi dan memastikan layout tetap konsisten sesuai kebutuhan setiap halaman.
export default function AppLayout() {
  return (
    <div className="flex h-screen bg-surface">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-y-auto pb-16 md:pb-0">
        <Outlet />
      </div>
    </div>
  )
}
