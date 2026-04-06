// src/routes/inventory.routes.js
import { Router } from 'express'
import {
  listMovements,
  getInventorySummary,
  restock,
  adjust,
} from '../controllers/inventory.controller.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()

// All inventory routes are admin only
router.use(authenticate, requireRole('admin'))

router.get ('/movements', listMovements)
router.get ('/summary',   getInventorySummary)
router.post('/restock',   restock)
router.post('/adjust',    adjust)

export default router
