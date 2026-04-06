// src/controllers/users.controller.js
// Admin-only CRUD for user management

import bcrypt from 'bcryptjs'
import prisma from '../utils/prisma.js'

const safeUser = (u) => ({
  id:          u.id,
  username:    u.username,
  displayName: u.displayName,
  role:        u.role,
  createdAt:   u.createdAt,
  lastLogin:   u.lastLogin,
})

/** GET /api/users */
export async function listUsers(req, res, next) {
  try {
    const users = await prisma.user.findMany({ orderBy: { createdAt: 'asc' } })
    res.json(users.map(safeUser))
  } catch (err) {
    next(err)
  }

}

/** GET /api/users/:id */
export async function getUser(req, res, next) {
  try {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: +req.params.id } })
    res.json(safeUser(user))
  } catch (err) {
    next(err)
  }
}

/** POST /api/users */
export async function createUser(req, res, next) {
  try {
    const { username, password, displayName, role } = req.body

    if (!username || !password || !displayName) {
      return res.status(400).json({ error: 'username, password, and displayName are required.' })
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' })
    }
    if (role && !['admin', 'cashier'].includes(role)) {
      return res.status(400).json({ error: 'role must be "admin" or "cashier".' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        username:    username.toLowerCase().trim(),
        passwordHash,
        displayName: displayName.trim(),
        role:        role ?? 'cashier',
      },
    })

    res.status(201).json(safeUser(user))
  } catch (err) {
    next(err)
  }
}

/** PUT /api/users/:id */
export async function updateUser(req, res, next) {
  try {
    const id = +req.params.id
    const { displayName, role, password } = req.body

    const data = {}
    if (displayName) data.displayName = displayName.trim()
    if (role) {
      if (!['admin', 'cashier'].includes(role)) {
        return res.status(400).json({ error: 'role must be "admin" or "cashier".' })
      }
      data.role = role
    }
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters.' })
      }
      data.passwordHash = await bcrypt.hash(password, 10)
    }

    const user = await prisma.user.update({ where: { id }, data })
    res.json(safeUser(user))
  } catch (err) {
    next(err)
  }
}

/** DELETE /api/users/:id */
export async function deleteUser(req, res, next) {
  try {
    const id = +req.params.id

    if (id === req.user.id) {
      return res.status(400).json({ error: "You can't delete your own account." })
    }

    await prisma.user.delete({ where: { id } })
    res.json({ message: 'User deleted.' })
  } catch (err) {
    next(err)
  }
}
