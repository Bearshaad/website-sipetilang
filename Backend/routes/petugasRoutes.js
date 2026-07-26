import { Router } from 'express'
import * as petugasController from '../controllers/petugasController.js'
import { verifyToken, requireRole } from '../middlewares/authMiddleware.js'

const router = Router()

router.get('/', verifyToken, requireRole('owner'), petugasController.getAllPetugas)
router.get('/:id', verifyToken, requireRole('owner'), petugasController.getPetugasById)
router.post('/', verifyToken, requireRole('owner'), petugasController.createPetugas)
router.put('/:id', verifyToken, requireRole('owner'), petugasController.updatePetugas)

export default router