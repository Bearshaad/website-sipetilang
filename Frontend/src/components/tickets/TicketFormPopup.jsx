import { useEffect, useState } from 'react'
import { Ticket } from 'lucide-react'
import Popup from '../ui/Popup'
import Toggle from '../ui/Toggle'

const emptyForm = { nama: '', harga: '', deskripsi: '', status: 'active' }

export default function TicketFormPopup({ isOpen, mode, ticket, onClose, onSubmit }) {
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Isi ulang form setiap kali popup dibuka (tambah baru / edit tiket lain)
  useEffect(() => {
    if (!isOpen) return
    if (mode === 'edit' && ticket) {
      setForm({
        nama: ticket.nama,
        harga: String(ticket.harga),
        deskripsi: ticket.deskripsi,
        status: ticket.status,
      })
    } else {
      setForm(emptyForm)
    }
    setError('')
  }, [isOpen, mode, ticket])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.nama.trim() || !form.harga) {
      setError('Nama tiket dan harga tiket wajib diisi')
      return
    }

    setIsSaving(true)
    try {
      await onSubmit({
        nama: form.nama.trim(),
        harga: Number(form.harga),
        deskripsi: form.deskripsi.trim(),
        status: form.status,
      })
      onClose()
    } catch (err) {
      setError(err.message || 'Gagal menyimpan tiket')
    } finally {
      setIsSaving(false)
    }
  }

  const isEdit = mode === 'edit'

  return (
    <Popup isOpen={isOpen} onClose={onClose}>
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-700 text-white">
          <Ticket size={22} />
        </span>
        <div>
          <h2 className="text-xl font-bold text-primary-700">
            {isEdit ? 'Edit Tiket' : 'Tambah Tiket'}
          </h2>
          <p className="text-sm text-slate-400">
            {isEdit ? 'Ubah Detail Tiket' : 'Masukan Detail Tiket'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label className="form-label">Nama Tiket</label>
          <input
            type="text"
            value={form.nama}
            onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
            className="form-input"
          />
        </div>

        <div>
          <label className="form-label">Harga Tiket</label>
          <input
            type="number"
            min={0}
            value={form.harga}
            onChange={(e) => setForm((f) => ({ ...f, harga: e.target.value }))}
            placeholder="Rp. 0"
            className="form-input"
          />
        </div>

        <div>
          <label className="form-label">Deskripsi</label>
          <textarea
            rows={4}
            value={form.deskripsi}
            onChange={(e) => setForm((f) => ({ ...f, deskripsi: e.target.value }))}
            className="form-input resize-none"
          />
        </div>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
          {isEdit ? (
            <Toggle
              checked={form.status === 'active'}
              onChange={(checked) =>
                setForm((f) => ({ ...f, status: checked ? 'active' : 'inactive' }))
              }
              label="Active"
            />
          ) : (
            <span />
          )}

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-outline-danger flex-1 sm:flex-none">
              Batal
            </button>
            <button type="submit" disabled={isSaving} className="btn-primary flex-1 sm:flex-none">
              {isSaving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </form>
    </Popup>
  )
}
