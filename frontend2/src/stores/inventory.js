// src/stores/inventory.js
import { defineStore } from 'pinia'
import { inventoryApi } from '@/api/inventory'

export const useInventoryStore = defineStore('inventory', {

  // ── State ──────────────────────────────────────────────────────────────────
  state: () => ({
    /**
     * @type {{
     *   total: number, tracked: number,
     *   lowStock: number, outOfStock: number,
     *   lowStockItems: Array, outOfStockItems: Array
     * } | null}
     */
    summary:   null,
    /** @type {Array} Recent stock movement records */
    movements: [],
    loading:   false,
    /** @type {string | null} */
    error:     null,
  }),

  // ── Getters ────────────────────────────────────────────────────────────────
  getters: {
    /** True when there are any low-stock or out-of-stock products */
    hasAlerts: (state) =>
      !!state.summary && (state.summary.lowStock + state.summary.outOfStock) > 0,

    /** Total alert count for badge display */
    alertCount: (state) =>
      state.summary ? state.summary.lowStock + state.summary.outOfStock : 0,
  },

  // ── Actions ────────────────────────────────────────────────────────────────
  actions: {
    /** Fetch inventory summary counts (low stock, out of stock, etc.) */
    async fetchSummary() {
      const { data } = await inventoryApi.summary()
      this.summary = data
    },

    /** Fetch the stock movement log, optionally filtered */
    async fetchMovements(params = {}) {
      this.loading = true
      this.error   = null
      try {
        const { data } = await inventoryApi.movements(params)
        this.movements = data
      } catch (e) {
        this.error = e.response?.data?.error ?? 'Failed to fetch movements'
      } finally {
        this.loading = false
      }
    },

    /** Add stock to a tracked product */
    async restock(payload) {
      const { data } = await inventoryApi.restock(payload)
      return data
    },

    /** Set a tracked product's stock to an exact quantity */
    async adjust(payload) {
      const { data } = await inventoryApi.adjust(payload)
      return data
    },
  },
})
