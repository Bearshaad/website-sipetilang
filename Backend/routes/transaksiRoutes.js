import { Router } from 'express'
import * as transaksiController from '../controllers/transaksiController.js'
import { verifyToken, requireRole } from '../middlewares/authMiddleware.js'

const router = Router()

router.post('/', verifyToken, requireRole('petugas'), transaksiController.createTransaksi)
router.get('/:id', verifyToken, requireRole('petugas'), transaksiController.getTransaksiById)
router.put('/:id/status', verifyToken, requireRole('petugas'), transaksiController.updateStatusTransaksi)

export default router