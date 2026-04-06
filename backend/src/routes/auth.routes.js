// src/routes/auth.routes.js
import { Router } from 'express'
import { login, me, changePassword } from '../controllers/auth.controller.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.post('/login',           login)
router.get ('/me',              authenticate, me)
router.put ('/change-password', authenticate, changePassword)

export default router
