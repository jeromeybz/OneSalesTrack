<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { initials } from '@/utils/format'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'

defineProps({ hasLowStock: Boolean })
const emit = defineEmits(['logout'])

const auth   = useAuthStore()
const theme  = useThemeStore()
const route  = useRoute()
const router = useRouter()

const showLogoutConfirm = ref(false)
const showUserDropdown  = ref(false)
const dropdownRef       = ref(null)

// Nav tabs — Users removed, handled in dropdown
const navItems = [
  { to: '/sales',        label: 'Sales',        adminOnly: false },
  { to: '/inventory',    label: 'Inventory',    adminOnly: true  },
  { to: '/products',     label: 'Products',     adminOnly: true  },
  { to: '/transactions', label: 'Transactions', adminOnly: true  },
  { to: '/reports',      label: 'Reports',      adminOnly: true  },
]

// Close dropdown when clicking outside
function handleOutsideClick(e) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    showUserDropdown.value = false
  }
}
onMounted(()       => document.addEventListener('mousedown', handleOutsideClick))
onBeforeUnmount(() => document.removeEventListener('mousedown', handleOutsideClick))

function goToUsers() {
  showUserDropdown.value = false
  router.push('/users')
}

function openLogoutConfirm() {
  showUserDropdown.value = false
  showLogoutConfirm.value = true
}

function doLogout() {
  showLogoutConfirm.value = false
  emit('logout')
}
</script>

<template>
  <header class="border-b border-[hsl(var(--border))] bg-[hsl(var(--background))] sticky top-0 z-50">
    <div class="max-w-[1280px] mx-auto px-4 h-14 flex items-center gap-4">

      <!-- Brand -->
      <RouterLink to="/sales" class="shrink-0 flex items-center gap-2 mr-2">
        <div class="w-6 h-6 rounded bg-[hsl(var(--foreground))] flex items-center justify-center">
          <span class="block w-3 h-3 rounded-sm bg-[hsl(var(--background))]" />
        </div>
        <span class="font-semibold text-sm tracking-tight">SalesTrack</span>
      </RouterLink>

      <!-- Nav tabs (center) -->
      <nav class="flex-1 flex items-center justify-center">
        <div class="flex items-center gap-0.5">
          <template v-for="item in navItems" :key="item.to">
            <RouterLink
              v-if="!item.adminOnly || auth.isAdmin"
              :to="item.to"
              class="relative px-3.5 py-1.5 text-sm font-medium rounded-md transition-colors"
              :class="route.path === item.to
                ? 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]'
                : 'text-[hsl(var(--muted-fg))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'"
            >
              {{ item.label }}
              <span
                v-if="item.to === '/inventory' && hasLowStock"
                class="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-warning"
              />
            </RouterLink>
          </template>
        </div>
      </nav>

      <!-- Right actions -->
      <div class="shrink-0 flex items-center gap-2">

        <!-- Theme toggle -->
        <button
          class="btn btn-ghost btn-sm w-8 h-8 p-0 rounded-md"
          :title="theme.isDark ? 'Switch to light mode' : 'Switch to dark mode'"
          @click="theme.toggle()"
        >
          <svg v-if="theme.isDark" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
          </svg>
        </button>

        <div class="w-px h-5 bg-[hsl(var(--border))]" />

        <!-- User dropdown trigger -->
        <div ref="dropdownRef" class="relative">
          <button
            class="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[hsl(var(--muted))] transition-colors"
            @click="showUserDropdown = !showUserDropdown"
          >
            <!-- Avatar -->
            <div
              class="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold border border-[hsl(var(--border))]"
              :class="auth.isAdmin
                ? 'bg-[hsl(var(--foreground))] text-[hsl(var(--background))]'
                : 'bg-[hsl(var(--surface-2))] text-[hsl(var(--foreground))]'"
            >
              {{ initials(auth.user?.displayName || '') }}
            </div>
            <!-- Name -->
            <span class="text-xs font-medium hidden sm:block">{{ auth.user?.displayName }}</span>
            <!-- Chevron -->
            <svg
              xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
              class="text-[hsl(var(--muted-fg))] transition-transform duration-150"
              :class="showUserDropdown ? 'rotate-180' : ''"
            >
              <path d="m6 9 6 6 6-6"/>
            </svg>
          </button>

          <!-- Dropdown menu -->
          <Transition
            enter-active-class="transition-all duration-150 ease-out"
            enter-from-class="opacity-0 scale-95 translate-y-[-4px]"
            enter-to-class="opacity-100 scale-100 translate-y-0"
            leave-active-class="transition-all duration-100 ease-in"
            leave-from-class="opacity-100 scale-100 translate-y-0"
            leave-to-class="opacity-0 scale-95 translate-y-[-4px]"
          >
            <div
              v-if="showUserDropdown"
              class="absolute right-0 top-full mt-1.5 w-48 card shadow-xl py-1 z-50"
            >
              <!-- User info header -->
              <div class="px-3 py-2.5 border-b border-[hsl(var(--border))]">
                <div class="text-xs font-semibold">{{ auth.user?.displayName }}</div>
                <div class="text-[11px] text-[hsl(var(--muted-fg))] capitalize mt-0.5">{{ auth.user?.role }}</div>
              </div>

              <!-- Users link (admin only) -->
              <button
                v-if="auth.isAdmin"
                class="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors text-left"
                @click="goToUsers"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                Users
              </button>

              <div class="border-t border-[hsl(var(--border))] mt-1 pt-1" />

              <!-- Logout -->
              <button
                class="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-danger hover:bg-danger/8 transition-colors text-left"
                @click="openLogoutConfirm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Sign out
              </button>
            </div>
          </Transition>
        </div>

      </div>
    </div>
  </header>

  <!-- Logout confirm modal -->
  <ConfirmModal
    :show="showLogoutConfirm"
    title="Sign out"
    message="Are you sure you want to sign out of SalesTrack?"
    confirm-label="Sign out"
    danger
    @confirm="doLogout"
    @cancel="showLogoutConfirm = false"
  />
</template>
