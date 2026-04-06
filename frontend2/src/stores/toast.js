// src/stores/toast.js
import { defineStore } from 'pinia'

let _nextId = 0

export const useToastStore = defineStore('toast', {

  // ── State ──────────────────────────────────────────────────────────────────
  state: () => ({
    /**
     * @type {Array<{ id: number, message: string, type: 'success'|'error'|'info'|'warning' }>}
     */
    toasts: [],
  }),

  // ── Getters ────────────────────────────────────────────────────────────────
  getters: {
    /** True when at least one toast is visible */
    hasToasts: (state) => state.toasts.length > 0,
  },

  // ── Actions ────────────────────────────────────────────────────────────────
  actions: {
    /**
     * Show a toast notification.
     * @param {string} message
     * @param {'success'|'error'|'info'|'warning'} type
     * @param {number} duration  ms before auto-dismiss
     */
    add(message, type = 'success', duration = 3000) {
      const id = _nextId++
      this.toasts.push({ id, message, type })
      setTimeout(() => this.remove(id), duration)
    },

    /** Dismiss a toast by its ID */
    remove(id) {
      this.toasts = this.toasts.filter((t) => t.id !== id)
    },

    // ── Convenience shortcuts ──────────────────────────────────────────────
    /** @param {string} msg */
    success(msg) { this.add(msg, 'success') },
    /** @param {string} msg */
    error(msg)   { this.add(msg, 'error')   },
    /** @param {string} msg */
    info(msg)    { this.add(msg, 'info')    },
    /** @param {string} msg */
    warning(msg) { this.add(msg, 'warning') },
  },
})
