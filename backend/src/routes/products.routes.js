// src/routes/products.routes.js
import { Router } from 'express'
import {
  listProducts,
  listCategories,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/products.controller.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()

// All product routes require authentication
router.use(authenticate)

// Read — any authenticated user (cashiers need to see products)
router.get('/',            listProducts)
router.get('/categories',  listCategories)
router.get('/:id',         getProduct)

// Write — admin only
router.post  ('/',    requireRole('admin'), createProduct)
router.put   ('/:id', requireRole('admin'), updateProduct)
router.delete('/:id', requireRole('admin'), deleteProduct)

export default router
