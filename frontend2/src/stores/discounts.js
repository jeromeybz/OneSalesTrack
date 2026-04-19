// src/stores/discounts.js
import { defineStore } from 'pinia'
import { discountsApi } from '@/api/discounts'

export const useDiscountsStore = defineStore('discounts', {

  // ── State ──────────────────────────────────────────────────────────────────
  state: () => ({
    /**
     * Full list with product info — used on Products page management
     * @type {Array}
     */
    rules: [],

    /**
     * Lightweight active-only list — used by cart for real-time discount calc
     * @type {Array<{ productId: number, minQuantity: number, discountedPrice: number }>}
     */
    activeRules: [],

    loading: false,
    /** @type {string | null} */
    error: null,
  }),

  // ── Getters ────────────────────────────────────────────────────────────────
  getters: {
    /**
     * Find an active discount rule by productId.
     * Returns null if no rule exists — cart uses this for optional discount logic.
     * @param {object} state
     * @returns {function(number): { productId, minQuantity, discountedPrice } | null}
     */
    ruleFor: (state) => (productId) =>
      state.activeRules.find((r) => r.productId === productId) ?? null,

    /** Total number of active discount rules */
    activeCount: (state) => state.activeRules.length,

    /** Whether a specific product has any rule (active or not) */
    hasRule: (state) => (productId) =>
      state.rules.some((r) => r.productId === productId),

    /** Get the full rule object for a product (for display/edit) */
    fullRuleFor: (state) => (productId) =>
      state.rules.find((r) => r.productId === productId) ?? null,
  },

  // ── Actions ────────────────────────────────────────────────────────────────
  actions: {
    /** Fetch all rules with product details — for Products page */
    async fetchRules() {
      this.loading = true
      this.error   = null
      try {
        const { data } = await discountsApi.list()
        this.rules = data
      } catch (e) {
        this.error = e.response?.data?.error ?? 'Failed to fetch discount rules'
      } finally {
        this.loading = false
      }
    },

    /** Fetch active-only lightweight rules — called on Sales page load for cart */
    async fetchActiveRules() {
      const { data } = await discountsApi.listActive()
      this.activeRules = data
    },

    /** Create a new discount rule for a product */
    async createRule(payload) {
      const { data } = await discountsApi.create(payload)
      this.rules.push(data)
      if (data.isActive) {
        this.activeRules.push({
          productId:       data.productId,
          minQuantity:     data.minQuantity,
          discountedPrice: data.discountedPrice,
        })
      }
      return data
    },

    /** Update an existing rule */
    async updateRule(id, payload) {
      const { data } = await discountsApi.update(id, payload)
      const idx = this.rules.findIndex((r) => r.id === id)
      if (idx !== -1) this.rules[idx] = data
      // Refresh active rules to keep cart in sync
      await this.fetchActiveRules()
      return data
    },

    /** Toggle a rule on/off without deleting it */
    async toggleRule(id) {
      const { data } = await discountsApi.toggle(id)
      const idx = this.rules.findIndex((r) => r.id === id)
      if (idx !== -1) this.rules[idx] = data
      await this.fetchActiveRules()
      return data
    },

    /** Permanently delete a rule */
    async deleteRule(id) {
      const rule = this.rules.find((r) => r.id === id)
      await discountsApi.delete(id)
      this.rules       = this.rules.filter((r) => r.id !== id)
      this.activeRules = this.activeRules.filter((r) => r.productId !== rule?.productId)
    },
  },
})
