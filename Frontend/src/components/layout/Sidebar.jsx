import { NavLink } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import Logo from '../ui/Logo'
import { navItems } from '../../data/navConfig'
import { useAuth } from '../../context/AuthContext'


export default function Sidebar() {
  const { role, logout } = useAuth()
  const visibleItems = navItems.filter((item) => item.allowedRoles.includes(role))

  const navLinkClass = ({ isActive }) =>
    `flex flex-1 flex-col items-center gap-1 px-1 py-2 text-[11px] font-medium leading-tight transition md:w-full md:flex-none md:py-4 ${
      isActive ? 'text-primary-700' : 'text-slate-400 hover:text-slate-600'
    }`

  return (
    <>
      {/* Rail kiri: tablet & desktop */}
      <aside className="hidden h-screen w-20 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex items-center justify-center border-b border-slate-200 py-[27px]">
          <Logo size={24} showText={false} />
        </div>

        <nav className="flex flex-1 flex-col items-center gap-1 py-6">
          {visibleItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={navLinkClass}>
              <Icon size={20} strokeWidth={1.75} />
              {label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={logout}
          className="flex flex-col items-center gap-1 border-t border-slate-200 px-1 py-5 text-[11px] font-medium text-slate-400 transition hover:text-red-500"
        >
          <LogOut size={20} strokeWidth={1.75} />
          Logout
        </button>
      </aside>

      {/* Bottom nav: HP (mobile) */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {visibleItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={navLinkClass}>
            <Icon size={20} strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}
        <button
          onClick={logout}
          className="flex flex-1 flex-col items-center gap-1 px-1 py-2 text-[11px] font-medium text-slate-400 transition hover:text-red-500"
        >
          <LogOut size={20} strokeWidth={1.75} />
          Logout
        </button>
      </nav>
    </>
  )
}
