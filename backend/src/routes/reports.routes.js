// src/routes/reports.routes.js
import { Router } from 'express'
import { monthlyReport } from '../controllers/reports.controller.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()

router.get('/monthly', authenticate, requireRole('admin'), monthlyReport)

export default router
