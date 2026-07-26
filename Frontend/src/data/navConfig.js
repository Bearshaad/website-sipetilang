import { Store, Ticket, BarChart3, UserPlus } from 'lucide-react'

export const navItems = [
  { to: '/penjualan', label: 'Penjualan', icon: Store, allowedRoles: ['petugas'] },
  { to: '/tiket', label: 'Tiket', icon: Ticket, allowedRoles: ['petugas'] },
  { to: '/laporan', label: 'Laporan', icon: BarChart3, allowedRoles: ['petugas', 'owner'] },
  { to: '/akun', label: 'Akun', icon: UserPlus, allowedRoles: ['owner'] },
]
