// src/stores/transactions.js
import { defineStore } from 'pinia'
import { transactionsApi } from '@/api/transactions'

export const useTransactionsStore = defineStore('transactions', {

  // ── State ──────────────────────────────────────────────────────────────────
  state: () => ({
    /** @type {Array} Transaction records with their items */
    transactions: [],
    /** @type {{ revenue: number, transactions: number, itemsSold: number }} */
    summary: {
      revenue:      0,
      transactions: 0,
      itemsSold:    0,
    },
    loading: false,
    /** @type {string | null} */
    error:   null,
  }),

  // ── Getters ────────────────────────────────────────────────────────────────
  getters: {
    /** Total number of loaded transactions */
    count: (state) => state.transactions.length,

    /** True when there are no transactions loaded */
    isEmpty: (state) => state.transactions.length === 0,
  },

  // ── Actions ────────────────────────────────────────────────────────────────
  actions: {
    /**
     * Fetch transactions with optional filters.
     * @param {{ date?: string, from?: string, to?: string }} params
     */
    async fetchTransactions(params = {}) {
      this.loading = true
      this.error   = null
      try {
        const { data } = await transactionsApi.list(params)
        this.transactions = data.transactions
        this.summary      = data.summary
      } catch (e) {
        this.error = e.response?.data?.error ?? 'Failed to fetch transactions'
      } finally {
        this.loading = false
      }
    },
  },
})
