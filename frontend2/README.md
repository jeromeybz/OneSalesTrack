# SalesTrack — Frontend

Vue 3 + Pinia + Tailwind CSS frontend for the SalesTrack POS system.

---

## Tech Stack

| Layer      | Choice                          |
|------------|---------------------------------|
| Framework  | Vue 3 (`<script setup>` only)   |
| State      | Pinia stores                    |
| Routing    | Vue Router 4                    |
| Styling    | Tailwind CSS v3                 |
| HTTP       | Axios (with JWT interceptor)    |
| Build      | Vite 5                          |

---

## Project Structure

```
salestrack-frontend/
├── src/
│   ├── api/                    # One file per backend resource
│   │   ├── client.js           # Axios instance + JWT interceptor
│   │   ├── auth.js
│   │   ├── products.js
│   │   ├── transactions.js
│   │   ├── inventory.js
│   │   └── users.js
│   │
│   ├── stores/                 # Pinia stores — all shared state lives here
│   │   ├── auth.js             # User session, login, logout
│   │   ├── cart.js             # Active cart + checkout
│   │   ├── products.js         # Product catalog + CRUD
│   │   ├── transactions.js     # Sales log
│   │   ├── inventory.js        # Stock movements, restock, adjust
│   │   ├── users.js            # User management
│   │   └── toast.js            # Global notifications
│   │
│   ├── router/
│   │   └── index.js            # Routes + auth guards + admin guards
│   │
│   ├── pages/                  # One component per route
│   │   ├── LoginPage.vue
│   │   ├── SalesPage.vue
│   │   ├── ProductsPage.vue
│   │   ├── InventoryPage.vue
│   │   ├── TransactionsPage.vue
│   │   └── UsersPage.vue
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.vue   # Root layout wrapper
│   │   │   └── AppNav.vue      # Top navigation bar
│   │   ├── ui/                 # Reusable primitives
│   │   │   ├── AppModal.vue
│   │   │   ├── ConfirmModal.vue
│   │   │   ├── ToastContainer.vue
│   │   │   ├── StockBadge.vue
│   │   │   └── SummaryCard.vue
│   │   └── sales/
│   │       └── CartPanel.vue
│   │
│   ├── utils/
│   │   └── format.js           # Currency, date, stock status helpers
│   │
│   ├── assets/
│   │   └── main.css            # Tailwind + global component classes
│   │
│   ├── App.vue
│   └── main.js
│
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

---

## Quick Start

### 1. Install dependencies
```bash
cd salestrack-frontend
npm install
```

### 2. Make sure the backend is running
```bash
# In salestrack-backend/
npm run dev   # → http://localhost:3000
```

### 3. Start the frontend
```bash
npm run dev   # → http://localhost:5173
```

The Vite dev server proxies all `/api/*` requests to `http://localhost:3000` automatically — no CORS issues during development.

---

## Rules Followed

1. **Vue 3 `<script setup>` only** — no `export default {}`, no Options API anywhere.
2. **All shared state in Pinia** — components never own state that needs to be shared; they call stores.
3. **Tailwind CSS** — utility classes only, with a small set of reusable component classes defined in `main.css` (`btn`, `card`, `input`, `label`, `badge`).
4. **Modular & scalable** — `api/`, `stores/`, `pages/`, `components/`, `utils/` are clearly separated. Adding a new feature means adding one API file, one store, one page — no touching unrelated code.

---

## Role-Based Access

| Route          | Cashier | Admin |
|----------------|---------|-------|
| `/sales`       | ✓       | ✓     |
| `/inventory`   | ✗       | ✓     |
| `/products`    | ✗       | ✓     |
| `/transactions`| ✗       | ✓     |
| `/users`       | ✗       | ✓     |

Guards are enforced in `router/index.js`. Cashiers attempting to access admin routes are redirected to `/sales`.

---

## Build for Production

```bash
npm run build
# Output in dist/
```
