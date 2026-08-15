import { useEffect, useMemo, useState } from 'react'
import { Pencil } from 'lucide-react'
import Topbar from '../components/layout/Topbar'
import Pagination from '../components/ui/Pagination'
import PetugasFormPopup from '../components/petugas/PetugasFormPopup'
import {
  getPetugas,
  createPetugas,
  updatePetugas,
} from '../services/petugasService'

const PAGE_SIZE = 5

export default function Akun() {
  const [petugasList, setPetugasList] = useState([])
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [popupState, setPopupState] = useState({ isOpen: false, mode: 'add', petugas: null })

  useEffect(() => {
    function fetchPetugas() {
      getPetugas().then(setPetugasList)
    }

    fetchPetugas()
    const interval = setInterval(fetchPetugas, 30000)
    return () => clearInterval(interval)
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return petugasList
    return petugasList.filter(
      (p) => p.nama.toLowerCase().includes(q) || p.username.toLowerCase().includes(q)
    )
  }, [petugasList, query])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  const totalPetugas = petugasList.length
  const aktifSekarang = petugasList.filter((p) => p.active && p.online).length

  function openAddPopup() {
    setPopupState({ isOpen: true, mode: 'add', petugas: null })
  }

  function openEditPopup(petugas) {
    setPopupState({ isOpen: true, mode: 'edit', petugas })
  }

  function closePopup() {
    setPopupState((s) => ({ ...s, isOpen: false }))
  }

  async function handleSubmit(data) {
    if (popupState.mode === 'edit') {
      await updatePetugas(popupState.petugas.id, data)
    } else {
      await createPetugas(data)
      setPage(1)
    }
    const refreshed = await getPetugas()
    setPetugasList(refreshed)
  }

  function statusBadge(petugas) {
    if (!petugas.active) {
      return <span className="rounded-full border border-red-400 px-3 py-1 text-xs font-semibold text-red-500">Inactive</span>
    }
    if (petugas.online) {
      return <span className="rounded-full bg-green-500 px-3 py-1 text-xs font-semibold text-white">Online</span>
    }
    return <span className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-400">offline</span>
  }

  return (
    <>
      <Topbar
        searchPlaceholder="Cari Petugas"
        searchValue={query}
        onSearchChange={(val) => {
          setQuery(val)
          setPage(1)
        }}
        rightSlot={
          <button type="button" onClick={openAddPopup} className="btn-primary !px-5 !py-2.5">
            Tambah Petugas
          </button>
        }
      />

      <main className="flex-1 space-y-4 overflow-y-auto p-3 sm:space-y-6 sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-card sm:p-6">
            <h3 className="text-lg font-bold text-slate-900">Total Petugas</h3>
            <p className="mt-2 text-4xl font-extrabold text-primary-700">{totalPetugas}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-card sm:p-6">
            <h3 className="text-lg font-bold text-slate-900">Aktif Sekarang</h3>
            <p className="mt-2 text-4xl font-extrabold text-primary-700">{aktifSekarang}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-card">
          <h2 className="border-b border-slate-100 p-4 text-center text-xl font-bold text-slate-900 sm:p-6">
            Kelola Data Master
          </h2>

          <div className="overflow-x-auto px-3 sm:px-6">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="text-slate-400">
                  <th className="py-3 font-medium">Petugas</th>
                  <th className="py-3 font-medium">Username</th>
                  <th className="py-3 font-medium">Status</th>
                  <th className="py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-slate-400">
                      Belum ada petugas. Klik "Tambah Petugas" untuk menambahkan.
                    </td>
                  </tr>
                ) : (
                  pageItems.map((petugas) => (
                    <tr key={petugas.id} className="border-t border-slate-50">
                      <td className="py-4 pr-4 font-semibold text-slate-900">{petugas.nama}</td>
                      <td className="py-4 pr-4 text-slate-500">{petugas.username}</td>
                      <td className="py-4 pr-4">{statusBadge(petugas)}</td>
                      <td className="py-4">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => openEditPopup(petugas)}
                            className="text-slate-400 hover:text-primary-700"
                            aria-label={`Edit ${petugas.nama}`}
                          >
                            <Pencil size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </main>

      <PetugasFormPopup
        isOpen={popupState.isOpen}
        mode={popupState.mode}
        petugas={popupState.petugas}
        onClose={closePopup}
        onSubmit={handleSubmit}
      />
    </>
  )
}
