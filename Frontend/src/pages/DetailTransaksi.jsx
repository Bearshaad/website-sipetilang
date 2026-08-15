import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { CheckCircle2, Printer, ShoppingCart } from 'lucide-react'
import Topbar from '../components/layout/Topbar'
import { useTransaction } from '../context/TransactionContext'
import { formatRupiah } from '../utils/currency'
import apiClient from '../services/apiClient'
import Receipt from '../components/receipt/Receipt'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../context/ConfirmContext'

export default function DetailTransaksi() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const confirm = useConfirm()
    const {
        transactionId,
        cart,
        confirmedSubtotal: subtotal,
        confirmedPajak: pajak,
        confirmedTotal: total,
        status,
        paidAmount,
        change,
        confirmPayment,
        clearTransaction,
    } = useTransaction()

  const [bayarInput, setBayarInput] = useState('')
  const [isConfirming, setIsConfirming] = useState(false)
  const [isBatalkan, setIsBatalkan] = useState(false)

  // Jaga-jaga kalau halaman ini diakses langsung tanpa ada transaksi berjalan
  if (!transactionId) {
    return <Navigate to="/penjualan" replace />
  }

  const bayarNumber = Number(bayarInput) || 0
  const kembalianPreview = Math.max(0, bayarNumber - total)
  const isCukup = bayarNumber >= total

async function handleBatalkan() {
  const confirmed = await confirm({
    title: 'Batalkan transaksi ini?',
    description: 'Transaksi ini akan dibatalkan dan tidak dapat dipulihkan kembali.',
    details: (
      <div className="space-y-1.5 rounded-xl bg-red-50 p-3 text-sm">
        {cart.map((item) => (
          <div key={item.ticket.id} className="flex justify-between">
            <span className="text-slate-600">
              {item.ticket.nama} <span className="text-slate-400">x{item.jumlah}</span>
            </span>
            <span className="font-medium text-slate-700">
              {formatRupiah(item.ticket.harga * item.jumlah)}
            </span>
          </div>
        ))}
          <div className="flex justify-between border-t border-red-200 pt-1.5">
            <span className="text-slate-600">Total Tagihan</span>
            <span className="font-semibold text-red-600">{formatRupiah(total)}</span>
          </div>
      </div>
    ),
  })

  if (!confirmed) return

  setIsBatalkan(true)
  try {
    await apiClient.put(`/transaksi/${transactionId}/status`, {
      status_transaksi: 'Dibatalkan',
    })
    // hanya jalan kalau request di atas SUKSES
    clearTransaction()
    navigate('/penjualan')
  } catch (error) {
    showToast(error.response?.data?.message || 'Gagal membatalkan transaksi, silakan coba lagi', 'error')
  } finally {
    setIsBatalkan(false)
  }
}

