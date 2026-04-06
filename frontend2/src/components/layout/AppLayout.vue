<script setup>
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useInventoryStore } from '@/stores/inventory'
import { useThemeStore } from '@/stores/theme'
import { computed } from 'vue'
import AppNav from './AppNav.vue'

const auth      = useAuthStore()
const inventory = useInventoryStore()
// const router    = useRouter()
useThemeStore()

onMounted(() => {
  if (auth.isAdmin) inventory.fetchSummary()
})

const hasLowStock = computed(() =>
  inventory.summary
    ? inventory.summary.lowStock + inventory.summary.outOfStock > 0
    : false
)
</script>

<template>
  <div class="min-h-screen bg-[hsl(var(--background))]">
    <AppNav :has-low-stock="hasLowStock" @logout="auth.logout()" />
    <main>
      <RouterView />
    </main>
  </div>
</template>
