import { formatRupiah } from '../../utils/currency'

const CHART_WIDTH = 700
const CHART_HEIGHT = 220
const PADDING = { top: 16, right: 16, bottom: 28, left: 52 }
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

function formatLabel(label) {
  if (label.length === 10) {
    // format YYYY-MM-DD -> DD/MM
    const [, month, day] = label.split('-')
    return `${day}/${month}`
  }
  // format YYYY-MM -> nama bulan singkat + 2 digit tahun
  const [year, month] = label.split('-')
  return `${MONTH_NAMES[Number(month) - 1]} '${year.slice(2)}`
}

// Format angka besar jadi singkatan (144000 -> "144rb", 2500000 -> "2,5jt")
// khusus untuk label sumbu-Y, supaya tidak makan tempat.
function formatCompact(value) {
  if (value >= 1_000_000) {
    const jt = value / 1_000_000
    return `${jt % 1 === 0 ? jt : jt.toFixed(1)}jt`
  }
  if (value >= 1_000) {
    return `${Math.round(value / 1000)}rb`
  }
  return `${value}`
}

// Bulatkan nilai maksimum ke angka "rapi" terdekat (100, 200, 500, 1000, dst)
// supaya garis bantu sumbu-Y enak dibaca, bukan angka aneh seperti "Rp144.300"
function roundUpNice(value) {
  if (value <= 0) return 100
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)))
  const normalized = value / magnitude
  let niceNormalized = 10
  if (normalized <= 1) niceNormalized = 1
  else if (normalized <= 2) niceNormalized = 2
  else if (normalized <= 5) niceNormalized = 5
  return niceNormalized * magnitude
}

export default function RevenueTrendChart({ data }) {
  if (!data || data.length === 0) {
    return <p className="py-10 text-center text-sm text-slate-400">Belum ada data untuk periode ini</p>
  }

  const innerWidth = CHART_WIDTH - PADDING.left - PADDING.right
  const innerHeight = CHART_HEIGHT - PADDING.top - PADDING.bottom

  const maxValue = Math.max(...data.map((d) => Number(d.pendapatan)))
  const niceMax = roundUpNice(maxValue)
  const gridSteps = 4
  const gridValues = Array.from({ length: gridSteps + 1 }, (_, i) => Math.round((niceMax / gridSteps) * i))

  const points = data.map((d, i) => ({
    x: PADDING.left + (data.length === 1 ? innerWidth / 2 : (i / (data.length - 1)) * innerWidth),
    y: PADDING.top + innerHeight - (Number(d.pendapatan) / niceMax) * innerHeight,
    label: d.label,
    pendapatan: d.pendapatan,
  }))

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')

  // Kalau titik datanya banyak (misal 30 hari), jangan tampilkan semua label
  // sumbu-X sekaligus - bisa numpuk dan tidak terbaca. Tampilkan setiap N titik saja.
  const labelStep = Math.max(1, Math.ceil(data.length / 8))

  return (
    <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="w-full">
      {gridValues.map((val) => {
        const y = PADDING.top + innerHeight - (val / niceMax) * innerHeight
        return (
          <g key={val}>
            <line
              x1={PADDING.left}
              y1={y}
              x2={CHART_WIDTH - PADDING.right}
              y2={y}
              stroke="#e2e8f0"
              strokeWidth="1"
            />
            <text x={PADDING.left - 8} y={y + 3} textAnchor="end" fontSize="10" fill="#94a3b8">
              {formatCompact(val)}
            </text>
          </g>
        )
      })}

      <path d={linePath} fill="none" stroke="#155fdc" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

      {points.map((p, i) => (
        <g key={p.label}>
          <circle cx={p.x} cy={p.y} r="3.5" fill="#155fdc" stroke="white" strokeWidth="1.5" />
          <title>{formatLabel(p.label)}: {formatRupiah(p.pendapatan)}</title>
          {i % labelStep === 0 && (
            <text x={p.x} y={CHART_HEIGHT - 8} textAnchor="middle" fontSize="10" fill="#94a3b8">
              {formatLabel(p.label)}
            </text>
          )}
        </g>
      ))}
    </svg>
  )
}