async function handleKonfirmasi() {
    if (!isCukup || isConfirming) return

    const confirmed = await confirm({
      title: 'Konfirmasi pembayaran ini?',
      description: 'Pastikan jumlah bayar sudah sesuai sebelum melanjutkan.',
      details: (
        <div className="space-y-1 rounded-xl bg-slate-50 p-3 text-sm">
          <div className="flex justify-between">
              <span className="text-slate-500">Total Tagihan</span>
              <span className="font-semibold text-slate-800">{formatRupiah(total)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Jumlah Bayar</span>
            <span className="font-semibold text-slate-800">{formatRupiah(bayarNumber)}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-1">
            <span className="text-slate-500">Kembalian</span>
            <span className="font-semibold text-primary-700">{formatRupiah(kembalianPreview)}</span>
          </div>
        </div>
      ),
    })

    if (!confirmed) return

    setIsConfirming(true)
    try {
      await confirmPayment(bayarNumber)
    } finally {
      setIsConfirming(false)
    }
}

  function handleTransaksiBaru() {
    clearTransaction()
    navigate('/penjualan')
  }

  function handleCetakStruk() {
    // TODO: ganti dengan pencetakan struk fisik lewat printer, sementara masih pakai print dialog browser.
    window.print()
  }

  const isSuccess = status === 'success'

  return (
    <>
      <Topbar />

      <main className="flex flex-1 flex-col gap-4 overflow-y-auto p-3 sm:p-6 lg:flex-row lg:gap-6">
        <section className="flex-1 space-y-4 sm:space-y-6">
          {isSuccess && (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-card sm:p-8">
              <CheckCircle2 size={56} className="text-green-500" strokeWidth={1.5} />
              <h2 className="text-xl font-bold text-slate-900">Transaksi Berhasil</h2>
              <p className="max-w-md text-sm text-slate-500">
                Pembayaran telah diterima. Silakan cetak struk dan berikan tiket QR kepada pelanggan.
              </p>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-xl font-bold text-slate-900">Detail Transaksi</h2>
              <span className="text-sm text-slate-400">#{transactionId}</span>
            </div>

            <div className="mt-4">
              <div className="grid grid-cols-[1fr_44px_90px] gap-2 border-b border-slate-100 pb-3 text-sm text-slate-400 sm:grid-cols-[1fr_80px_120px] sm:gap-4">
                <span>Nama Tiket</span>
                <span className="text-center">QTY</span>
                <span className="text-right">Total</span>
              </div>

              {cart.map((item) => (
                <div
                  key={item.ticket.id}
                  className="grid grid-cols-[1fr_44px_90px] gap-2 border-b border-slate-50 py-3 sm:grid-cols-[1fr_80px_120px] sm:gap-4"
                >
                  <span className="truncate font-semibold text-slate-900">{item.ticket.nama}</span>
                  <span className="text-center text-slate-500">x{item.jumlah}</span>
                  <span className="text-right font-medium text-slate-700">
                    {formatRupiah(item.ticket.harga * item.jumlah)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>Subtotal</span>
                <span>{formatRupiah(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>Pajak</span>
                <span>{formatRupiah(pajak)}</span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="text-lg font-bold text-primary-700">Total Tagihan</span>
              <span className="text-lg font-bold text-primary-700">{formatRupiah(total)}</span>
            </div>
          </div>
        </section>

        {/* Panel pembayaran */}
        <section className="w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-6 lg:w-96 lg:shrink-0">
          <h3 className="form-label !mb-3 !text-base">Jumlah Bayar</h3>
          <input
            type="number"
            min={0}
            placeholder="Rp."
            value={isSuccess ? paidAmount : bayarInput}
            onChange={(e) => setBayarInput(e.target.value)}
            disabled={isSuccess}
            className="form-input disabled:bg-slate-50 disabled:text-slate-500"
          />

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center">
            <p className="text-sm text-slate-400">Kembalian</p>
            <p className="mt-1 text-lg font-bold text-slate-800">
              {formatRupiah(isSuccess ? change : kembalianPreview)}
            </p>
          </div>

          <div className="mt-6 space-y-3">
            {isSuccess ? (
              <>
                <button type="button" onClick={handleCetakStruk} className="btn-primary w-full">
                  <Printer size={18} /> Cetak Struk
                </button>
                <button type="button" onClick={handleTransaksiBaru} className="btn-outline-primary w-full">
                  <ShoppingCart size={18} /> Transaksi Baru
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleKonfirmasi}
                  disabled={!isCukup || isConfirming}
                  className="btn-primary w-full"
                >
                  {isConfirming ? 'Memproses...' : 'Konfirmasi'}
                </button>
                <button
                  type="button"
                  onClick={handleBatalkan}
                  disabled={isBatalkan}
                  className="btn-outline-danger w-full"
                >
                  {isBatalkan ? 'Memproses...' : 'Batalkan'}
                </button>
              </>
            )}
          </div>
        </section>
      </main>
      <div className="hidden print:block">
          <Receipt />
      </div>
    </>
  )
}
