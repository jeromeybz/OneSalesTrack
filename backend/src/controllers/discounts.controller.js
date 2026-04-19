// src/controllers/discounts.controller.js
// CRUD for optional per-product discount rules (admin only)

import prisma from '../utils/prisma.js'

/** GET /api/discounts — list all discount rules with product info */
export async function listDiscounts(req, res, next) {
  try {
    const discounts = await prisma.productDiscount.findMany({
      include: { product: { select: { id: true, name: true, price: true, category: true } } },
      orderBy: { createdAt: 'desc' },
    })
    res.json(discounts)
  } catch (err) {
    next(err)
  }
}

/** GET /api/discounts/all-active — lightweight list for cart use */
export async function listActiveDiscounts(req, res, next) {
  try {
    const discounts = await prisma.productDiscount.findMany({
      where:   { isActive: true },
      select:  { productId: true, minQuantity: true, discountedPrice: true },
    })
    res.json(discounts)
  } catch (err) {
    next(err)
  }
}

/** GET /api/discounts/product/:productId — get rule for one product */
export async function getDiscountByProduct(req, res, next) {
  try {
    const discount = await prisma.productDiscount.findUnique({
      where: { productId: +req.params.productId },
    })
    // Return null gracefully if no rule exists — not a 404
    res.json(discount ?? null)
  } catch (err) {
    next(err)
  }
}

/** POST /api/discounts — create a rule for a product */
export async function createDiscount(req, res, next) {
  try {
    const { productId, minQuantity, discountedPrice } = req.body

    if (!productId || !minQuantity || discountedPrice == null) {
      return res.status(400).json({ error: 'productId, minQuantity, and discountedPrice are required.' })
    }
    if (+minQuantity < 2) {
      return res.status(400).json({ error: 'minQuantity must be at least 2.' })
    }
    if (+discountedPrice <= 0) {
      return res.status(400).json({ error: 'discountedPrice must be greater than 0.' })
    }

    // Verify product exists
    const product = await prisma.product.findUnique({ where: { id: +productId } })
    if (!product) return res.status(404).json({ error: 'Product not found.' })

    const discount = await prisma.productDiscount.create({
      data: {
        productId:       +productId,
        minQuantity:     +minQuantity,
        discountedPrice: +discountedPrice,
        isActive:        true,
      },
      include: { product: { select: { id: true, name: true, price: true } } },
    })

    res.status(201).json(discount)
  } catch (err) {
    // Unique constraint — product already has a rule
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'This product already has a discount rule. Edit it instead.' })
    }
    next(err)
  }
}

/** PUT /api/discounts/:id — update rule */
export async function updateDiscount(req, res, next) {
  try {
    const { minQuantity, discountedPrice, isActive } = req.body
    const id = +req.params.id

    const data = {}
    if (minQuantity     != null) data.minQuantity     = +minQuantity
    if (discountedPrice != null) data.discountedPrice = +discountedPrice
    if (isActive        != null) data.isActive        = Boolean(isActive)

    if (data.minQuantity < 2) {
      return res.status(400).json({ error: 'minQuantity must be at least 2.' })
    }

    const discount = await prisma.productDiscount.update({
      where:   { id },
      data,
      include: { product: { select: { id: true, name: true, price: true } } },
    })
    res.json(discount)
  } catch (err) {
    next(err)
  }
}

/** PATCH /api/discounts/:id/toggle — flip isActive */
export async function toggleDiscount(req, res, next) {
  try {
    const id       = +req.params.id
    const existing = await prisma.productDiscount.findUniqueOrThrow({ where: { id } })

    const discount = await prisma.productDiscount.update({
      where: { id },
      data:  { isActive: !existing.isActive },
      include: { product: { select: { id: true, name: true, price: true } } },
    })
    res.json(discount)
  } catch (err) {
    next(err)
  }
}

/** DELETE /api/discounts/:id — remove rule entirely */
export async function deleteDiscount(req, res, next) {
  try {
    await prisma.productDiscount.delete({ where: { id: +req.params.id } })
    res.json({ message: 'Discount rule deleted.' })
  } catch (err) {
    next(err)
  }
}
