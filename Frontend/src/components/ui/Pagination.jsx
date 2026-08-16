import { ChevronLeft, ChevronRight } from 'lucide-react'

// Hasilkan daftar nomor halaman yang mau ditampilkan, dengan "..." untuk
// mewakili rentang yang dilewati. Selalu tampilkan halaman pertama, terakhir,
// dan beberapa halaman di sekitar halaman yang sedang aktif.
function getPageNumbers(page, totalPages) {
  const delta = 1
  const range = []
  const withDots = []
  let last

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
      range.push(i)
    }
  }

  range.forEach((i) => {
    if (last) {
      if (i - last === 2) {
        withDots.push(last + 1)
      } else if (i - last > 2) {
        withDots.push('...')
      }
    }
    withDots.push(i)
    last = i
  })

  return withDots
}

export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  const pages = getPageNumbers(page, totalPages)

  return (
    <div className="flex items-center justify-center gap-2 py-6">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
        aria-label="Halaman sebelumnya"
      >
        <ChevronLeft size={16} />
      </button>

      {pages.map((p, idx) =>
        p === '...' ? (
          <span key={`dots-${idx}`} className="flex h-9 w-9 items-center justify-center text-sm text-slate-400">
            ...
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-medium transition ${
              p === page
                ? 'border-primary-700 bg-primary-700 text-white'
                : 'border-slate-300 text-slate-500 hover:bg-slate-50'
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
        aria-label="Halaman berikutnya"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}