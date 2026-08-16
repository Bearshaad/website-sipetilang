export default function TopTicketsChart({ data }) {
  if (!data || data.length === 0) {
    return <p className="py-10 text-center text-sm text-slate-400">Belum ada tiket terjual pada periode ini</p>
  }

  const maxQty = Math.max(...data.map((d) => Number(d.totalTerjual)), 1)

  return (
    <div className="space-y-4">
      {data.map((d, idx) => {
        const widthPercent = (Number(d.totalTerjual) / maxQty) * 100
        return (
          <div key={d.nama_tiket}>
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">
                {idx + 1}. {d.nama_tiket}
              </span>
              <span className="font-semibold text-primary-700">{d.totalTerjual} terjual</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-primary-600 transition-all"
                style={{ width: `${Math.max(widthPercent, 3)}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}