// src/middleware/auth.js
// JWT authentication + role-based access control middleware

import jwt from 'jsonwebtoken'
import prisma from '../utils/prisma.js'

/**
 * Verifies the Bearer JWT in the Authorization header.
 * Attaches `req.user` on success.
 */
export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' })
  }

  const token = authHeader.slice(7)

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user = await prisma.user.findUnique({ where: { id: payload.sub } })

    if (!user) return res.status(401).json({ error: 'User not found' })

    req.user = user
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

/**
 * Role guard — call after `authenticate`.
 * Usage: router.delete('/users/:id', authenticate, requireRole('admin'), handler)
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient role' })
    }
    next()
  }
}
