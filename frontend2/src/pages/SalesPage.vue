<script setup>
import { ref, computed, onMounted } from 'vue'
import { useProductsStore } from '@/stores/products'
import { useCartStore } from '@/stores/cart'
import { useToastStore } from '@/stores/toast'
import { useDiscountsStore } from '@/stores/discounts'
import { formatCurrency } from '@/utils/format'
import CartPanel from '@/components/sales/CartPanel.vue'

const products  = useProductsStore()
const cart      = useCartStore()
const toast     = useToastStore()
const discounts = useDiscountsStore()

const search         = ref('')
const activeCategory = ref('All')

onMounted(() => {
  products.fetchProducts()
  products.fetchCategories()
  discounts.fetchActiveRules() // load discount rules for cart
})

const categories = computed(() => ['All', ...products.categories])

const filtered = computed(() => {
  let list = products.products
  if (activeCategory.value !== 'All') list = list.filter(p => p.category === activeCategory.value)
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(p => p.name.toLowerCase().includes(q) || (p.sku ?? '').toLowerCase().includes(q))
  }
  return list
})

function addToCart(product) {
  // Blocked if tracked and no remaining stock (after cart deduction)
  if (!cart.canAdd(product)) {
    toast.warning(`${product.name} is out of stock.`)
    return
  }
  cart.addItem(product)
}

function inCart(productId) {
  return cart.items.find(i => i.productId === productId)
}

// Effective stock = DB stock minus what's already in cart
function effectiveStock(product) {
  return product.stockQuantity - cart.cartQty(product.id)
}

function stockLabel(product) {
  if (!product.trackStock) return null
  const eff = effectiveStock(product)
  if (eff <= 0)                           return { text: 'Out of stock', cls: 'text-danger',  dot: 'bg-danger'  }
  if (eff <= product.lowStockThreshold)   return { text: `Low: ${eff}`,  cls: 'text-warning', dot: 'bg-warning' }
  return                                         { text: `${eff} left`,  cls: 'text-success', dot: 'bg-success' }
}

function isBlocked(product) {
  return product.trackStock && effectiveStock(product) <= 0
}
</script>

<template>
  <div class="max-w-[1280px] mx-auto p-5">
    <div class="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 items-start">

      <!-- Products panel -->
      <div>
        <div class="flex items-center justify-between mb-4">
          <span class="text-xs font-medium text-[hsl(var(--muted-fg))] uppercase tracking-wider">Products</span>
          <span class="text-xs text-[hsl(var(--muted-fg))]">{{ filtered.length }} item{{ filtered.length !== 1 ? 's' : '' }}</span>
        </div>

        <!-- Search -->
        <div class="relative mb-4">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-fg))]" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input v-model="search" type="text" class="input pl-9" placeholder="Search by name or SKU…" />
        </div>

        <!-- Category filters -->
        <div class="flex gap-1.5 flex-wrap mb-5">
          <button
            v-for="cat in categories" :key="cat"
            class="px-3 py-1 rounded-md border text-xs font-medium transition-all"
            :class="activeCategory === cat
              ? 'bg-[hsl(var(--foreground))] text-[hsl(var(--background))] border-[hsl(var(--foreground))]'
              : 'border-[hsl(var(--border))] text-[hsl(var(--muted-fg))] hover:border-[hsl(var(--border-2))] hover:text-[hsl(var(--foreground))]'"
            @click="activeCategory = cat"
          >{{ cat }}</button>
        </div>

        <!-- Loading skeleton -->
        <div v-if="products.loading" class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          <div v-for="n in 8" :key="n" class="card p-4 h-28 animate-pulse bg-[hsl(var(--muted))]" />
        </div>

        <!-- Product grid -->
        <div v-else-if="filtered.length" class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          <button
            v-for="p in filtered" :key="p.id"
            class="card p-3.5 text-left transition-all relative flex flex-col gap-1 min-h-[108px]"
            :class="[
              isBlocked(p)
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:border-[hsl(var(--border-2))] hover:shadow-sm active:scale-[0.97] cursor-pointer',
              inCart(p.id) && !isBlocked(p)
                ? 'ring-1 ring-[hsl(var(--foreground))] border-[hsl(var(--foreground))]'
                : '',
            ]"
            :disabled="isBlocked(p)"
            @click="addToCart(p)"
          >
            <div class="text-[10px] text-[hsl(var(--muted-fg))] uppercase tracking-wider">{{ p.category }}</div>
            <div class="text-sm font-medium leading-snug flex-1">{{ p.name }}</div>
            <div class="text-sm font-semibold font-mono">{{ formatCurrency(p.price) }}</div>
            <div v-if="p.sku" class="text-[10px] font-mono text-[hsl(var(--muted-fg))]">{{ p.sku }}</div>

            <!-- Live stock strip — updates as items added to cart -->
            <div v-if="p.trackStock && stockLabel(p)" class="flex items-center gap-1.5 mt-1">
              <span class="w-1.5 h-1.5 rounded-full shrink-0" :class="stockLabel(p).dot" />
              <span class="text-[10px] font-mono" :class="stockLabel(p).cls">
                {{ stockLabel(p).text }}
              </span>
            </div>

            <!-- Cart qty badge -->
            <div
              v-if="inCart(p.id)"
              class="absolute top-2 right-2 w-5 h-5 bg-[hsl(var(--foreground))] text-[hsl(var(--background))] rounded-full flex items-center justify-center text-[10px] font-bold"
            >{{ inCart(p.id).quantity }}</div>
          </button>
        </div>

        <div v-else class="text-center py-16 text-sm text-[hsl(var(--muted-fg))]">No products found.</div>
      </div>

      <!-- Cart -->
      <CartPanel />
    </div>
  </div>
</template>
