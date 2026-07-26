import { Minus, Plus } from 'lucide-react'
import { formatRupiah } from '../../utils/currency'


export default function CartItemRow({ item, onChangeQty }) {
  const { ticket, jumlah } = item

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
      <p className="min-w-0 basis-full truncate font-semibold text-slate-900 sm:basis-auto sm:flex-1">
        {ticket.nama}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChangeQty(ticket.id, -1)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-500 hover:bg-slate-50"
          aria-label={`Kurangi jumlah ${ticket.nama}`}
        >
          <Minus size={14} />
        </button>
        <span className="w-6 text-center text-sm font-medium">{jumlah}</span>
        <button
          type="button"
          onClick={() => onChangeQty(ticket.id, 1)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-500 hover:bg-slate-50"
          aria-label={`Tambah jumlah ${ticket.nama}`}
        >
          <Plus size={14} />
        </button>
      </div>

      <p className="ml-auto w-24 shrink-0 text-right font-semibold text-slate-900 sm:w-28">
        {formatRupiah(ticket.harga * jumlah)}
      </p>
    </div>
  )
}
