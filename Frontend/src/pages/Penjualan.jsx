import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Topbar from '../components/layout/Topbar'
import TicketCard from '../components/ui/TicketCard'
import CartItemRow from '../components/ui/CartItemRow'
import { useTransaction } from '../context/TransactionContext'
import { useTicketCatalog } from '../context/TicketCatalogContext'
import { searchTickets } from '../services/ticketService'
import { formatRupiah } from '../utils/currency'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext.jsx'

export default function Penjualan() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const {
    browsedTicketIds,
    cart,
    subtotal,
    pajak,
    total,
    browseTicket,
    addToCart,
    changeQty,
    clearTransaction,
    createTransaction,
  } = useTransaction()
  const { activeTickets } = useTicketCatalog()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)

  // Cari tiket setiap kali query berubah (fitur pencarian tiket)
  useEffect(() => {
    let active = true
    searchTickets(query).then((res) => {
      if (active) setResults(res)
    })
    return () => {
      active = false
    }
  }, [query])

  // Kartu yang tampil di area utama = riwayat tiket yang pernah dicari, TAPI
  // disaring ulang dari katalog aktif setiap render. Jadi begitu sebuah tiket
  // dinonaktifkan lewat halaman Kelola Tiket, kartunya otomatis hilang dari
  // sini tanpa harus mencari ulang.
  const browsedTickets = useMemo(
    () => browsedTicketIds.map((id) => activeTickets.find((t) => t.id === id)).filter(Boolean),
    [browsedTicketIds, activeTickets]
  )

  function handleSelectFromDropdown(ticket) {
    browseTicket(ticket)
    setQuery('')
    setResults([])
    setShowDropdown(false)
  }

  const { user } = useAuth()
  async function handleBuatTransaksi() {
    try {
        await createTransaction(user.id)
        navigate('/penjualan/transaksi')
    } catch (error) {
        showToast(error.response?.data?.message || 'Gagal membuat transaksi', 'error')
    }
}

    return (
    <>
      <Topbar
        searchPlaceholder="Cari Tiket"
        searchValue={query}
        onSearchChange={(val) => {
          setQuery(val)
          setShowDropdown(true)
        }}
        searchDropdown={
          showDropdown && query.trim() ? (
            <div className="max-h-72 overflow-y-auto">
              {results.length === 0 ? (
                <p className="px-4 py-3 text-sm text-slate-400">
                  Tiket tidak ditemukan
                </p>
              ) : (
                results.map((ticket) => (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => handleSelectFromDropdown(ticket)}
                    className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm hover:bg-primary-50"
                  >
                    <span className="font-medium text-slate-800">{ticket.nama}</span>
                    <span className="text-slate-400">{formatRupiah(ticket.harga)}</span>
                  </button>
                ))
              )}
            </div>
          ) : null
        }
      />

      <main
        className="flex flex-1 flex-col gap-4 overflow-y-auto p-3 sm:p-6 lg:flex-row lg:gap-6 lg:overflow-hidden"
        onClick={() => setShowDropdown(false)}
      >
        {/* Area utama: riwayat kartu tiket yang pernah dicari */}
        <section className="flex-1 lg:overflow-y-auto">
          {browsedTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 lg:h-full">
              <p className="text-lg font-medium text-slate-500">Belum ada tiket dicari</p>
              <p className="mt-1 text-sm">
                Gunakan kolom "Cari Tiket" di atas untuk menampilkan pilihan tiket
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-5 sm:justify-start">
              {browsedTickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} onSelect={addToCart} />
              ))}
            </div>
          )}
        </section>

        {/* Panel Transaksi Baru */}
        <section className="flex w-full flex-col rounded-2xl border border-slate-200 bg-white shadow-card lg:w-96 lg:shrink-0">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <h2 className="text-xl font-bold text-slate-900">Transaksi Baru</h2>
            <button
              type="button"
              onClick={clearTransaction}
              disabled={cart.length === 0}
              className="text-sm font-semibold text-red-500 hover:underline disabled:opacity-40 disabled:hover:no-underline"
            >
              Bersihkan
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center px-4 text-center">
                <p className="font-bold text-slate-800">Belum ada tiket terpilih</p>
                <p className="mt-2 text-sm text-slate-400">
                  Silahkan pilih tiket disebelah kiri atau cari tiket untuk memulai transaksi
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <CartItemRow key={item.ticket.id} item={item} onChangeQty={changeQty} />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2 border-t border-slate-200 px-6 py-5">
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>Subtotal</span>
              <span>{formatRupiah(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>Pajak</span>
              <span>{formatRupiah(pajak)}</span>
            </div>
            <div className="flex items-center justify-between pt-2 text-lg font-bold text-slate-900">
              <span>Total</span>
              <span className="text-primary-700">{formatRupiah(total)}</span>
            </div>
          </div>

          <div className="px-6 pb-6">
            <button
              type="button"
              onClick={handleBuatTransaksi}
              disabled={cart.length === 0}
              className="btn-primary w-full"
            >
              Buat Transaksi
            </button>
          </div>
        </section>
      </main>
    </>
  )
}
