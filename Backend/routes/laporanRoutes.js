import { Router } from 'express'
import * as laporanController from '../controllers/laporanController.js'
import { verifyToken, requireRole } from '../middlewares/authMiddleware.js'

const router = Router()

router.get('/', verifyToken, requireRole('petugas', 'owner'), laporanController.getLaporan)
router.get('/export', verifyToken, requireRole('petugas', 'owner'), laporanController.getLaporanExport)
router.get('/statistik', verifyToken, requireRole('owner'), laporanController.getStatistik)
router.get('/tahun', verifyToken, requireRole('petugas', 'owner'), laporanController.getTahunTersedia)

export default router