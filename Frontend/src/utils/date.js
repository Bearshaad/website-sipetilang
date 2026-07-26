const MONTHS = [
  { short: 'jan', id: 'januari' },
  { short: 'feb', id: 'februari' },
  { short: 'mar', id: 'maret' },
  { short: 'apr', id: 'april' },
  { short: 'may', id: 'mei' },
  { short: 'jun', id: 'juni' },
  { short: 'jul', id: 'juli' },
  { short: 'aug', id: 'agustus' },
  { short: 'sep', id: 'september' },
  { short: 'oct', id: 'oktober' },
  { short: 'nov', id: 'november' },
  { short: 'dec', id: 'desember' },
]

export function parseTanggal(tanggalStr) {
  const [dayStr, monShort, yearStr] = tanggalStr.trim().split(/\s+/)
  const monthIndex = MONTHS.findIndex((m) => m.short === monShort.toLowerCase())
  const day = Number(dayStr)
  const year = Number(yearStr)
  return {
    day,
    monthIndex, // 0-11
    year,
    date: new Date(year, monthIndex, day),
  }
}

export function tanggalMatchesQuery(tanggalStr, query) {
  const q = query.trim().toLowerCase()
  if (!q) return true

  if (tanggalStr.toLowerCase().includes(q)) return true

  const { day, monthIndex, year } = parseTanggal(tanggalStr)
  const month = MONTHS[monthIndex]
  if (!month) return false

  const monthNumber = String(monthIndex + 1)
  const monthNumberPadded = monthNumber.padStart(2, '0')

  return (
    q === String(day) ||
    q === String(year) ||
    q === month.short ||
    q === month.id ||
    q === monthNumber ||
    q === monthNumberPadded
  )
}

// Dipakai halaman Laporan Penjualan untuk mengelompokkan transaksi
// berdasarkan periode (daily/weekly/monthly/yearly) 
export function isWithinPeriod(tanggalStr, period, referenceDate) {
  const { date } = parseTanggal(tanggalStr)

  if (period === 'daily') {
    return isSameDay(date, referenceDate)
  }
  if (period === 'weekly') {
    const diffDays = (referenceDate - date) / (1000 * 60 * 60 * 24)
    return diffDays >= 0 && diffDays < 7
  }
  if (period === 'monthly') {
    return date.getMonth() === referenceDate.getMonth() && date.getFullYear() === referenceDate.getFullYear()
  }
  if (period === 'yearly') {
    return date.getFullYear() === referenceDate.getFullYear()
  }
  return true
}

function isSameDay(a, b) {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  )
}
