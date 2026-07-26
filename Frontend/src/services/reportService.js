import ExcelJS from 'exceljs'
import apiClient from './apiClient'


function mapTransaksiFromApi(row) {
    const tanggalObj = new Date(row.tanggal_transaksi)
    return {
        id: row.id_transaksi,
        waktu: tanggalObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        tanggal: tanggalObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
        subtotal: Number(row.subtotal_transaksi),
        pajak: Number(row.tax_transaksi),
        total: Number(row.total_transaksi),
        status: row.status_transaksi === 'Selesai' ? 'Berhasil' : 'Dibatalkan',
        items: row.items.map((item) => ({
            namaTiket: item.nama_tiket,
            qty: item.qty,
            harga: Number(item.harga_tiket),
        })),
    }
}

export async function getSalesReport(period) {
    const res = await apiClient.get('/laporan', { params: { period } })
    return {
        period,
        pendapatan: res.data.pendapatan,
        jumlahTransaksi: res.data.jumlahTransaksi,
        totalTiketTerjual: res.data.totalTiketTerjual,
        transaksi: res.data.transaksi.map(mapTransaksiFromApi),
    }
}

const RUPIAH_FORMAT = '"Rp"#,##0'

// A=Waktu, B=Tanggal, F=Pajak, G=Total, H=Status
const MERGE_COLS = ['A', 'B', 'F', 'G', 'H']

// untuk transaksi yang punya lebih dari 1 jenis tiket, column waktu,tanggal,pajak,total, dan status
// di merge, dan untuk harga,pajak, dan total menggunakan format Rupiah, center.
export async function buildReportExcel(transaksiList, fileName) {
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Laporan Penjualan')

    const header = ['Waktu', 'Tanggal', 'Nama Tiket', 'Harga', 'Jumlah', 'Pajak', 'Total', 'Status']
    sheet.addRow(header)
    sheet.getRow(1).font = { bold: true }
    sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' }

    transaksiList.forEach((t) => {
        const startRow = sheet.rowCount + 1

        t.items.forEach((item, idx) => {
            const row = sheet.addRow([
                idx === 0 ? t.waktu : '',
                idx === 0 ? t.tanggal : '',
                item.namaTiket,
                item.harga,
                item.qty,
                idx === 0 ? t.pajak : '',
                idx === 0 ? t.total : '',
                idx === 0 ? t.status : '',
            ])
            row.getCell(4).numFmt = RUPIAH_FORMAT // Harga
        })

        const endRow = sheet.rowCount

        // Merge cell kalau transaksinya punya lebih dari 1 item
        if (t.items.length > 1) {
            MERGE_COLS.forEach((col) => sheet.mergeCells(`${col}${startRow}:${col}${endRow}`))
        }

        // Alignment tengah (vertical & horizontal) untuk cell yang di merge
        MERGE_COLS.forEach((col) => {
            sheet.getCell(`${col}${startRow}`).alignment = {
                vertical: 'middle',
                horizontal: col === 'A' || col === 'B' ? 'left' : 'center',
            }
        })
        sheet.getCell(`F${startRow}`).numFmt = RUPIAH_FORMAT // Pajak
        sheet.getCell(`G${startRow}`).numFmt = RUPIAH_FORMAT // Total
    })

    sheet.columns = [
        { width: 12 }, { width: 14 }, { width: 22 }, { width: 14 },
        { width: 10 }, { width: 14 }, { width: 14 }, { width: 12 },
    ]

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.click()
    URL.revokeObjectURL(url)
}
