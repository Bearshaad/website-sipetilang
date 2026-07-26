import { Bell, HelpCircle, Search } from 'lucide-react'
import Logo from '../ui/Logo'
import { useAuth } from '../../context/AuthContext'

export default function Topbar({
  searchPlaceholder,
  searchValue,
  onSearchChange,
  searchDropdown,
  rightSlot,
}) {
  const { user } = useAuth()

  return (
    <header className="relative flex h-16 items-center gap-2 border-b border-slate-200 bg-white px-3 sm:h-20 sm:gap-4 sm:px-6">
      <Logo size={24} hideTextOnMobile className="shrink-0" />

      <div className="mx-1 hidden h-8 w-px bg-slate-200 sm:block sm:mx-2" />

      {searchPlaceholder ? (
        <div className="relative min-w-0 flex-1 sm:max-w-md">
          <Search
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 sm:left-4"
          />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-full rounded-full border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm
              placeholder:text-slate-400 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-100
              sm:py-2.5 sm:pl-11 sm:pr-4"
          />

          {/* Dropdown hasil pencarian */}
          {searchDropdown && (
            <div className="absolute left-0 top-full z-20 mt-2 w-full rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
              {searchDropdown}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1" />
      )}

      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-4">
        {rightSlot}

        <button
          className="hidden text-slate-400 hover:text-slate-600 sm:inline-flex"
          aria-label="Notifikasi"
          type="button"
        >
          <Bell size={22} strokeWidth={1.75} />
        </button>
        <button
          className="hidden text-slate-400 hover:text-slate-600 sm:inline-flex"
          aria-label="Bantuan"
          type="button"
        >
          <HelpCircle size={22} strokeWidth={1.75} />
        </button>

        <div className="hidden h-8 w-px bg-slate-200 sm:block" />

        <span className="hidden truncate text-sm font-medium text-slate-600 sm:inline">
          {user?.nama ?? 'Pengguna'}
        </span>
      </div>
    </header>
  )
}
