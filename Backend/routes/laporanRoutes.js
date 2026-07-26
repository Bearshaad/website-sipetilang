import { Router } from 'express'
import * as laporanController from '../controllers/laporanController.js'
import { verifyToken, requireRole } from '../middlewares/authMiddleware.js'

const router = Router()

router.get('/', verifyToken, requireRole('petugas', 'owner'), laporanController.getLaporan)

export default router