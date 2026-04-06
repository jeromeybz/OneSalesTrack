// src/stores/reports.js
import { defineStore } from 'pinia'
import { reportsApi } from '@/api/reports'

export const useReportsStore = defineStore('reports', {

  // ── State ──────────────────────────────────────────────────────────────────
  state: () => ({
    /**
     * @type {{
     *   year: number, month: number, daysInMonth: number,
     *   rows: Array, deliveryNotes: Array
     * } | null}
     */
    report:  null,
    loading: false,
    /** @type {string | null} */
    error:   null,
  }),

  // ── Getters ────────────────────────────────────────────────────────────────
  getters: {
    /** True when the report has been loaded and contains product rows */
    hasData: (state) => !!state.report && state.report.rows.length > 0,

    /** Delivery count for the loaded report month */
    deliveryCount: (state) => state.report?.deliveryNotes?.length ?? 0,
  },

  // ── Actions ────────────────────────────────────────────────────────────────
  actions: {
    /**
     * Load the monthly sales report.
     * @param {number} year
     * @param {number} month  1–12
     */
    async fetchMonthly(year, month) {
      this.loading = true
      this.error   = null
      try {
        const { data } = await reportsApi.monthly({ year, month })
        this.report = data
      } catch (e) {
        this.error = e.response?.data?.error ?? 'Failed to load report'
      } finally {
        this.loading = false
      }
    },
  },
})
