// src/controllers/reports.controller.js
import prisma from '../utils/prisma.js'

/** GET /api/reports/monthly?year=2026&month=2 */
export async function monthlyReport(req, res, next) {
  try {
    const year  = parseInt(req.query.year  ?? new Date().getFullYear())
    const month = parseInt(req.query.month ?? new Date().getMonth() + 1)

    const daysInMonth = new Date(year, month, 0).getDate()
    const monthStart  = new Date(year, month - 1, 1)
    const monthEnd    = new Date(year, month, 0, 23, 59, 59, 999)

    // All active products
    const products = await prisma.product.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })

    // All transaction items this month — include full transaction details
    const txItems = await prisma.transactionItem.findMany({
      where: {
        transaction: { createdAt: { gte: monthStart, lte: monthEnd } },
      },
      include: {
        transaction: {
          select: {
            createdAt:         true,
            isDelivery:        true,
            deliveryRecipient: true,
            deliveryNote:      true,
          },
        },
      },
    })

    // Restocks/adjustments this month (for "addition" column)
    const monthMovements = await prisma.stockMovement.findMany({
      where: {
        createdAt:    { gte: monthStart, lte: monthEnd },
        movementType: { in: ['restock', 'adjust'] },
      },
    })

    // All delivery transactions this month (for the notes section)
    const deliveryTransactions = await prisma.transaction.findMany({
      where: {
        isDelivery: true,
        createdAt:  { gte: monthStart, lte: monthEnd },
      },
      include: {
        items: {
          select: { productId: true, productName: true, quantity: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    // Build product rows
    const rows = products.map((product) => {
      const productTxItems = txItems.filter((ti) => ti.productId === product.id)

      const totalSoldThisMonth  = productTxItems.reduce((s, ti) => s + ti.quantity, 0)
      const deliveryPullout     = productTxItems
        .filter((ti) => ti.transaction.isDelivery)
        .reduce((s, ti) => s + ti.quantity, 0)

      const walkInItems = productTxItems.filter((ti) => !ti.transaction.isDelivery)

      const restocksThisMonth = monthMovements
        .filter((m) => m.productId === product.id)
        .reduce((s, m) => s + m.quantityChange, 0)

      const beginningInventory = product.trackStock
        ? Math.max(0, product.stockQuantity + totalSoldThisMonth - restocksThisMonth)
        : null
      const addition = product.trackStock ? Math.max(0, restocksThisMonth) : null

      // Daily walk-in sales
      const dailySales = {}
      for (let d = 1; d <= daysInMonth; d++) dailySales[d] = 0
      walkInItems.forEach((ti) => {
        const day = new Date(ti.transaction.createdAt).getDate()
        dailySales[day] = (dailySales[day] || 0) + ti.quantity
      })

      const totalSold = Object.values(dailySales).reduce((s, v) => s + v, 0)

      return {
        id:               product.id,
        name:             product.name,
        category:         product.category,
        sku:              product.sku,
        trackStock:       product.trackStock,
        beginningInventory,
        addition,
        totalBeforeMonth: product.trackStock ? (beginningInventory + (addition ?? 0)) : null,
        deliveryPullout,
        dailySales,
        totalSold,
        totalAllTypes:    totalSoldThisMonth,
        endingInventory:  product.trackStock ? product.stockQuantity : null,
      }
    })

    // Build delivery notes — items as array so frontend can filter by category
    const deliveryNotes = deliveryTransactions.map((tx) => ({
      id:        tx.id,
      date:      tx.createdAt,
      recipient: tx.deliveryRecipient || '—',
      note:      tx.deliveryNote      || null,
      items:     tx.items.map((i) => ({
        productId:   i.productId,
        productName: i.productName,
        quantity:    i.quantity,
        label:       `${i.quantity} pcs. ${i.productName}`,
      })),
    }))

    res.json({ year, month, daysInMonth, rows, deliveryNotes })
  } catch (err) {
    next(err)
  }
}