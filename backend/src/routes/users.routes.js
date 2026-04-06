// src/routes/users.routes.js
import { Router } from 'express'
import { listUsers, getUser, createUser, updateUser, deleteUser } from '../controllers/users.controller.js'
import { authenticate, requireRole } from '../middleware/auth.js'

const router = Router()

// All user routes require authentication + admin role
router.use(authenticate, requireRole('admin'))

router.get   ('/',    listUsers)
router.get   ('/:id', getUser)
router.post  ('/',    createUser)
router.put   ('/:id', updateUser)
router.delete('/:id', deleteUser)

export default router
