import { useEffect, useState } from 'react'
import { UserPlus } from 'lucide-react'
import Popup from '../ui/Popup'
import Toggle from '../ui/Toggle'

const emptyForm = { nama: '', username: '', password: '', email: '', no_hp: '', active: true }

export default function PetugasFormPopup({ isOpen, mode, petugas, onClose, onSubmit }) {
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
      if (!isOpen) return
      if (mode === 'edit' && petugas) {
          setForm({
              nama: petugas.nama,
              username: petugas.username,
              password: '', // password lama tidak ditampilkan; kosong = tidak diganti
              email: petugas.email || '',
              no_hp: petugas.no_hp || '',
              active: petugas.active,
          })
      } else {
          setForm(emptyForm)
      }
      setError('')
  }, [isOpen, mode, petugas])

  async function handleSubmit(e) {
        e.preventDefault()
        setError('')

        if (!form.nama.trim() || !form.username.trim()) {
            setError('Nama petugas dan username wajib diisi')
            return
        }
        if (!form.email.trim() || !form.no_hp.trim()) {
            setError('Email dan No HP wajib diisi')
            return
        }
        if (mode === 'add' && !form.password) {
            setError('Password wajib diisi untuk petugas baru')
            return
        }

        setIsSaving(true)
        try {
            const payload = {
                nama: form.nama.trim(),
                username: form.username.trim(),
                email: form.email.trim(),
                no_hp: form.no_hp.trim(),
                active: form.active,
            }
            if (form.password) payload.password = form.password

            await onSubmit(payload)
            onClose()
        } catch (err) {
            setError(err.message || 'Gagal menyimpan data petugas')
        } finally {
            setIsSaving(false)
        }
    }
  const isEdit = mode === 'edit'

  return (
    <Popup isOpen={isOpen} onClose={onClose}>
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-700 text-white">
          <UserPlus size={22} />
        </span>
        <div>
          <h2 className="text-xl font-bold text-primary-700">
            {isEdit ? 'Edit Petugas' : 'Tambah Petugas'}
          </h2>
          <p className="text-sm text-slate-400">
            {isEdit ? 'Ubah Detail Petugas' : 'Masukan Detail Petugas'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label className="form-label">Nama Petugas</label>
          <input
            type="text"
            value={form.nama}
            onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))}
            className="form-input"
          />
        </div>

        <div>
          <label className="form-label">Username</label>
          <input
            type="text"
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            className="form-input"
          />
        </div>

        <div>
          <label className="form-label">Password</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            placeholder={isEdit ? 'Kosongkan jika tidak diganti' : ''}
            className="form-input"
          />
        </div>

        <div>
            <label className="form-label">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="form-input"
            />
        </div>

        <div>
            <label className="form-label">No HP</label>
            <input
                type="text"
                value={form.no_hp}
                onChange={(e) => setForm((f) => ({ ...f, no_hp: e.target.value }))}
                className="form-input"
            />
        </div>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}

        <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <Toggle
            checked={form.active}
            onChange={(checked) => setForm((f) => ({ ...f, active: checked }))}
            label="Active"
          />

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
