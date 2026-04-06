// src/stores/users.js
import { defineStore } from 'pinia'
import { usersApi } from '@/api/users'

export const useUsersStore = defineStore('users', {

  // ── State ──────────────────────────────────────────────────────────────────
  state: () => ({
    /** @type {Array<{ id: number, username: string, displayName: string, role: string, createdAt: string, lastLogin: string | null }>} */
    users:   [],
    loading: false,
    /** @type {string | null} */
    error:   null,
  }),

  // ── Getters ────────────────────────────────────────────────────────────────
  getters: {
    /** All users with the admin role */
    admins: (state) => state.users.filter((u) => u.role === 'admin'),

    /** All users with the cashier role */
    cashiers: (state) => state.users.filter((u) => u.role === 'cashier'),

    /** Total user count */
    count: (state) => state.users.length,
  },

  // ── Actions ────────────────────────────────────────────────────────────────
  actions: {
    /** Load all users from the API */
    async fetchUsers() {
      this.loading = true
      this.error   = null
      try {
        const { data } = await usersApi.list()
        this.users = data
      } catch (e) {
        this.error = e.response?.data?.error ?? 'Failed to fetch users'
      } finally {
        this.loading = false
      }
    },

    /** Create a new user and append to local state */
    async createUser(payload) {
      const { data } = await usersApi.create(payload)
      this.users.push(data)
      return data
    },

    /** Update a user by ID and sync local state */
    async updateUser(id, payload) {
      const { data } = await usersApi.update(id, payload)
      const idx = this.users.findIndex((u) => u.id === id)
      if (idx !== -1) this.users[idx] = data
      return data
    },

    /** Delete a user by ID and remove from local state */
    async deleteUser(id) {
      await usersApi.delete(id)
      this.users = this.users.filter((u) => u.id !== id)
    },
  },
})
