# SalesTrack — Backend API

Node.js + Express + Prisma ORM backend for the `sales_app_v3.html` prototype.

---

## Tech Stack

| Layer      | Choice                       |
|------------|------------------------------|
| Runtime    | Node.js (ESM)                |
| Framework  | Express 4                    |
| ORM        | Prisma 5                     |
| Database   | SQLite (dev) / PostgreSQL or MySQL (prod) |
| Auth       | JWT + bcryptjs               |

---

## Project Structure

```
salestrack-backend/
├── prisma/
│   ├── schema.prisma        # Data models (mirrors HTML app's SQL schema)
│   └── seed.js              # Demo data (same users & products as prototype)
├── src/
│   ├── controllers/
│   │   ├── auth.controller.js         # Login, /me, change password
│   │   ├── users.controller.js        # Admin user CRUD
│   │   ├── products.controller.js     # Product catalog CRUD
│   │   ├── transactions.controller.js # Checkout + sales log
│   │   └── inventory.controller.js    # Restock, adjust, movements
│   ├── middleware/
│   │   ├── auth.js          # JWT authenticate + requireRole guard
│   │   └── errorHandler.js  # Central error handler
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── users.routes.js
│   │   ├── products.routes.js
│   │   ├── transactions.routes.js
│   │   └── inventory.routes.js
│   ├── utils/
│   │   └── prisma.js        # Singleton Prisma client
│   └── index.js             # Express app entry point
├── .env                     # Your local secrets (gitignored)
├── .env.example             # Template for teammates
├── .gitignore
└── package.json
```

---

## Quick Start

### 1. Install dependencies
```bash
cd salestrack-backend
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env — set DATABASE_URL and JWT_SECRET
```

### 3. Run database migration
```bash
npm run db:migrate
# When prompted, name the migration: init
```

### 4. Seed demo data
```bash
npm run db:seed
```

### 5. Start the dev server
```bash
npm run dev
# API available at http://localhost:3000
```

---

## Switching to PostgreSQL / MySQL

1. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"  // or "mysql"
     url      = env("DATABASE_URL")
   }
   ```

2. Update `DATABASE_URL` in `.env`:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/salestrack"
   ```

3. Re-run migration:
   ```bash
   npm run db:migrate
   ```

> **Note:** The `Role` and `MovementType` enums in `schema.prisma` are only supported by PostgreSQL and MySQL. For SQLite, Prisma stores them as plain strings — no changes needed for dev.

---

## API Reference

### Auth
| Method | Endpoint                   | Access | Description                  |
|--------|----------------------------|--------|------------------------------|
| POST   | `/api/auth/login`          | Public | Login, returns JWT           |
| GET    | `/api/auth/me`             | Auth   | Current user info            |
| PUT    | `/api/auth/change-password`| Auth   | Change own password          |

### Users (Admin only)
| Method | Endpoint         | Description        |
|--------|------------------|--------------------|
| GET    | `/api/users`     | List all users     |
| GET    | `/api/users/:id` | Get single user    |
| POST   | `/api/users`     | Create user        |
| PUT    | `/api/users/:id` | Update user        |
| DELETE | `/api/users/:id` | Delete user        |

### Products
| Method | Endpoint                    | Access       | Description             |
|--------|-----------------------------|--------------|-------------------------|
| GET    | `/api/products`             | Auth         | List (supports ?category=&search=&stockFilter=) |
| GET    | `/api/products/categories`  | Auth         | Distinct category list  |
| GET    | `/api/products/:id`         | Auth         | Single product          |
| POST   | `/api/products`             | Admin        | Create product          |
| PUT    | `/api/products/:id`         | Admin        | Update product          |
| DELETE | `/api/products/:id`         | Admin        | Delete product          |

### Transactions
| Method | Endpoint               | Access | Description                  |
|--------|------------------------|--------|------------------------------|
| POST   | `/api/transactions`    | Auth   | Checkout (creates sale + deducts stock) |
| GET    | `/api/transactions`    | Admin  | Sales log (?date= or ?from=&to=) |
| GET    | `/api/transactions/:id`| Admin  | Single transaction           |

**Checkout body:**
```json
{
  "items": [
    { "productId": 1, "quantity": 2 },
    { "productId": 5, "quantity": 1 }
  ]
}
```

### Inventory (Admin only)
| Method | Endpoint                    | Description               |
|--------|-----------------------------|---------------------------|
| GET    | `/api/inventory/summary`    | Low stock counts          |
| GET    | `/api/inventory/movements`  | Stock movement log        |
| POST   | `/api/inventory/restock`    | Add stock to a product    |
| POST   | `/api/inventory/adjust`     | Set stock to exact amount |

**Restock body:**
```json
{ "productId": 3, "quantity": 50, "note": "Weekly delivery" }
```

**Adjust body:**
```json
{ "productId": 3, "newQuantity": 25, "note": "Stocktake correction" }
```

---

## Default Credentials (from seed)

| Username  | Password   | Role     |
|-----------|------------|----------|
| `admin`   | `admin123` | admin    |
| `cashier` | `cash123`  | cashier  |

> Change these immediately in any non-development environment.

---

## Useful Commands

```bash
npm run dev          # Start with nodemon (auto-restart)
npm run start        # Production start
npm run db:migrate   # Run pending migrations
npm run db:generate  # Regenerate Prisma client after schema changes
npm run db:studio    # Open Prisma Studio (visual DB browser)
npm run db:seed      # Re-seed demo data
npm run db:reset     # Drop + re-migrate + re-seed (destructive!)
```
