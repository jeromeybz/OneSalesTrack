// src/controllers/inventory.controller.js
// Stock movements — restock and manual adjustments (admin only)

import prisma from '../utils/prisma.js'

/** GET /api/inventory/movements  — full stock movement log */
export async function listMovements(req, res, next) {
  try {
    const { productId, type, limit = 100 } = req.query

    const where = {}
    if (productId)  where.productId    = +productId
    if (type)       where.movementType = type

    const movements = await prisma.stockMovement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take:    +limit,
    })

    res.json(movements)
  } catch (err) {
    next(err)
  }
}

/** GET /api/inventory/summary  — low stock counts etc. */
export async function getInventorySummary(req, res, next) {
  try {
    const all = await prisma.product.findMany()

    const tracked    = all.filter((p) => p.trackStock)
    const lowStock   = tracked.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= p.lowStockThreshold)
    const outOfStock = tracked.filter((p) => p.stockQuantity <= 0)

    res.json({
      total:       all.length,
      tracked:     tracked.length,
      lowStock:    lowStock.length,
      outOfStock:  outOfStock.length,
      lowStockItems:  lowStock.map((p) => ({ id: p.id, name: p.name, stockQuantity: p.stockQuantity, lowStockThreshold: p.lowStockThreshold })),
      outOfStockItems: outOfStock.map((p) => ({ id: p.id, name: p.name })),
    })
  } catch (err) {
    next(err)
  }
}

/** POST /api/inventory/restock  — add stock to a product */
export async function restock(req, res, next) {
  try {
    const { productId, quantity, note } = req.body

    if (!productId || !quantity || +quantity < 1) {
      return res.status(400).json({ error: 'productId and a positive quantity are required.' })
    }

    const product = await prisma.product.findUniqueOrThrow({ where: { id: +productId } })

    if (!product.trackStock) {
      return res.status(400).json({ error: 'This product does not have stock tracking enabled.' })
    }

    const stockAfter = product.stockQuantity + +quantity

    const [updatedProduct, movement] = await prisma.$transaction([
      prisma.product.update({
        where: { id: product.id },
        data:  { stockQuantity: stockAfter },
      }),
      prisma.stockMovement.create({
        data: {
          productId:      product.id,
          productName:    product.name,
          movementType:   'restock',
          quantityChange: +quantity,
          stockAfter,
          note:           note?.trim() || 'Manual restock',
          userId:         req.user.id,
        },
      }),
    ])

    res.json({ product: updatedProduct, movement })
  } catch (err) {
    next(err)
  }
}

/** POST /api/inventory/adjust  — set stock to an exact value */
export async function adjust(req, res, next) {
  try {
    const { productId, newQuantity, note } = req.body

    if (!productId || newQuantity == null || +newQuantity < 0) {
      return res.status(400).json({ error: 'productId and a non-negative newQuantity are required.' })
    }

    const product = await prisma.product.findUniqueOrThrow({ where: { id: +productId } })

    if (!product.trackStock) {
      return res.status(400).json({ error: 'This product does not have stock tracking enabled.' })
    }

    const quantityChange = +newQuantity - product.stockQuantity
    const stockAfter     = +newQuantity

    const [updatedProduct, movement] = await prisma.$transaction([
      prisma.product.update({
        where: { id: product.id },
        data:  { stockQuantity: stockAfter },
      }),
      prisma.stockMovement.create({
        data: {
          productId:      product.id,
          productName:    product.name,
          movementType:   'adjust',
          quantityChange,
          stockAfter,
          note:           note?.trim() || 'Manual adjustment',
          userId:         req.user.id,
        },
      }),
    ])

    res.json({ product: updatedProduct, movement })
  } catch (err) {
    next(err)
  }
}
