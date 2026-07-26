import { Router } from 'express'
import * as ownerController from '../controllers/ownerController.js'
import { verifyToken, requireRole } from '../middlewares/authMiddleware.js'

const router = Router()

router.get('/', verifyToken, requireRole('owner'), ownerController.getAllOwner)
router.get('/:id', verifyToken, requireRole('owner'), ownerController.getOwnerById)
router.post('/', verifyToken, requireRole('owner'), ownerController.createOwner)
router.put('/:id', verifyToken, requireRole('owner'), ownerController.updateOwner)

export default router