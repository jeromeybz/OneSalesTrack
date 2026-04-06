// src/routes/discounts.routes.js
import { Router } from 'express'
import {
  listDiscounts,
  listActiveDiscounts,
  getDiscountByProduct,
  createDiscount,
  updateDiscount,
  toggleDiscount,
  deleteDiscount,
} from '../controllers/discounts.controller.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()

// All authenticated users can read active discounts (needed by cart)
router.get('/all-active',         authenticate, listActiveDiscounts)
router.get('/product/:productId', authenticate, getDiscountByProduct)

// Admin only for management
router.get   ('/',          authenticate, requireRole('admin'), listDiscounts)
router.post  ('/',          authenticate, requireRole('admin'), createDiscount)
router.put   ('/:id',       authenticate, requireRole('admin'), updateDiscount)
router.patch ('/:id/toggle',authenticate, requireRole('admin'), toggleDiscount)
router.delete('/:id',       authenticate, requireRole('admin'), deleteDiscount)

export default router
