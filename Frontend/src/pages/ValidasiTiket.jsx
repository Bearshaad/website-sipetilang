import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, XCircle, ScanLine } from 'lucide-react'
import apiClient from '../services/apiClient'
import Logo from '../components/ui/Logo'

export default function ValidasiTiket() {
    const [kodeQr, setKodeQr] = useState('')
    const [result, setResult] = useState(null)
    const [isChecking, setIsChecking] = useState(false)
    const inputRef = useRef(null)

    useEffect(() => {
        const interval = setInterval(() => {
            inputRef.current?.focus()
        }, 1000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        if (!result) return
        const timeout = setTimeout(() => setResult(null), 4000)
        return () => clearTimeout(timeout)
    }, [result])

    async function handleSubmit(e) {
        e.preventDefault()
        if (!kodeQr.trim() || isChecking) return

        setIsChecking(true)
        setResult(null)
        try {
            const res = await apiClient.post(
                '/qr/validasi',
                { kode_qr: kodeQr.trim() },
                { headers: { 'X-Device-Key': import.meta.env.VITE_DEVICE_API_KEY } }
            )
            setResult({ success: true, message: res.data.message })
        } catch (error) {
            setResult({
                success: false,
                message: error.response?.data?.message || 'Terjadi kesalahan, coba lagi',
            })
        } finally {
            setKodeQr('')
            setIsChecking(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-surface p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
                <div className="text-center">
                    <Logo size={28} className="mx-auto mb-4 justify-center" />
                    <ScanLine size={48} className="mx-auto text-primary-700" strokeWidth={1.5} />
                    <h1 className="mt-3 text-xl font-bold text-slate-900">Validasi Tiket</h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Arahkan scanner ke kode QR pada struk pengunjung
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <input
                        ref={inputRef}
                        type="text"
                        autoFocus
                        value={kodeQr}
                        onChange={(e) => setKodeQr(e.target.value)}
                        placeholder="Menunggu hasil scan..."
                        disabled={isChecking}
                        className="form-input text-center"
                    />
                </form>

                {result && (
                    <div
                        className={`mt-6 flex flex-col items-center gap-2 rounded-xl p-4 text-center ${
                            result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                        }`}
                    >
                        {result.success ? <CheckCircle2 size={40} /> : <XCircle size={40} />}
                        <p className="text-lg font-semibold">{result.message}</p>
                    </div>
                )}
            </div>
        </div>
    )
}