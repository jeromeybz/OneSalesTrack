<script setup>
import { ref, computed, onMounted } from 'vue'
import { useInventoryStore } from '@/stores/inventory'
import { useProductsStore } from '@/stores/products'
import { useToastStore } from '@/stores/toast'
import { formatDate } from '@/utils/format'
import SummaryCard from '@/components/ui/SummaryCard.vue'
import StockBadge from '@/components/ui/StockBadge.vue'
import AppModal from '@/components/ui/AppModal.vue'

const inventory = useInventoryStore()
const products  = useProductsStore()
const toast     = useToastStore()

const filter      = ref('all')
const showRestock = ref(false)
const showAdjust  = ref(false)
const saving      = ref(false)
const activeProduct = ref(null)

const restockForm = ref({ quantity: 1, note: '' })
const adjustForm  = ref({ newQuantity: 0, note: '' })

onMounted(async () => {
  await Promise.all([
    inventory.fetchSummary(),
    inventory.fetchMovements(),
    products.fetchProducts(),
  ])
})

const filtered = computed(() => {
  const list = products.products
  if (filter.value === 'low')      return list.filter(p => p.trackStock && p.stockQuantity > 0 && p.stockQuantity <= p.lowStockThreshold)
  if (filter.value === 'out')      return list.filter(p => p.trackStock && p.stockQuantity <= 0)
  if (filter.value === 'untracked') return list.filter(p => !p.trackStock)
  return list
})

function openRestock(product) {
  activeProduct.value = product
  restockForm.value = { quantity: 1, note: '' }
  showRestock.value = true
}

function openAdjust(product) {
  activeProduct.value = product
  adjustForm.value = { newQuantity: product.stockQuantity, note: '' }
  showAdjust.value = true
}

async function doRestock() {
  saving.value = true
  try {
    await inventory.restock({
      productId: activeProduct.value.id,
      quantity:  +restockForm.value.quantity,
      note:      restockForm.value.note,
    })
    await Promise.all([products.fetchProducts(), inventory.fetchMovements(), inventory.fetchSummary()])
    toast.success(`Restocked ${activeProduct.value.name}`)
    showRestock.value = false
  } catch (e) {
    toast.error(e.response?.data?.error ?? 'Restock failed.')
  } finally {
    saving.value = false
  }
}

async function doAdjust() {
  saving.value = true
  try {
    await inventory.adjust({
      productId:   activeProduct.value.id,
      newQuantity: +adjustForm.value.newQuantity,
      note:        adjustForm.value.note,
    })
    await Promise.all([products.fetchProducts(), inventory.fetchMovements(), inventory.fetchSummary()])
    toast.success(`Stock adjusted for ${activeProduct.value.name}`)
    showAdjust.value = false
  } catch (e) {
    toast.error(e.response?.data?.error ?? 'Adjust failed.')
  } finally {
    saving.value = false
  }
}

const mvColors = {
  sale:    'bg-danger/10 text-danger',
  restock: 'bg-success/10 text-success',
  adjust:  'bg-warning/10 text-warning',
}
const mvIcons = { sale: '−', restock: '+', adjust: '~' }
</script>

