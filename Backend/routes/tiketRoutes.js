import { Router } from 'express'
import * as tiketController from '../controllers/tiketController.js'
import { verifyToken, requireRole } from '../middlewares/authMiddleware.js'

const router = Router()

router.get('/', verifyToken, requireRole('petugas'), tiketController.getAllTiket)
router.get('/:id', verifyToken, requireRole('petugas'), tiketController.getTiketById)
router.post('/', verifyToken, requireRole('petugas'), tiketController.createTiket)
router.put('/:id', verifyToken, requireRole('petugas'), tiketController.updateTiket)
router.delete('/:id', verifyToken, requireRole('petugas'), tiketController.deleteTiket)

export default router