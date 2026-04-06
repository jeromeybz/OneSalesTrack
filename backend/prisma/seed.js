// prisma/seed.js

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ── Wipe all rows (order matters — foreign keys first) ─────────────────────
  await prisma.stockMovement.deleteMany()
  await prisma.transactionItem.deleteMany()
  await prisma.transaction.deleteMany()
  await prisma.product.deleteMany()
  await prisma.user.deleteMany()
  console.log('  ✔ All tables cleared')

  // ── Users ──────────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('admin123', 10)
  const cashHash  = await bcrypt.hash('cash123', 10)

  await prisma.user.createMany({
    data: [
      { username: 'admin',   passwordHash: adminHash, displayName: 'Administrator', role: 'admin'   },
      { username: 'cashier', passwordHash: cashHash,  displayName: 'Cashier One',   role: 'cashier' },
    ],
  })
  console.log('  ✔ Users seeded  (admin / admin123 · cashier / cash123)')

  // ── Products ───────────────────────────────────────────────────────────────
  // category field = Supplier name
  // price is set to 0 — update each product's price from the Products page

  const products = [
    // ── Supplier 1 — 100g ──────────────────────────────────────────────────
    { name: '100g Garlic Overload', price: 100, category: 'Supplier 1', trackStock: true, stockQuantity: 0, lowStockThreshold: 10 },
    { name: '100g Barbecue',        price: 200, category: 'Supplier 1', trackStock: true, stockQuantity: 0, lowStockThreshold: 10 },
    { name: '100g Cheese',          price: 150, category: 'Supplier 1', trackStock: true, stockQuantity: 0, lowStockThreshold: 10 },
    { name: '100g Chili',           price: 80, category: 'Supplier 1', trackStock: true, stockQuantity: 0, lowStockThreshold: 10 },

    // ── Supplier 1 — 180g ──────────────────────────────────────────────────
    { name: '180g Garlic Overload', price: 100, category: 'Supplier 1', trackStock: true, stockQuantity: 0, lowStockThreshold: 5 },
    { name: '180g Barbecue',        price: 100, category: 'Supplier 1', trackStock: true, stockQuantity: 0, lowStockThreshold: 5 },
    { name: '180g Cheese',          price: 150, category: 'Supplier 1', trackStock: true, stockQuantity: 0, lowStockThreshold: 5 },
    { name: '180g Chili',           price: 80, category: 'Supplier 1', trackStock: true, stockQuantity: 0, lowStockThreshold: 5 },

    // ── Supplier 1 — 300g ──────────────────────────────────────────────────
    { name: '300g Garlic Overload', price: 200, category: 'Supplier 1', trackStock: true, stockQuantity: 0, lowStockThreshold: 5 },
    { name: '300g Barbecue',        price: 200, category: 'Supplier 1', trackStock: true, stockQuantity: 0, lowStockThreshold: 5 },
    { name: '300g Cheese',          price: 250, category: 'Supplier 1', trackStock: true, stockQuantity: 0, lowStockThreshold: 5 },
    { name: '300g Chili',           price: 222, category: 'Supplier 1', trackStock: true, stockQuantity: 0, lowStockThreshold: 5 },

    // ── Supplier 1 — Others ────────────────────────────────────────────────
    { name: 'Chichamani, 500g',     price: 500, category: 'Supplier 1', trackStock: true, stockQuantity: 0, lowStockThreshold: 5 },
    { name: 'Chichamani, 180g',     price: 100, category: 'Supplier 1', trackStock: true, stockQuantity: 0, lowStockThreshold: 5 },
    { name: 'Pure Mani',            price: 80, category: 'Supplier 1', trackStock: true, stockQuantity: 0, lowStockThreshold: 5 },

    // ── Supplier 2 — Vinegar ───────────────────────────────────────────────
    { name: 'Vinegar, Plain',       price: 300, category: 'Supplier 2', trackStock: true, stockQuantity: 0, lowStockThreshold: 5 },
    { name: 'Vinegar, Spicy',       price: 250, category: 'Supplier 2', trackStock: true, stockQuantity: 0, lowStockThreshold: 5 },

    // ── Supplier 2 — Longganisa ────────────────────────────────────────────
    { name: 'Longganisa, 1kg',      price: 260, category: 'Supplier 2', trackStock: true, stockQuantity: 0, lowStockThreshold: 5 },
    { name: 'Longganisa, 1/2kg',    price: 130, category: 'Supplier 2', trackStock: true, stockQuantity: 0, lowStockThreshold: 5 },

    // ── Supplier 2 — Bagnet ────────────────────────────────────────────────
    { name: 'Bagnet, 1kg',          price: 200, category: 'Supplier 2', trackStock: true, stockQuantity: 0, lowStockThreshold: 3 },
    { name: 'Bagnet, 1/2kg',        price: 100, category: 'Supplier 2', trackStock: true, stockQuantity: 0, lowStockThreshold: 3 },
  ]

  await prisma.product.createMany({ data: products })
  console.log(`  ✔ ${products.length} products seeded`)
  console.log('✅ Seeding complete.')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())