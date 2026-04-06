// src/routes/transactions.routes.js
import { Router } from 'express'
import {
  createTransaction,
  listTransactions,
  getTransaction,
} from '../controllers/transactions.controller.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

// Any authenticated user can create a transaction (cashiers check out sales)
router.post('/', createTransaction)

// Only admins can view the full sales log
router.get('/',    requireRole('admin'), listTransactions)
router.get('/:id', requireRole('admin'), getTransaction)

export default router
