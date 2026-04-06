// src/controllers/auth.controller.js
// Handles login, token refresh, and password change

import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../utils/prisma.js'


/** POST /api/auth/login */
export async function login(req, res, next) {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' })
    }

    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase().trim() },
    })

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Incorrect username or password.' })
    }

    // Update lastLogin
    await prisma.user.update({
      where: { id: user.id },
      data:  { lastLogin: new Date() },
    })

    const token = jwt.sign(
      { sub: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN ?? '7d' }
    )

    res.json({
      token,
      user: {
        id:          user.id,
        username:    user.username,
        displayName: user.displayName,
        role:        user.role,
      },
    })
  } catch (err) {
    next(err)
  }
}

/** GET /api/auth/me  — returns the currently authenticated user */
export async function me(req, res) {
  const { id, username, displayName, role, createdAt, lastLogin } = req.user
  res.json({ id, username, displayName, role, createdAt, lastLogin })
}

/** PUT /api/auth/change-password */
export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'currentPassword and newPassword are required.' })
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' })
    }

    const valid = await bcrypt.compare(currentPassword, req.user.passwordHash)
    if (!valid) {
      return res.status(401).json({ error: 'Current password is incorrect.' })
    }

    const hash = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({
      where: { id: req.user.id },
      data:  { passwordHash: hash },
    })

    res.json({ message: 'Password changed successfully.' })
  } catch (err) {
    next(err)
  }
}
