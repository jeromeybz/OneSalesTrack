<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { useToastStore } from '@/stores/toast'

const auth   = useAuthStore()
const theme  = useThemeStore()
const toast  = useToastStore()
const router = useRouter()

const form     = ref({ username: '', password: '' })
const loading  = ref(false)
const errorMsg = ref('')
const showPw   = ref(false)

async function submit() {
  errorMsg.value = ''
  if (!form.value.username || !form.value.password) {
    errorMsg.value = 'Please enter your username and password.'
    return
  }
  loading.value = true
  try {
    await auth.login(form.value)
    toast.success(`Welcome back, ${auth.user.displayName.split(' ')[0]}!`)
    router.push('/sales')
  } catch (e) {
    errorMsg.value = e.response?.data?.error ?? 'Login failed. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center p-5">

    <!-- Theme toggle -->
    <button
      class="fixed top-4 right-4 btn btn-ghost btn-sm w-9 h-9 p-0 rounded-md"
      @click="theme.toggle()"
    >
      <svg v-if="theme.isDark" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
      </svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
      </svg>
    </button>

    <div class="w-full max-w-sm">

      <!-- Brand -->
      <div class="flex items-center gap-2.5 mb-8">
        <div class="w-8 h-8 rounded-md bg-[hsl(var(--foreground))] flex items-center justify-center">
          <span class="block w-4 h-4 rounded-sm bg-[hsl(var(--background))]" />
        </div>
        <div>
          <div class="font-semibold text-base leading-none">SalesTrack</div>
          <div class="text-[11px] text-[hsl(var(--muted-fg))] mt-0.5">Point of Sale System</div>
        </div>
      </div>

      <!-- Heading -->
      <h1 class="text-2xl font-semibold mb-1 tracking-tight">Sign in</h1>
      <p class="text-sm text-[hsl(var(--muted-fg))] mb-7">Enter your credentials to access the dashboard.</p>

      <!-- Error -->
      <div
        v-if="errorMsg"
        class="flex items-start gap-2.5 bg-danger/8 border border-danger/25 text-danger text-sm rounded-md px-4 py-3 mb-5"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        {{ errorMsg }}
      </div>

      <form class="space-y-4" @submit.prevent="submit">
        <div>
          <label class="label">Username</label>
          <input
            v-model="form.username"
            type="text"
            class="input"
            placeholder="e.g. admin"
            autocomplete="username"
          />
        </div>

        <div>
          <label class="label">Password</label>
          <div class="relative">
            <input
              v-model="form.password"
              :type="showPw ? 'text' : 'password'"
              class="input pr-10"
              placeholder="••••••••"
              autocomplete="current-password"
            />
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-fg))] hover:text-[hsl(var(--foreground))] transition-colors"
              @click="showPw = !showPw"
            >
              <svg v-if="showPw" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
        </div>

        <button type="submit" class="btn btn-primary w-full mt-1" :disabled="loading">
          {{ loading ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>

      <!-- Hint -->
      <div class="mt-6 p-4 bg-[hsl(var(--muted))] rounded-md text-xs text-[hsl(var(--muted-fg))] leading-relaxed space-y-1">
        <div><span class="font-medium text-[hsl(var(--foreground))]">Admin</span> — admin / admin123</div>
        <div><span class="font-medium text-[hsl(var(--foreground))]">Cashier</span> — cashier / cash123</div>
      </div>
    </div>
  </div>
</template>
