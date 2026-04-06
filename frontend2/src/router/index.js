// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/pages/LoginPage.vue'),
    meta: { guest: true },
  },
  {
    path: '/',
    component: () => import('@/components/layout/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/sales',
      },
      {
        path: 'sales',
        name: 'Sales',
        component: () => import('@/pages/SalesPage.vue'),
      },
      {
        path: 'inventory',
        name: 'Inventory',
        component: () => import('@/pages/InventoryPage.vue'),
        meta: { adminOnly: true },
      },
      {
        path: 'products',
        name: 'Products',
        component: () => import('@/pages/ProductsPage.vue'),
        meta: { adminOnly: true },
      },
      {
        path: 'transactions',
        name: 'Transactions',
        component: () => import('@/pages/TransactionsPage.vue'),
        meta: { adminOnly: true },
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/pages/UsersPage.vue'),
        meta: { adminOnly: true },
      },
      {
        path: 'reports',
        name: 'Reports',
        component: () => import('@/pages/SalesReportPage.vue'),
        meta: { adminOnly: true },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  // Restore user from token if we have a token but no user yet
  if (auth.token && !auth.user) {
    try {
      await auth.fetchMe()
    } catch {
      auth.logout()
      return { name: 'Login' }
    }
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'Login' }
  }

  if (to.meta.guest && auth.isAuthenticated) {
    return { path: '/sales' }
  }

  if (to.meta.adminOnly && !auth.isAdmin) {
    return { path: '/sales' }
  }
})

export default router
