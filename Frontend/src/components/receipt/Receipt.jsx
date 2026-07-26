import { QRCodeSVG } from 'qrcode.react'
import { useTransaction } from '../../context/TransactionContext'
import { formatRupiah } from '../../utils/currency'

export default function Receipt() {
    const {
        transactionId,
        cart,
        confirmedSubtotal,
        confirmedPajak,
        confirmedTotal,
        paidAmount,
        change,
        invoiceData,
    } = useTransaction()

    console.log("Invoice Data: ", invoiceData)

    // Jaga-jaga: kalau entah kenapa struk ini ke-print sebelum invoice ada
    if (!invoiceData) return null

    return (
        <div id="receipt-print-area" className="w-full bg-white p-4 text-sm text-black">
            <div className="text-center">
                <h2 className="text-lg font-bold">SIPETILANG</h2>
                <p className="text-xs">Struk Pembelian Tiket Kolam Renang</p>
                <p className="text-xs">Jl. Kenangan</p>
            </div>

            <div className="my-3 border-t border-dashed border-black" />
            <div className="text-center">
                <p className="flex justify-between">
                    Invoice : INV-{String(invoiceData.id_invoice).padStart(6, "0")}
                </p>

                <p className="flex justify-between">
                    Tanggal :
                    {" "}
                    {new Date(invoiceData.tanggal_transaksi).toLocaleString("id-ID", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                    })}
                </p>
            </div>

            <div className="my-3 border-t border-dashed border-black" />

            {cart.map((item) => (
                <div key={item.ticket.id} className="flex justify-between py-1">
                    <span>{item.ticket.nama} x{item.jumlah}</span>
                    <span>{formatRupiah(item.ticket.harga * item.jumlah)}</span>
                </div>
            ))}

            <div className="my-3 border-t border-dashed border-black" />

            <div className="flex justify-between font-bold">
                <span>Subtotal</span>
                <span>{formatRupiah(confirmedSubtotal)}</span>
            </div>
            <div className="flex justify-between">
                <span>Pajak: PPN (11%)</span>
                <span>{formatRupiah(confirmedPajak)}</span>
            </div>

            <div className="my-3 border-t border-dashed border-black" />

            <div className="flex justify-between font-bold text-[20px] mb-4">
                <span>Total</span>
                <span>{formatRupiah(confirmedTotal)}</span>
            </div>
            <div className="flex justify-between">
                <span>Tunai</span>
                <span>{formatRupiah(paidAmount)}</span>
            </div>
            <div className="flex justify-between">
                <span>Kembalian</span>
                <span>{formatRupiah(change)}</span>
            </div>

            <div className="my-3 border-t border-dashed border-black" />

            <div className="flex justify-center py-2 mb-6 mt-6">
                <QRCodeSVG value={invoiceData.kode_qr} size={140} />
            </div>

            <p className="mt-2 text-center text-xs">Terima kasih!</p>
            <p className="mt-2 text-center text-xs"> Semoga Harimu Menyenangkan!</p>
            <p className="mt-2 text-center text-xs"> Simpan struk ini untuk validasi QR Ticket</p>

        </div>
    )
}