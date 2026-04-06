// src/stores/auth.js
import { defineStore } from 'pinia'
import { authApi } from '@/api/auth'
import router from '@/router'

export const useAuthStore = defineStore('auth', {

  // ── State ──────────────────────────────────────────────────────────────────
  state: () => ({
    /** @type {{ id: number, username: string, displayName: string, role: string } | null} */
    user:  null,
    /** @type {string | null} */
    token: localStorage.getItem('token') ?? null,
  }),

  // ── Getters ────────────────────────────────────────────────────────────────
  getters: {
    /** Whether a valid token exists */
    isAuthenticated: (state) => !!state.token,

    /** Whether the current user has the admin role */
    isAdmin: (state) => state.user?.role === 'admin',
  },

  // ── Actions ────────────────────────────────────────────────────────────────
  actions: {
    /** Authenticate with credentials, store token and user in state */
    async login(credentials) {
      const { data } = await authApi.login(credentials)
      this.token = data.token
      this.user  = data.user
      localStorage.setItem('token', data.token)
    },

    /** Fetch the current user profile from the API (used on page refresh) */
    async fetchMe() {
      const { data } = await authApi.me()
      this.user = data
    },

    /** Change the authenticated user's password */
    async changePassword(payload) {
      await authApi.changePassword(payload)
    },

    /** Clear session state and remove token from storage */
    logout() {
      this.token = null
      this.user  = null
      localStorage.removeItem('token')
      router.push("/login")
    },
  },
})
