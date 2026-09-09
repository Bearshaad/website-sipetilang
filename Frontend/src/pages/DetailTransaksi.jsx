import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { CheckCircle2, Printer, ShoppingCart, Clock, RefreshCw } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import Topbar from '../components/layout/Topbar'
import { useTransaction } from '../context/TransactionContext'
import { formatRupiah } from '../utils/currency'
import apiClient from '../services/apiClient'
import Receipt from '../components/receipt/Receipt'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../context/ConfirmContext'

const QRIS_POLL_INTERVAL_MS = 3000

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
        metodePembayaran,
        qrisData,
        qrisStatus,
        confirmPayment,
        clearTransaction,
        setMetodePembayaran,
        createQrisPayment,
        checkQrisStatus,
    } = useTransaction()

  const [bayarInput, setBayarInput] = useState('')
  const [isConfirming, setIsConfirming] = useState(false)
  const [isBatalkan, setIsBatalkan] = useState(false)
  const [isGeneratingQris, setIsGeneratingQris] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState(0)

  if (!transactionId) {
    return <Navigate to="/penjualan" replace />
  }

  const bayarNumber = Number(bayarInput) || 0
  const kembalianPreview = Math.max(0, bayarNumber - total)
  const isCukup = bayarNumber >= total
  const isSuccess = status === 'success'

  // Hitung mundur waktu kadaluwarsa QR, di-update tiap detik
  useEffect(() => {
    if (!qrisData?.expired_at) return
    function updateCountdown() {
      const diff = Math.floor((new Date(qrisData.expired_at).getTime() - Date.now()) / 1000)
      setRemainingSeconds(Math.max(0, diff))
    }
    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [qrisData])

  // Polling status pembayaran QRIS setiap beberapa detik, selama masih 'pending'
  useEffect(() => {
    if (qrisStatus !== 'pending') return
    const interval = setInterval(() => {
      checkQrisStatus().catch((error) => console.error(error))
    }, QRIS_POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [qrisStatus])

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

  async function handleBuatQris() {
    setIsGeneratingQris(true)
    try {
      await createQrisPayment()
    } catch (error) {
      showToast(error.response?.data?.message || 'Gagal membuat pembayaran QRIS', 'error')
    } finally {
      setIsGeneratingQris(false)
    }
  }

  function handleTransaksiBaru() {
    clearTransaction()
    navigate('/penjualan')
  }

  function handleCetakStruk() {
    window.print()
  }

  function formatCountdown(seconds) {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

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
          {!isSuccess && (
            <div className="mb-5 flex rounded-full border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setMetodePembayaran('Tunai')}
                className={`flex-1 rounded-full py-2 text-sm font-medium transition ${
                  metodePembayaran === 'Tunai' ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-400'
                }`}
              >
                Tunai
              </button>
              <button
                type="button"
                onClick={() => setMetodePembayaran('QRIS')}
                className={`flex-1 rounded-full py-2 text-sm font-medium transition ${
                  metodePembayaran === 'QRIS' ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-400'
                }`}
              >
                QRIS
              </button>
            </div>
          )}

          {isSuccess ? (
            <>
              <h3 className="form-label !mb-3 !text-base">
                {metodePembayaran === 'QRIS' ? 'Dibayar via QRIS' : 'Jumlah Bayar'}
              </h3>
              {metodePembayaran === 'Tunai' && (
                <input
                  type="number"
                  value={paidAmount}
                  disabled
                  className="form-input disabled:bg-slate-50 disabled:text-slate-500"
                />
              )}

              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center">
                <p className="text-sm text-slate-400">Kembalian</p>
                <p className="mt-1 text-lg font-bold text-slate-800">{formatRupiah(change)}</p>
              </div>

              <div className="mt-6 space-y-3">
                <button type="button" onClick={handleCetakStruk} className="btn-primary w-full">
                  <Printer size={18} /> Cetak Struk
                </button>
                <button type="button" onClick={handleTransaksiBaru} className="btn-outline-primary w-full">
                  <ShoppingCart size={18} /> Transaksi Baru
                </button>
              </div>
            </>
          ) : metodePembayaran === 'Tunai' ? (
            <>
              <h3 className="form-label !mb-3 !text-base">Jumlah Bayar</h3>
              <input
                type="number"
                min={0}
                placeholder="Rp."
                value={bayarInput}
                onChange={(e) => setBayarInput(e.target.value)}
                className="form-input"
              />

              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center">
                <p className="text-sm text-slate-400">Kembalian</p>
                <p className="mt-1 text-lg font-bold text-slate-800">{formatRupiah(kembalianPreview)}</p>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  onClick={handleKonfirmasi}
                  disabled={!isCukup || isConfirming}
                  className="btn-primary w-full"
                >
                  {isConfirming ? 'Memproses...' : 'Konfirmasi'}
                </button>
                <button type="button" onClick={handleBatalkan} disabled={isBatalkan} className="btn-outline-danger w-full">
                  {isBatalkan ? 'Memproses...' : 'Batalkan'}
                </button>
              </div>
            </>
          ) : (
            <>
              {!qrisData ? (
                <div className="flex flex-col items-center gap-4 py-6 text-center">
                  <p className="text-sm text-slate-500">
                    Klik tombol di bawah untuk membuat kode QRIS senilai {formatRupiah(total)}
                  </p>
                  <button
                    type="button"
                    onClick={handleBuatQris}
                    disabled={isGeneratingQris}
                    className="btn-primary w-full"
                  >
                    {isGeneratingQris ? 'Membuat QR...' : 'Buat QR Pembayaran'}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  {qrisStatus === 'pending' && (
                    <>
                      <div className="rounded-2xl border border-slate-200 p-4">
                        <QRCodeSVG value={qrisData.qr_string} size={180} />
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-slate-500">
                        <Clock size={16} />
                        <span>Kadaluwarsa dalam {formatCountdown(remainingSeconds)}</span>
                      </div>
                      <p className="text-center text-xs text-slate-400">
                        Menunggu pembayaran... Halaman ini akan otomatis lanjut setelah pembayaran diterima.
                      </p>
                    </>
                  )}

                  {(qrisStatus === 'expired' || qrisStatus === 'deny' || qrisStatus === 'cancel' || qrisStatus === 'failure') && (
                    <>
                      <p className="text-center text-sm text-red-500">
                        {qrisStatus === 'expired' ? 'Kode QR sudah kadaluwarsa.' : 'Pembayaran gagal atau dibatalkan.'}
                      </p>
                      <button type="button" onClick={handleBuatQris} className="btn-primary w-full">
                        <RefreshCw size={16} /> Buat QR Baru
                      </button>
                    </>
                  )}

                  <button type="button" onClick={handleBatalkan} disabled={isBatalkan} className="btn-outline-danger w-full">
                    {isBatalkan ? 'Memproses...' : 'Batalkan Transaksi'}
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>
      <div className="hidden print:block">
          <Receipt />
      </div>
    </>
  )
}