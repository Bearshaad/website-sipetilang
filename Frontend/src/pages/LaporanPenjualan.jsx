import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Download, Wallet, Receipt } from 'lucide-react'
import Topbar from '../components/layout/Topbar'
import Pagination from '../components/ui/Pagination'
import { formatRupiah } from '../utils/currency'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { getSalesReport, getSalesReportExport, getStatistikPenjualan, buildReportExcel } from '../services/reportService'
import RevenueTrendChart from '../components/laporan/RevenueTrendChart'
import TopTicketsChart from '../components/laporan/TopTicketsChart'


const PERIODS = [
  { key: 'daily', label: 'Daily', pendapatanLabel: 'Pendapatan Harian' },
  { key: 'weekly', label: 'Weekly', pendapatanLabel: 'Pendapatan Mingguan' },
  { key: 'monthly', label: 'Monthly', pendapatanLabel: 'Pendapatan Bulanan' },
  { key: 'yearly', label: 'Yearly', pendapatanLabel: 'Pendapatan Tahunan' },
]

const VALID_PERIODS = PERIODS.map((p) => p.key)

function getTrenTitle(period) {
  if (period === 'daily') return 'Pendapatan Bulan Berjalan'
  if (period === 'weekly') return 'Pendapatan Minggu Ini'
  if (period === 'monthly') return 'Pendapatan 6 Bulan Terakhir'
  return 'Pendapatan Tahun Ini'
}

const SEARCH_DEBOUNCE_MS = 500

