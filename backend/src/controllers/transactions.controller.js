// src/controllers/transactions.controller.js
import prisma from '../utils/prisma.js'

/**
 * Calculate the price for a line item, applying a bundle discount if applicable.
 *
 * Logic:
 *   - If no active discount rule, return full price.
 *   - If qty >= minQuantity, calculate full bundles + remainder.
 *     Example: qty=7, minQty=3, bundlePrice=100, unitPrice=35
 *       bundles  = floor(7/3) = 2  → 2 × 100 = 200
 *       remainder= 7 % 3     = 1  → 1 × 35  =  35
 *       total    = 235
 *       original = 7 × 35   = 245
 *       discount = 245 - 235 = 10
 */
function applyDiscount(quantity, unitPrice, rule) {
  const originalTotal = quantity * unitPrice

  if (!rule || !rule.isActive || quantity < rule.minQuantity) {
    return {
      totalPrice:     originalTotal,
      originalTotal,
      discountAmount: 0,
      isDiscounted:   false,
    }
  }

  const bundles   = Math.floor(quantity / rule.minQuantity)
  const remainder = quantity % rule.minQuantity
  const totalPrice = (bundles * rule.discountedPrice) + (remainder * unitPrice)
  const discountAmount = +(originalTotal - totalPrice).toFixed(2)

  return {
    totalPrice:     +totalPrice.toFixed(2),
    originalTotal:  +originalTotal.toFixed(2),
    discountAmount,
    isDiscounted:   discountAmount > 0,
  }
}

/** POST /api/transactions — checkout / record a sale */
export async function createTransaction(req, res, next) {
  try {
    const { items, isDelivery = false, deliveryRecipient = null, deliveryNote = null } = req.body

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items array is required and must not be empty.' })
    }

    // Fetch all products in one query
    const productIds = items.map((i) => +i.productId)
    const products   = await prisma.product.findMany({
      where:   { id: { in: productIds } },
      include: { discount: true },   // include active discount rule
    })
    const productMap = Object.fromEntries(products.map((p) => [p.id, p]))

    // Validate items
    for (const item of items) {
      const product = productMap[+item.productId]
      if (!product) {
        return res.status(400).json({ error: `Product ${item.productId} not found.` })
      }
      if (!item.quantity || +item.quantity < 1) {
        return res.status(400).json({ error: `Invalid quantity for product ${product.name}.` })
      }
    }

    const transaction = await prisma.$transaction(async (tx) => {
      // 1. Create the transaction record
      const newTx = await tx.transaction.create({
        data: {
          userId:            req.user.id,
          cashierName:       req.user.displayName,
          isDelivery:        Boolean(isDelivery),
          deliveryRecipient: isDelivery ? (deliveryRecipient?.trim() || null) : null,
          deliveryNote:      isDelivery ? (deliveryNote?.trim()      || null) : null,
        },
      })

      // 2. Create transaction items, apply discounts, update stock
      for (const item of items) {
        const product  = productMap[+item.productId]
        const quantity = +item.quantity

        // Apply discount rule if one exists and is active
        const { totalPrice, originalTotal, discountAmount, isDiscounted } =
          applyDiscount(quantity, product.price, product.discount)

        await tx.transactionItem.create({
          data: {
            transactionId:  newTx.id,
            productId:      product.id,
            productName:    product.name,
            quantity,
            unitPrice:      product.price,
            totalPrice,
            originalTotal,
            discountAmount,
            isDiscounted,
          },
        })

        if (product.trackStock) {
          const stockAfter = product.stockQuantity - quantity
          await tx.product.update({
            where: { id: product.id },
            data:  { stockQuantity: stockAfter },
          })
          await tx.stockMovement.create({
            data: {
              productId:      product.id,
              productName:    product.name,
              movementType:   'sale',
              quantityChange: -quantity,
              stockAfter,
              note:           `Sale — Tx #${newTx.id}${isDiscounted ? ' (discounted)' : ''}`,
              transactionId:  newTx.id,
              userId:         req.user.id,
            },
          })
        }
      }

      return tx.transaction.findUnique({
        where:   { id: newTx.id },
        include: { items: true },
      })
    })

    res.status(201).json(transaction)
  } catch (err) {
    next(err)
  }
}

/** GET /api/transactions — admin: sales log */
export async function listTransactions(req, res, next) {
  try {
    const { date, from, to } = req.query
    const where = {}

    if (date) {
      const start = new Date(date)
      const end   = new Date(date)
      end.setDate(end.getDate() + 1)
      where.createdAt = { gte: start, lt: end }
    } else if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = new Date(from)
      if (to) {
        const toDate = new Date(to)
        toDate.setDate(toDate.getDate() + 1)
        where.createdAt.lt = toDate
      }
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include:  { items: true },
      orderBy:  { createdAt: 'desc' },
    })

    const totalRevenue = transactions.reduce(
      (sum, t) => sum + t.items.reduce((s, i) => s + i.totalPrice, 0), 0
    )
    const totalItems = transactions.reduce(
      (sum, t) => sum + t.items.reduce((s, i) => s + i.quantity, 0), 0
    )
    const totalDiscount = transactions.reduce(
      (sum, t) => sum + t.items.reduce((s, i) => s + i.discountAmount, 0), 0
    )

    res.json({
      summary: {
        revenue:       totalRevenue,
        transactions:  transactions.length,
        itemsSold:     totalItems,
        totalDiscount,
      },
      transactions,
    })
  } catch (err) {
    next(err)
  }
}

/** GET /api/transactions/:id */
export async function getTransaction(req, res, next) {
  try {
    const transaction = await prisma.transaction.findUniqueOrThrow({
      where:   { id: +req.params.id },
      include: { items: true, user: { select: { displayName: true, role: true } } },
    })
    res.json(transaction)
  } catch (err) {
    next(err)
  }
}
