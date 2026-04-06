// src/index.js
// SalesTrack API — Express + Prisma entry point

import 'dotenv/config'
import express from 'express'
import cors from 'cors'

import authRoutes        from './routes/auth.routes.js'
import usersRoutes       from './routes/users.routes.js'
import productsRoutes    from './routes/products.routes.js'
import transactionsRoutes from './routes/transactions.routes.js'
import inventoryRoutes   from './routes/inventory.routes.js'
import { errorHandler }  from './middleware/errorHandler.js'
import reportsRoutes     from './routes/reports.routes.js'
import discountsRoutes   from './routes/discounts.routes.js'

const app  = express()
const PORT = process.env.PORT ?? 3000

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') ?? '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',         authRoutes)
app.use('/api/users',        usersRoutes)
app.use('/api/products',     productsRoutes)
app.use('/api/transactions', transactionsRoutes)
app.use('/api/inventory',    inventoryRoutes)
app.use('/api/reports',      reportsRoutes)
app.use('/api/discounts',    discountsRoutes)

// 404
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }))

// Central error handler (must be last)
app.use(errorHandler)

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 SalesTrack API running on http://localhost:${PORT}`)
  console.log(`   Environment: ${process.env.NODE_ENV ?? 'development'}`)
})
