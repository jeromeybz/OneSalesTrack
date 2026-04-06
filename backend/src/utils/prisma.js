// src/utils/prisma.js
// Singleton Prisma client — import this everywhere instead of `new PrismaClient()`

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
})

export default prisma