export default function LaporanPenjualan() {
  const { period } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [report, setReport] = useState({
    pendapatan: 0,
    jumlahTransaksi: 0,
    totalTiketTerjual: 0,
    transaksi: [],
    currentPage: 1,
    totalPages: 1,
  })
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [isDownloading, setIsDownloading] = useState(false)
  const [statistik, setStatistik] = useState({ tren: [], tiketTerlaris: [] })
  const { role } = useAuth()
  const latestRequestId = useRef(0)

  // "Nomor tiket antrian" - hasil fetch cuma dipakai kalau dia masih yang PALING BARU
  // diminta. Kalau ada fetch lain yang dikirim belakangan, hasil yang lebih lama
  // otomatis diabaikan meski responnya datang duluan.
  function fetchReport(pageToLoad, searchTerm) {
    const requestId = ++latestRequestId.current
    getSalesReport(period, pageToLoad, searchTerm).then((data) => {
      if (requestId === latestRequestId.current) {
        setReport(data)
      }
    })
  }

  // Debounce: tunda update `debouncedQuery` sampai user berhenti mengetik 500ms
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedQuery(query)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timeoutId)
  }, [query])

  // Fetch beneran cuma jalan saat period berubah, atau debouncedQuery berubah
  // (bukan setiap ketikan mentah)
  useEffect(() => {
    if (!VALID_PERIODS.includes(period)) return
    fetchReport(1, debouncedQuery)
  }, [period, debouncedQuery])

  if (!VALID_PERIODS.includes(period)) {
    return <Navigate to="/laporan/daily" replace />
  }

  useEffect(() => {
    if (!VALID_PERIODS.includes(period) || role !== 'owner') return
    getStatistikPenjualan(period)
      .then(setStatistik)
      .catch((error) => {
        console.error(error)
        showToast(error.response?.data?.message || 'Gagal memuat data statistik', 'error')
      })
  }, [period, role])

  const activePeriod = PERIODS.find((p) => p.key === period)

  function handlePageChange(newPage) {
    fetchReport(newPage, debouncedQuery)
  }

  async function handleUnduhLaporan() {
    setIsDownloading(true)
    try {
      const transaksiLengkap = await getSalesReportExport(period, debouncedQuery)
      await buildReportExcel(transaksiLengkap, `laporan-penjualan-${period}.xlsx`)
    } catch (error) {
      showToast(error.response?.data?.message || 'Gagal mengunduh laporan, silakan coba lagi', 'error')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <>
      <Topbar
        searchPlaceholder="Cari tanggal (dd-mm-yyyy)"
        searchValue={query}
        onSearchChange={setQuery}
      />

      <main className="flex-1 space-y-4 overflow-y-auto p-3 sm:space-y-6 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Laporan Penjualan</h1>

          <div className="flex flex-wrap gap-2 rounded-full border border-slate-200 bg-white p-1">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => navigate(`/laporan/${p.key}`)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition sm:px-4 sm:text-sm ${
                  period === p.key
                    ? 'bg-primary-700 text-white'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
          <div className="flex flex-col justify-center rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900">{activePeriod.pendapatanLabel}</h3>
                <p className="mt-2 text-2xl font-extrabold text-primary-700 sm:text-3xl">
                  {formatRupiah(report.pendapatan)}
                </p>
                <p className="mt-1 text-sm text-slate-400">Total pendapatan pada periode ini</p>
              </div>
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                <Wallet size={22} strokeWidth={1.75} />
              </span>
            </div>
          </div>
          <div className="flex flex-col justify-center rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900">Jumlah Transaksi</h3>
                <p className="mt-2 text-2xl font-extrabold text-primary-700 sm:text-3xl">
                  {report.jumlahTransaksi}
                </p>
                <p className="mt-1 text-sm text-slate-400">Total transaksi berhasil pada periode ini</p>
              </div>
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                <Receipt size={22} strokeWidth={1.75} />
              </span>
            </div>
          </div>
          <div className="flex flex-col justify-center rounded-2xl bg-primary-700 p-4 text-center text-white shadow-card sm:p-6">
            <Download size={28} className="mx-auto" strokeWidth={1.75} />
            <h3 className="mt-2 font-bold">Unduh Laporan</h3>
            <p className="mt-1 text-sm text-primary-100">Export data ke format Excel</p>
            <button
              type="button"
              onClick={handleUnduhLaporan}
              disabled={isDownloading}
              className="mt-4 w-full rounded-xl bg-white py-2.5 text-sm font-semibold text-primary-700 hover:bg-primary-50 disabled:opacity-60"
            >
              {isDownloading ? 'Menyiapkan...' : 'Unduh Laporan'}
            </button>
          </div>
        </div>
        {role === 'owner' && (
          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-6 lg:col-span-2">
              <h3 className="mb-4 font-bold text-slate-900">{getTrenTitle(period)}</h3>
              <RevenueTrendChart data={statistik.tren} />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-6">
              <h3 className="mb-4 font-bold text-slate-900">Tiket Terlaris</h3>
              <TopTicketsChart data={statistik.tiketTerlaris} />
            </div>
          </div>
        )}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-card">
          <h2 className="border-b border-slate-100 p-4 text-center text-lg font-bold text-slate-900 sm:p-6 sm:text-xl">
            Transaksi Terbaru
          </h2>

          <div className="overflow-x-auto px-3 sm:px-6">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="text-slate-400">
                  <th className="py-3 font-medium">Waktu & Tanggal</th>
                  <th className="py-3 font-medium">Nama Tiket</th>
                  <th className="py-3 font-medium">Harga</th>
                  <th className="py-3 font-medium">Jumlah</th>
                  <th className="py-3 font-medium">Pajak</th>
                  <th className="py-3 font-medium">Total</th>
                  <th className="py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {report.transaksi.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      Tidak ada transaksi ditemukan
                    </td>
                  </tr>
                ) : (
                  report.transaksi.map((t) =>
                    t.items.map((item, idx) => (
                      <tr
                        key={`${t.id}-${idx}`}
                        className={idx === 0 ? 'border-t-2 border-slate-200' : ''}
                      >
                        {idx === 0 && (
                          <td rowSpan={t.items.length} className="py-4 pr-4 align-top text-slate-500">
                            {t.waktu}
                            <br />
                            {t.tanggal}
                          </td>
                        )}
                        <td className="py-4 pr-4 font-semibold text-slate-900">{item.namaTiket}</td>
                        <td className="py-4 pr-4 font-medium text-primary-700">
                          {formatRupiah(item.harga)}
                        </td>
                        <td className="py-4 pr-4 text-slate-500">{item.qty}</td>
                        {idx === 0 && (
                          <td rowSpan={t.items.length} className="py-4 pr-4 align-top font-medium text-primary-700">
                            {formatRupiah(t.pajak)}
                          </td>
                        )}
                        {idx === 0 && (
                          <td rowSpan={t.items.length} className="py-4 pr-4 align-top font-bold text-primary-700">
                            {formatRupiah(t.total)}
                          </td>
                        )}
                        {idx === 0 && (
                          <td rowSpan={t.items.length} className="py-4 pr-4 align-top">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                t.status === 'Berhasil'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-600'
                              }`}
                            >
                              {t.status}
                            </span>
                          </td>
                        )}
                      </tr>
                    ))
                  )
                )}
              </tbody>
            </table>
          </div>

          <Pagination page={report.currentPage} totalPages={report.totalPages} onPageChange={handlePageChange} />
        </div>
      </main>
    </>
  )
}

export async function getTrenPendapatan(dateCondition, groupByMonth) {
    const groupFormat = groupByMonth ? '%Y-%m' : '%Y-%m-%d';
    const [rows] = await db.execute(`
        SELECT DATE_FORMAT(t.tanggal_transaksi, '${groupFormat}') as label,
               COALESCE(SUM(t.total_transaksi), 0) as pendapatan
        FROM transaksi t
        WHERE t.status_transaksi = 'Selesai' ${dateCondition}
        GROUP BY label
        ORDER BY label ASC
    `);
    return rows;
}

export async function getTiketTerlaris(dateCondition, limit) {
    const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 5;
    const [rows] = await db.execute(`
        SELECT jt.nama_tiket, SUM(dt.qty) as totalTerjual
        FROM detail_transaksi dt
        JOIN transaksi t ON dt.id_transaksi = t.id_transaksi
        JOIN jenisTiket jt ON dt.id_tiket = jt.id_tiket
        WHERE t.status_transaksi = 'Selesai' ${dateCondition}
        GROUP BY jt.id_tiket, jt.nama_tiket
        ORDER BY totalTerjual DESC
        LIMIT ${safeLimit}
    `);
    return rows;
}