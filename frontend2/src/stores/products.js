// src/stores/products.js
import { defineStore } from 'pinia'
import { productsApi } from '@/api/products'

export const useProductsStore = defineStore('products', {

  // ── State ──────────────────────────────────────────────────────────────────
  state: () => ({
    /** @type {Array} Full list of products from the API */
    products:   [],
    /** @type {string[]} Distinct category strings */
    categories: [],
    loading:    false,
    /** @type {string | null} */
    error:      null,
  }),

  // ── Getters ────────────────────────────────────────────────────────────────
  getters: {
    /** Products that are tracked and at or below their low-stock threshold */
    lowStockProducts: (state) =>
      state.products.filter(
        (p) => p.trackStock && p.stockQuantity <= p.lowStockThreshold && p.stockQuantity > 0
      ),

    /** Products that are tracked and fully out of stock */
    outOfStockProducts: (state) =>
      state.products.filter((p) => p.trackStock && p.stockQuantity <= 0),

    /** Total number of active products */
    totalCount: (state) => state.products.length,
  },

  // ── Actions ────────────────────────────────────────────────────────────────
  actions: {
    /** Fetch product list — supports ?category, ?search, ?stockFilter */
    async fetchProducts(params = {}) {
      this.loading = true
      this.error   = null
      try {
        const { data } = await productsApi.list(params)
        this.products = data
      } catch (e) {
        this.error = e.response?.data?.error ?? 'Failed to fetch products'
      } finally {
        this.loading = false
      }
    },

    /** Fetch all distinct category strings */
    async fetchCategories() {
      const { data } = await productsApi.categories()
      this.categories = data
    },

    /** Create a new product and append it to local state */
    async createProduct(payload) {
      const { data } = await productsApi.create(payload)
      this.products.push(data)
      return data
    },

    /** Update a product by ID and sync local state */
    async updateProduct(id, payload) {
      const { data } = await productsApi.update(id, payload)
      const idx = this.products.findIndex((p) => p.id === id)
      if (idx !== -1) this.products[idx] = data
      return data
    },

    /** Soft-delete a product by ID and remove from local state */
    async deleteProduct(id) {
      await productsApi.delete(id)
      this.products = this.products.filter((p) => p.id !== id)
    },
  },
})
