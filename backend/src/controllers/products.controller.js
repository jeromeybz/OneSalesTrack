// src/controllers/products.controller.js
// Product catalog CRUD — accessible to all authenticated users for reads, admin for writes

import prisma from '../utils/prisma.js'

/** GET /api/products  — supports ?category= (supplier filter) &search=&stockFilter= */
export async function listProducts(req, res, next) {
  try {
    const { category, search, stockFilter } = req.query

    const where = {}

    if (category) where.category = category
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku:  { contains: search } },
      ]
    }

    let products = await prisma.product.findMany({ where, orderBy: [{ category: 'asc' }, { name: 'asc' }] })

    // Stock filters (applied in JS — simpler for SQLite, fine for this scale)
    if (stockFilter === 'low') {
      products = products.filter(
        (p) => p.trackStock && p.stockQuantity > 0 && p.stockQuantity <= p.lowStockThreshold
      )
    } else if (stockFilter === 'out') {
      products = products.filter((p) => p.trackStock && p.stockQuantity <= 0)
    } else if (stockFilter === 'untracked') {
      products = products.filter((p) => !p.trackStock)
    }

    res.json(products)
  } catch (err) {
    next(err)
  }
}

/** GET /api/products/categories — list of distinct supplier strings */
export async function listCategories(req, res, next) {
  try {
    const raw = await prisma.product.findMany({
      where:    { category: { not: null } },
      select:   { category: true },
      distinct: ['category'],
      orderBy:  { category: 'asc' },
    })
    res.json(raw.map((r) => r.category))
  } catch (err) {
    next(err)
  }
}

/** GET /api/products/:id */
export async function getProduct(req, res, next) {
  try {
    const product = await prisma.product.findUniqueOrThrow({ where: { id: +req.params.id } })
    res.json(product)
  } catch (err) {
    next(err)
  }
}

/** POST /api/products  (admin only) */
export async function createProduct(req, res, next) {
  try {
    const { name, price, category, sku, trackStock, stockQuantity, lowStockThreshold } = req.body

    if (!name || price == null) {
      return res.status(400).json({ error: 'name and price are required.' })
    }

    const product = await prisma.product.create({
      data: {
        name:              name.trim(),
        price:             +price,
        category:          category?.trim() || null,
        sku:               sku?.trim()      || null,
        trackStock:        Boolean(trackStock),
        stockQuantity:     trackStock ? (+stockQuantity || 0) : 0,
        lowStockThreshold: trackStock ? (+lowStockThreshold || 5) : 0,
      },
    })

    res.status(201).json(product)
  } catch (err) {
    next(err)
  }
}

/** PUT /api/products/:id  (admin only) */
export async function updateProduct(req, res, next) {
  try {
    const id = +req.params.id
    const { name, price, category, sku, trackStock, stockQuantity, lowStockThreshold } = req.body

    const product = await prisma.product.update({
      where: { id },
      data:  {
        ...(name              != null && { name: name.trim() }),
        ...(price             != null && { price: +price }),
        ...(category          != null && { category: category.trim() || null }),
        ...(sku               != null && { sku: sku.trim() || null }),
        ...(trackStock        != null && { trackStock: Boolean(trackStock) }),
        ...(stockQuantity     != null && { stockQuantity: +stockQuantity }),
        ...(lowStockThreshold != null && { lowStockThreshold: +lowStockThreshold }),
      },
    })

    res.json(product)
  } catch (err) {
    next(err)
  }
}

/** DELETE /api/products/:id  (admin only) */
export async function deleteProduct(req, res, next) {
  try {
    await prisma.product.delete({ where: { id: +req.params.id } })
    res.json({ message: 'Product deleted.' })
  } catch (err) {
    next(err)
  }
}
