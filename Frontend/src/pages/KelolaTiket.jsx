import { useEffect, useMemo, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import Topbar from '../components/layout/Topbar'
import Pagination from '../components/ui/Pagination'
import TicketFormPopup from '../components/tickets/TicketFormPopup'
import { useTicketCatalog } from '../context/TicketCatalogContext'
import { formatRupiah } from '../utils/currency'
import {getSalesReport} from "../services/reportService.js";
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../context/ConfirmContext'

const PAGE_SIZE = 5

export default function KelolaTiket() {
  const { tickets, activeTickets, addTicket, editTicket, removeTicket } = useTicketCatalog()
  const { showToast } = useToast()
  const confirm = useConfirm()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [popupState, setPopupState] = useState({ isOpen: false, mode: 'add', ticket: null })

  const [tiketTerjualHariIni, setTiketTerjualHariIni] = useState(0)
  useEffect(() => {
      getSalesReport('daily').then((report) => {
          setTiketTerjualHariIni(report.totalTiketTerjual)
      })
    }, [])

  const filteredTickets = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return tickets
    return tickets.filter((t) => t.nama.toLowerCase().includes(q))
  }, [tickets, query])

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / PAGE_SIZE))
  const pageItems = filteredTickets.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  function openAddPopup() {
    setPopupState({ isOpen: true, mode: 'add', ticket: null })
  }

  function openEditPopup(ticket) {
    setPopupState({ isOpen: true, mode: 'edit', ticket })
  }

  function closePopup() {
    setPopupState((s) => ({ ...s, isOpen: false }))
  }

  async function handleSubmit(data) {
    if (popupState.mode === 'edit') {
      await editTicket(popupState.ticket.id, data)
    } else {
      await addTicket(data)
      setPage(1)
    }
  }

  async function handleDelete(ticket) {
      const confirmed = await confirm({
        title: 'Hapus tiket ini?',
        description: `Tiket "${ticket.nama}" akan dihapus secara permanen dan tidak dapat dikembalikan.`,
      })

      if (!confirmed) return
      try {
          await removeTicket(ticket.id)
          showToast('Tiket berhasil dihapus', 'success')
      } catch (error) {
          showToast(error.response?.data?.message || 'Gagal menghapus tiket', 'error')
      }
    }

  return (
    <>
      <Topbar
        searchPlaceholder="Cari Tiket"
        searchValue={query}
        onSearchChange={(val) => {
          setQuery(val)
          setPage(1)
        }}
        rightSlot={
          <button type="button" onClick={openAddPopup} className="btn-primary !px-5 !py-2.5">
            Tambah
          </button>
        }
      />

      <main className="flex-1 space-y-4 overflow-y-auto p-3 sm:space-y-6 sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-card sm:p-6">
            <h3 className="text-lg font-bold text-slate-900">Jumlah Tiket</h3>
            <p className="mt-2 text-4xl font-extrabold text-primary-700">
              {String(activeTickets.length).padStart(2, '0')}
            </p>
            <p className="mt-2 text-sm text-slate-400">Tiket yang dapat dibeli hari ini</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-card sm:p-6">
            <h3 className="text-lg font-bold text-slate-900">Tiket Terjual</h3>
            <p className="mt-2 text-4xl font-extrabold text-primary-700">
              {tiketTerjualHariIni}
            </p>
            <p className="mt-2 text-sm text-slate-400">Tiket yang terjual hari ini</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-card">
          <h2 className="border-b border-slate-100 p-4 text-center text-xl font-bold text-slate-900 sm:p-6">
            Kelola Tiket
          </h2>

          <div className="overflow-x-auto px-3 sm:px-6">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="text-slate-400">
                  <th className="py-3 font-medium">Nama Tiket</th>
                  <th className="py-3 font-medium">Deskripsi</th>
                  <th className="py-3 font-medium">Harga</th>
                  <th className="py-3 font-medium">Status</th>
                  <th className="py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-400">
                      Belum ada tiket. Klik "Tambah" untuk membuat tiket baru.
                    </td>
                  </tr>
                ) : (
                  pageItems.map((ticket) => (
                    <tr key={ticket.id} className="border-t border-slate-50">
                      <td className="max-w-[200px] truncate py-4 pr-4 font-semibold text-slate-900">
                        {ticket.nama}
                      </td>
                      <td className="max-w-[280px] py-4 pr-4 text-slate-500">
                        {ticket.deskripsi || '-'}
                      </td>
                      <td className="py-4 pr-4 font-medium text-primary-700">
                        {formatRupiah(ticket.harga)}
                      </td>
                      <td className="py-4 pr-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            ticket.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {ticket.status === 'active' ? 'Active' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => openEditPopup(ticket)}
                            className="text-slate-400 hover:text-primary-700"
                            aria-label={`Edit ${ticket.nama}`}
                          >
                            <Pencil size={18} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(ticket)}
                            className="text-slate-400 hover:text-red-500"
                            aria-label={`Hapus ${ticket.nama}`}
                          >
                            <Trash2 size={18} />
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

      <TicketFormPopup
        isOpen={popupState.isOpen}
        mode={popupState.mode}
        ticket={popupState.ticket}
        onClose={closePopup}
        onSubmit={handleSubmit}
      />
    </>
  )
}
