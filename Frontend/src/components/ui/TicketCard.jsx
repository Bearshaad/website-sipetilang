import { formatRupiah } from '../../utils/currency'

export default function TicketCard({ ticket, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(ticket)}
      className="flex w-64 flex-col items-start rounded-2xl border border-slate-200 bg-white p-6
        text-left shadow-card transition hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md"
    >
      <h3 className="text-lg font-bold text-slate-900">{ticket.nama}</h3>
      <p className="mt-2 text-sm text-slate-500">{ticket.deskripsi}</p>
      <p className="mt-6 text-lg font-semibold text-primary-700">
        {formatRupiah(ticket.harga)}
      </p>
    </button>
  )
}
