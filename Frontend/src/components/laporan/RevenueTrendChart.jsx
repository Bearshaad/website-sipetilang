import { useRef, useState } from 'react'
import { formatRupiah } from '../../utils/currency'

const CHART_WIDTH = 700
const CHART_HEIGHT = 220
const PADDING = { top: 16, right: 16, bottom: 28, left: 52 }
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

function formatLabel(label) {
  if (label.length === 10) {
    const [, month, day] = label.split('-')
    return `${day}/${month}`
  }
  const [year, month] = label.split('-')
  return `${MONTH_NAMES[Number(month) - 1]} '${year.slice(2)}`
}

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
  const svgRef = useRef(null)
  const [hoveredIndex, setHoveredIndex] = useState(null)

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
  const labelStep = Math.max(1, Math.ceil(data.length / 8))

  function handleMouseMove(e) {
    if (!svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const scaleX = CHART_WIDTH / rect.width
    const mouseX = (e.clientX - rect.left) * scaleX

    let nearestIndex = 0
    let minDist = Infinity
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - mouseX)
      if (dist < minDist) {
        minDist = dist
        nearestIndex = i
      }
    })
    setHoveredIndex(nearestIndex)
  }

  const hovered = hoveredIndex !== null ? points[hoveredIndex] : null
  const tooltipXPercent = hovered ? (hovered.x / CHART_WIDTH) * 100 : 0
  const tooltipYPercent = hovered ? (hovered.y / CHART_HEIGHT) * 100 : 0
  // Kalau titiknya terlalu dekat ke tepi kiri/kanan, geser tooltip supaya
  // tidak terpotong keluar dari area chart
  const tooltipAlign = tooltipXPercent < 15 ? 'left' : tooltipXPercent > 85 ? 'right' : 'center'

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="w-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {gridValues.map((val) => {
          const y = PADDING.top + innerHeight - (val / niceMax) * innerHeight
          return (
            <g key={val}>
              <line x1={PADDING.left} y1={y} x2={CHART_WIDTH - PADDING.right} y2={y} stroke="#e2e8f0" strokeWidth="1" />
              <text x={PADDING.left - 8} y={y + 3} textAnchor="end" fontSize="10" fill="#94a3b8">
                {formatCompact(val)}
              </text>
            </g>
          )
        })}
        
        <path d={linePath} fill="none" stroke="#155fdc" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

        {points.map((p, i) => (
          <g key={p.label}>
            {hoveredIndex === i && <circle cx={p.x} cy={p.y} r="7" fill="#155fdc" fillOpacity="0.15" />}
            <circle
              cx={p.x}
              cy={p.y}
              r={hoveredIndex === i ? '4.5' : '3.5'}
              fill="#155fdc"
              stroke="white"
              strokeWidth="1.5"
              className="transition-all"
            />
            {i % labelStep === 0 && (
              <text x={p.x} y={CHART_HEIGHT - 8} textAnchor="middle" fontSize="10" fill="#94a3b8">
                {formatLabel(p.label)}
              </text>
            )}
          </g>
        ))}
      </svg>

      {hovered && (
        <div
          className={`pointer-events-none absolute z-10 -translate-y-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg ${
            tooltipAlign === 'left' ? 'translate-x-0' : tooltipAlign === 'right' ? '-translate-x-full' : '-translate-x-1/2'
          }`}
          style={{
            left: tooltipAlign === 'left' ? `${tooltipXPercent}%` : tooltipAlign === 'right' ? `${tooltipXPercent}%` : `${tooltipXPercent}%`,
            top: `${tooltipYPercent}%`,
            marginTop: '-10px',
          }}
        >
          <p className="font-medium text-slate-400">{formatLabel(hovered.label)}</p>
          <p className="mt-0.5 flex items-center gap-1.5 font-bold text-primary-700">
            <span className="h-2 w-2 rounded-full bg-primary-600" />
            {formatRupiah(hovered.pendapatan)}
          </p>
        </div>
      )}
    </div>
  )
}