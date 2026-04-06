// src/stores/theme.js
import { defineStore } from 'pinia'

export const useThemeStore = defineStore('theme', {

  // ── State ──────────────────────────────────────────────────────────────────
  state: () => {
    const stored      = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    return {
      /** @type {boolean} */
      isDark: stored ? stored === 'dark' : prefersDark,
    }
  },

  // ── Getters ────────────────────────────────────────────────────────────────
  getters: {
    /** The current theme label — useful for aria-label or display */
    label: (state) => (state.isDark ? 'Dark' : 'Light'),
  },

  // ── Actions ────────────────────────────────────────────────────────────────
  actions: {
    /** Toggle between dark and light mode and persist the preference */
    toggle() {
      this.isDark = !this.isDark
      this._apply()
    },

    /** Apply the current isDark value to the DOM and localStorage */
    _apply() {
      document.documentElement.classList.toggle('dark', this.isDark)
      localStorage.setItem('theme', this.isDark ? 'dark' : 'light')
    },
  },
})
