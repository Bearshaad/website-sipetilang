import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Popup({ isOpen, onClose, children }) {
  // Tutup popup dengan tombol Escape
  useEffect(() => {
    if (!isOpen) return
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])
  
  useEffect(() => {
    if (!isOpen) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isOpen])
  
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="hide-scrollbar relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-surface p-5 shadow-xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 sm:right-6 sm:top-6"
          aria-label="Tutup"
        >
          <X size={20} />
        </button>
        {children}
      </div>
    </div>
  )
}
