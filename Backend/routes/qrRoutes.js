import { Router } from 'express'
import * as qrController from '../controllers/qrController.js'
import { verifyDeviceKey } from '../middlewares/deviceAuthMiddleware.js'

const router = Router()

router.post('/validasi', verifyDeviceKey, qrController.validateQr)

export default router