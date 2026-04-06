// src/middleware/errorHandler.js
// Central error handler — must be the last middleware registered in index.js

export function errorHandler(err, req, res, next) {
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path}`, err)

  // Prisma known request errors (e.g. unique constraint, not found)
  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'A record with that value already exists.' })
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found.' })
  }

  const status = err.statusCode ?? err.status ?? 500
  const message = err.message ?? 'Internal server error'

  res.status(status).json({ error: message })
}
