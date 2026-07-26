import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Download } from 'lucide-react'
import Topbar from '../components/layout/Topbar'
import Pagination from '../components/ui/Pagination'
import { getSalesReport, buildReportExcel } from '../services/reportService'
import { tanggalMatchesQuery } from '../utils/date'
import { formatRupiah } from '../utils/currency'

const PAGE_SIZE = 5
const PERIODS = [
  { key: 'daily', label: 'Daily', pendapatanLabel: 'Pendapatan Harian' },
  { key: 'weekly', label: 'Weekly', pendapatanLabel: 'Pendapatan Mingguan' },
  { key: 'monthly', label: 'Monthly', pendapatanLabel: 'Pendapatan Bulanan' },
  { key: 'yearly', label: 'Yearly', pendapatanLabel: 'Pendapatan Tahunan' },
]
const VALID_PERIODS = PERIODS.map((p) => p.key)

export default function LaporanPenjualan() {
  const { period } = useParams()
  const navigate = useNavigate()

  const [report, setReport] = useState({ pendapatan: 0, jumlahTransaksi: 0, transaksi: [] })
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (!VALID_PERIODS.includes(period)) return
    getSalesReport(period).then(setReport)
    setPage(1)
  }, [period])

  // Path /laporan/:period yang tidak valid diarahkan balik ke daily
  if (!VALID_PERIODS.includes(period)) {
    return <Navigate to="/laporan/daily" replace />
  }

  const activePeriod = PERIODS.find((p) => p.key === period)

  // Search mendukung pencarian per tanggal, nama bulan (singkatan/lengkap),
  // maupun tahun - bukan cuma cocok persis string tanggalnya.
  const filteredTransaksi = useMemo(
    () => report.transaksi.filter((t) => tanggalMatchesQuery(t.tanggal, query)),
    [report.transaksi, query]
  )

  const totalPages = Math.max(1, Math.ceil(filteredTransaksi.length / PAGE_SIZE))
  const pageItems = filteredTransaksi.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  async function handleUnduhLaporan() {
    await buildReportExcel(filteredTransaksi, `laporan-penjualan-${period}.xlsx`)
  }

  return (
    <>
      <Topbar
        searchPlaceholder="Cari Tanggal, Bulan, atau Tahun"
        searchValue={query}
        onSearchChange={(val) => {
          setQuery(val)
          setPage(1)
        }}
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
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-6">
            <h3 className="font-bold text-slate-900">{activePeriod.pendapatanLabel}</h3>
            <p className="mt-3 text-2xl font-extrabold text-primary-700 sm:text-3xl">
              {formatRupiah(report.pendapatan)}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card sm:p-6">
            <h3 className="font-bold text-slate-900">Jumlah Transaksi</h3>
            <p className="mt-3 text-2xl font-extrabold text-primary-700 sm:text-3xl">
              {report.jumlahTransaksi}
            </p>
          </div>
          <div className="rounded-2xl bg-primary-700 p-4 text-center text-white shadow-card sm:p-6">
            <Download size={28} className="mx-auto" strokeWidth={1.75} />
            <h3 className="mt-2 font-bold">Unduh Laporan</h3>
            <p className="mt-1 text-sm text-primary-100">Export data ke format Excel</p>
            <button
              type="button"
              onClick={handleUnduhLaporan}
              className="mt-4 w-full rounded-xl bg-white py-2.5 text-sm font-semibold text-primary-700 hover:bg-primary-50"
            >
              Unduh Laporan
            </button>
          </div>
        </div>

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
                {pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      Tidak ada transaksi ditemukan
                    </td>
                  </tr>
                ) : (
                  pageItems.map((t) =>
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

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </main>
    </>
  )
}