<template>
  <div class="max-w-[1100px] mx-auto p-5">
    <div class="flex items-center justify-between mb-5">
      <h1 class="text-xl font-bold">Inventory</h1>
      <button class="btn btn-secondary btn-sm" @click="$router.push('/products')">⚙ Manage Products</button>
    </div>

    <!-- Summary -->
    <div v-if="inventory.summary" class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      <SummaryCard label="Total Products" :value="inventory.summary.total"      color="accent"  />
      <SummaryCard label="Tracked"        :value="inventory.summary.tracked"    color="info"    />
      <SummaryCard label="Low Stock"      :value="inventory.summary.lowStock"   color="warning" />
      <SummaryCard label="Out of Stock"   :value="inventory.summary.outOfStock" color="danger"  />
    </div>

    <!-- Filters -->
    <div class="flex gap-2 flex-wrap mb-4">
      <button v-for="f in [
        { key: 'all',       label: 'All' },
        { key: 'low',       label: '⚠ Low Stock' },
        { key: 'out',       label: '✕ Out of Stock' },
        { key: 'untracked', label: '— Untracked' },
      ]" :key="f.key"
        class="px-3.5 py-1 rounded-full border text-xs font-medium transition-all"
        :class="filter === f.key
          ? 'bg-accent/10 border-accent text-accent'
          : 'border-[hsl(var(--border))] text-[hsl(var(--foreground))]/40 hover:text-[hsl(var(--foreground))]'"
        @click="filter = f.key"
      >
        {{ f.label }}
      </button>
    </div>

    <!-- Inventory table -->
    <div class="card overflow-hidden overflow-x-auto mb-8">
      <table class="w-full text-sm min-w-[650px]">
        <thead>
          <tr class="bg-[hsl(var(--muted))] border-b border-[hsl(var(--border))] text-[11px] text-[hsl(var(--muted-fg))] uppercase tracking-wider">
            <th class="text-left px-4 py-3">Product</th>
            <th class="text-left px-4 py-3">Supplier</th>
            <th class="text-left px-4 py-3">SKU</th>
            <th class="text-left px-4 py-3">Stock</th>
            <th class="text-left px-4 py-3">Threshold</th>
            <th class="text-left px-4 py-3">Status</th>
            <th class="text-left px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="p in filtered"
            :key="p.id"
            class="border-b border-[hsl(var(--border))] last:border-0 hover:bg-[hsl(var(--muted))] transition-colors"
          >
            <td class="px-4 py-3 font-medium">{{ p.name }}</td>
            <td class="px-4 py-3">
              <span v-if="p.category" class="badge badge-accent">{{ p.category }}</span>
              <span v-else class="text-[hsl(var(--muted-fg))]">—</span>
            </td>
            <td class="px-4 py-3 font-mono text-xs text-[hsl(var(--muted-fg))]">{{ p.sku || '—' }}</td>
            <td class="px-4 py-3 font-mono font-semibold">{{ p.trackStock ? p.stockQuantity : '—' }}</td>
            <td class="px-4 py-3 font-mono text-xs text-[hsl(var(--foreground))]/40">{{ p.trackStock ? p.lowStockThreshold : '—' }}</td>
            <td class="px-4 py-3"><StockBadge :product="p" /></td>
            <td class="px-4 py-3">
              <div v-if="p.trackStock" class="flex gap-2">
                <button class="btn btn-secondary btn-sm" @click="openRestock(p)">Restock</button>
                <button class="btn btn-sm bg-warning/10 border border-warning/40 text-warning hover:bg-warning/20" @click="openAdjust(p)">Adjust</button>
              </div>
              <span v-else class="text-[hsl(var(--muted-fg))] text-xs">Not tracked</span>
            </td>
          </tr>
          <tr v-if="!filtered.length">
            <td colspan="7" class="text-center py-16 text-[hsl(var(--muted-fg))]">No products match this filter.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Stock Movements -->
    <div>
      <h2 class="text-sm font-bold mb-3">📜 Recent Stock Movements</h2>
      <div class="card overflow-hidden max-h-[380px] overflow-y-auto">
        <div
          v-for="mv in inventory.movements"
          :key="mv.id"
          class="flex items-center gap-3 px-4 py-3 border-b border-[hsl(var(--border))] last:border-0 text-sm"
        >
          <div
            class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            :class="mvColors[mv.movementType]"
          >
            {{ mvIcons[mv.movementType] }}
          </div>
          <span class="flex-1 font-medium truncate">{{ mv.productName }}</span>
          <span
            class="font-mono font-bold text-xs min-w-[52px] text-right"
            :class="mv.quantityChange >= 0 ? 'text-success' : 'text-danger'"
          >
            {{ mv.quantityChange >= 0 ? '+' : '' }}{{ mv.quantityChange }}
          </span>
          <span class="font-mono text-xs text-[hsl(var(--muted-fg))] min-w-[60px] text-right">→ {{ mv.stockAfter }}</span>
          <span class="text-[11px] text-[hsl(var(--muted-fg))] min-w-[120px] text-right font-mono">{{ formatDate(mv.createdAt) }}</span>
        </div>
        <div v-if="!inventory.movements.length" class="text-center py-12 text-[hsl(var(--muted-fg))] text-sm">
          No movements yet.
        </div>
      </div>
    </div>

    <!-- Restock Modal -->
    <AppModal :show="showRestock" title="Restock Product" @close="showRestock = false">
      <p class="text-sm text-[hsl(var(--muted-fg))] mb-4">
        Adding stock to <span class="text-[hsl(var(--foreground))] font-semibold">{{ activeProduct?.name }}</span>
        (current: <span class="font-mono text-accent">{{ activeProduct?.stockQuantity }}</span>)
      </p>
      <div class="space-y-4">
        <div>
          <label class="label">Quantity to Add</label>
          <input v-model="restockForm.quantity" type="number" class="input" min="1" />
        </div>
        <div>
          <label class="label">Note (optional)</label>
          <input v-model="restockForm.note" type="text" class="input" placeholder="e.g. Weekly delivery" />
        </div>
        <div class="flex gap-3 justify-end pt-1">
          <button class="btn btn-secondary btn-sm" @click="showRestock = false">Cancel</button>
          <button class="btn btn-primary btn-sm" :disabled="saving" @click="doRestock">
            {{ saving ? 'Saving…' : 'Restock' }}
          </button>
        </div>
      </div>
    </AppModal>

    <!-- Adjust Modal -->
    <AppModal :show="showAdjust" title="Adjust Stock" @close="showAdjust = false">
      <p class="text-sm text-[hsl(var(--muted-fg))] mb-4">
        Setting exact stock for <span class="text-[hsl(var(--foreground))] font-semibold">{{ activeProduct?.name }}</span>
      </p>
      <div class="space-y-4">
        <div>
          <label class="label">New Stock Quantity</label>
          <input v-model="adjustForm.newQuantity" type="number" class="input" min="0" />
        </div>
        <div>
          <label class="label">Note (optional)</label>
          <input v-model="adjustForm.note" type="text" class="input" placeholder="e.g. Stocktake correction" />
        </div>
        <div class="flex gap-3 justify-end pt-1">
          <button class="btn btn-secondary btn-sm" @click="showAdjust = false">Cancel</button>
          <button class="btn btn-primary btn-sm" :disabled="saving" @click="doAdjust">
            {{ saving ? 'Saving…' : 'Adjust' }}
          </button>
        </div>
      </div>
    </AppModal>
  </div>
</template>
