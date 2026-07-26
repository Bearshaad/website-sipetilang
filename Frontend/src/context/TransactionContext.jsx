import { createContext, useContext, useMemo, useState } from 'react'
import apiClient from '../services/apiClient'

const TransactionContext = createContext(null)

// mengatur pajak
const TAX_RATE = 0.11

export function TransactionProvider({ children }) {
    const [browsedTicketIds, setBrowsedTicketIds] = useState([])

    // Item di "Transaksi Baru":
    const [cart, setCart] = useState([])
    const [status, setStatus] = useState('building') // 'building' | 'success'
    const [transactionId, setTransactionId] = useState(null)
    const [paidAmount, setPaidAmount] = useState(0)
    const [invoiceData, setInvoiceData] = useState(null)

   //perhitungan transaksi di backend
    const [confirmedSubtotal, setConfirmedSubtotal] = useState(0)
    const [confirmedPajak, setConfirmedPajak] = useState(0)
    const [confirmedTotal, setConfirmedTotal] = useState(0)

    function browseTicket(ticket) {
        setBrowsedTicketIds((prev) => (prev.includes(ticket.id) ? prev : [...prev, ticket.id]))
    }

    function addToCart(ticket) {
        setCart((prev) => {
            const existing = prev.find((item) => item.ticket.id === ticket.id)
            if (existing) {
                return prev.map((item) =>
                    item.ticket.id === ticket.id ? { ...item, jumlah: item.jumlah + 1 } : item
                )
            }
            return [...prev, { ticket, jumlah: 1 }]
        })
    }

    function changeQty(ticketId, delta) {
        setCart((prev) =>
            prev.map((item) =>
                item.ticket.id === ticketId
                    ? { ...item, jumlah: Math.max(1, item.jumlah + delta) }
                    : item
            )
        )
    }

    // tombol bersihkan pada bagian preview transaksi
    function clearTransaction() {
        setCart([])
        setStatus('building')
        setTransactionId(null)
        setPaidAmount(0)
        setInvoiceData(null)
        setConfirmedSubtotal(0)
        setConfirmedPajak(0)
        setConfirmedTotal(0)
    }

   // preview perhitungan dari frontend
    const subtotal = useMemo(
        () => cart.reduce((sum, item) => sum + item.ticket.harga * item.jumlah, 0),
        [cart]
    )
    const pajak = useMemo(() => Math.round(subtotal * TAX_RATE), [subtotal])
    const total = subtotal + pajak

    const change = Math.max(0, paidAmount - confirmedTotal)

async function createTransaction(id_petugas) {
    const items = cart.map((item) => ({
        id_tiket: item.ticket.id,
        qty: item.jumlah,
    }))

    const res = await apiClient.post('/transaksi', { id_petugas, items })
    const data = res.data

    setTransactionId(data.id_transaksi)
    setConfirmedSubtotal(data.subtotal_transaksi)
    setConfirmedPajak(data.tax_transaksi)
    setConfirmedTotal(data.total_transaksi)

    return data.id_transaksi
}

async function confirmPayment(amount) {
    const res = await apiClient.put(`/transaksi/${transactionId}/status`, {
        status_transaksi: 'Selesai',
    })

    setPaidAmount(amount)
    setStatus('success')
    setInvoiceData(res.data.invoice)
}

    const value = {
        browsedTicketIds,
        cart,
        status,
        transactionId,
        paidAmount,
        invoiceData,
        subtotal,           // preview
        pajak,              // preview
        total,              // preview
        confirmedSubtotal,  // confirmed - validasi di bakend
        confirmedPajak,
        confirmedTotal,
        change,
        taxRate: TAX_RATE,
        browseTicket,
        addToCart,
        changeQty,
        clearTransaction,
        createTransaction,
        confirmPayment,
    }

    return (
        <TransactionContext.Provider value={value}>
            {children}
        </TransactionContext.Provider>
    )
}

export function useTransaction() {
    const ctx = useContext(TransactionContext)
    if (!ctx) throw new Error('useTransaction harus dipakai di dalam <TransactionProvider>')
    return ctx
}