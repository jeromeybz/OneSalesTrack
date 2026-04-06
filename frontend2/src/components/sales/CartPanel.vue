<script setup>
import { ref, computed } from 'vue'
import { useCartStore } from '@/stores/cart'
import { useProductsStore } from '@/stores/products'
import { useToastStore } from '@/stores/toast'
import { formatCurrency } from '@/utils/format'
import AppModal from '@/components/ui/AppModal.vue'

const cart     = useCartStore()
const toast    = useToastStore()
const products = useProductsStore()
const loading = ref(false)

const showCheckoutModal   = ref(false)
const isDelivery          = ref(false)
const deliveryRecipient   = ref('')
const deliveryNote        = ref('')

const hasOutOfStock = computed(() =>
  cart.items.some(i => i.trackStock && i.stock <= 0)
)

function openCheckoutModal() {
  if (!cart.items.length) return
  isDelivery.value        = false
  deliveryRecipient.value = ''
  deliveryNote.value      = ''
  showCheckoutModal.value = true
}

async function confirmCheckout() {
  if (isDelivery.value && !deliveryRecipient.value.trim()) {
    toast.error('Please enter the recipient / store name.')
    return
  }
  loading.value = true
  try {
    await cart.checkout(
      isDelivery.value,
      isDelivery.value ? deliveryRecipient.value.trim() : null,
      isDelivery.value ? deliveryNote.value.trim()      : null,
    )
    toast.success(isDelivery.value ? 'Delivery recorded!' : 'Sale recorded successfully!')
    showCheckoutModal.value = false
    await products.fetchProducts() // refresh stock from server
  } catch (e) {
    toast.error(e.response?.data?.error ?? 'Checkout failed.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="card p-5 sticky top-[57px]">

    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <span class="text-sm font-semibold">Cart</span>
        <span
          v-if="cart.totalItems"
          class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[hsl(var(--foreground))] text-[hsl(var(--background))] text-[10px] font-bold"
        >{{ cart.totalItems }}</span>
      </div>
      <button
        v-if="cart.items.length"
        class="text-xs text-[hsl(var(--muted-fg))] hover:text-danger transition-colors"
        @click="cart.clearCart()"
      >Clear</button>
    </div>

    <!-- Empty state -->
    <div v-if="!cart.items.length" class="text-center py-10 text-sm text-[hsl(var(--muted-fg))]">
      Tap a product to add it to the cart
    </div>

    <!-- Items -->
    <div v-else class="space-y-2 mb-4 max-h-[44vh] overflow-y-auto -mr-1 pr-1">
      <div
        v-for="item in cart.items" :key="item.productId"
        class="bg-[hsl(var(--muted))] rounded-md p-3 flex items-center gap-3"
        :class="{
          'ring-1 ring-warning/50': item.trackStock && item.quantity > item.stock && item.stock > 0,
          'ring-1 ring-danger/50':  item.trackStock && item.stock <= 0,
        }"
      >
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium truncate">{{ item.name }}</div>
          <!-- Normal price line -->
          <div class="text-xs font-mono text-[hsl(var(--muted-fg))] mt-0.5">
            <span :class="{ 'line-through opacity-50': item.isDiscounted }">
              {{ formatCurrency(item.unitPrice) }} × {{ item.quantity }}
              = {{ formatCurrency(item.originalTotal) }}
            </span>
          </div>
          <!-- Discounted price line -->
          <div v-if="item.isDiscounted" class="text-xs font-mono mt-0.5 flex items-center gap-2">
            <span class="text-success font-semibold">{{ formatCurrency(item.totalPrice) }}</span>
            <span class="badge badge-success text-[10px]">Save {{ formatCurrency(item.discountAmount) }}</span>
          </div>
          <div v-if="item.trackStock && item.stock <= 0" class="text-[10px] text-danger mt-0.5 font-medium">
            Out of stock — remove to proceed
          </div>
          <div v-else-if="item.trackStock && item.quantity > item.stock" class="text-[10px] text-warning mt-0.5">
            Only {{ item.stock }} in stock
          </div>
        </div>
        <div class="flex items-center gap-1 shrink-0">
          <button class="w-6 h-6 border border-[hsl(var(--border))] rounded flex items-center justify-center text-sm hover:border-[hsl(var(--border-2))] bg-[hsl(var(--background))] transition-colors" @click="cart.updateQuantity(item.productId, -1, item.stock)">−</button>
          <span class="w-6 text-center text-sm font-semibold font-mono">{{ item.quantity }}</span>
          <button class="w-6 h-6 border border-[hsl(var(--border))] rounded flex items-center justify-center text-sm hover:border-[hsl(var(--border-2))] bg-[hsl(var(--background))] transition-colors" @click="cart.updateQuantity(item.productId, 1, item.stock)">+</button>
          <button class="w-6 h-6 ml-1 flex items-center justify-center text-[hsl(var(--muted-fg))] hover:text-danger transition-colors rounded" @click="cart.removeItem(item.productId)">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Total & checkout -->
    <template v-if="cart.items.length">
      <div class="separator mb-4" />
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm text-[hsl(var(--muted-fg))] font-medium">Total</span>
        <span class="text-xl font-semibold font-mono">{{ formatCurrency(cart.totalAmount) }}</span>
      </div>
      <div v-if="cart.hasDiscount" class="flex items-center justify-between mb-3 text-xs">
        <span class="text-success font-medium">Total savings</span>
        <span class="text-success font-mono font-semibold">− {{ formatCurrency(cart.totalDiscount) }}</span>
      </div>
      <div v-if="hasOutOfStock" class="flex items-start gap-2 bg-danger/8 border border-danger/25 rounded-md px-3 py-2.5 mb-3 text-xs text-danger">
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        Remove out-of-stock items to complete the sale.
      </div>
      <button class="btn btn-primary w-full" :disabled="hasOutOfStock || !cart.items.length" @click="openCheckoutModal">
        Complete Sale
      </button>
    </template>
  </div>

  <!-- ── Checkout Modal ─────────────────────────────────────────────────────── -->
  <AppModal :show="showCheckoutModal" title="Complete Sale" @close="showCheckoutModal = false">
    <div class="space-y-5">

      <!-- Order summary -->
      <div class="bg-[hsl(var(--muted))] rounded-md p-3 space-y-1.5 max-h-40 overflow-y-auto">
        <div v-for="item in cart.items" :key="item.productId" class="flex items-center justify-between text-sm">
          <span class="text-[hsl(var(--muted-fg))]">{{ item.name }} × {{ item.quantity }}</span>
          <span class="font-mono font-medium">{{ formatCurrency(item.totalPrice) }}</span>
        </div>
        <div class="border-t border-[hsl(var(--border))] pt-1.5 mt-1.5 flex items-center justify-between font-semibold text-sm">
          <span>Total</span>
          <span class="font-mono">{{ formatCurrency(cart.totalAmount) }}</span>
        </div>
      </div>

      <!-- Sale type toggle -->
      <div>
        <div class="text-xs font-medium text-[hsl(var(--muted-fg))] mb-2 uppercase tracking-wider">Sale Type</div>
        <div class="grid grid-cols-2 gap-2">
          <button
            class="flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all"
            :class="!isDelivery ? 'border-[hsl(var(--foreground))] bg-[hsl(var(--muted))]' : 'border-[hsl(var(--border))] hover:border-[hsl(var(--border-2))]'"
            @click="isDelivery = false"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            <div class="text-center">
              <div class="text-sm font-semibold">Walk-in</div>
              <div class="text-[11px] text-[hsl(var(--muted-fg))]">Direct purchase</div>
            </div>
          </button>
          <button
            class="flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all"
            :class="isDelivery ? 'border-[hsl(var(--foreground))] bg-[hsl(var(--muted))]' : 'border-[hsl(var(--border))] hover:border-[hsl(var(--border-2))]'"
            @click="isDelivery = true"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
            <div class="text-center">
              <div class="text-sm font-semibold">Delivery</div>
              <div class="text-[11px] text-[hsl(var(--muted-fg))]">Pull-out / dispatch</div>
            </div>
          </button>
        </div>
      </div>

      <!-- Delivery fields — only shown when isDelivery is true -->
      <Transition
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-1"
        leave-active-class="transition-all duration-150 ease-in"
        leave-to-class="opacity-0 -translate-y-1"
      >
        <div v-if="isDelivery" class="space-y-3 border border-[hsl(var(--border))] rounded-lg p-4 bg-[hsl(var(--muted))]">
          <div>
            <label class="label">
              Recipient / Store Name
              <span class="text-danger">*</span>
            </label>
            <input
              v-model="deliveryRecipient"
              type="text"
              class="input"
              placeholder="e.g. KUSINA VALENTIN, Mla c/o Nitz"
              autofocus
            />
          </div>
          <div>
            <label class="label">Note <span class="text-[hsl(var(--muted-fg))] font-normal normal-case tracking-normal">(optional)</span></label>
            <input
              v-model="deliveryNote"
              type="text"
              class="input"
              placeholder="e.g. 10 bot. Vinegar spicy"
            />
          </div>
        </div>
      </Transition>

      <!-- Actions -->
      <div class="flex gap-2">
        <button class="btn btn-secondary flex-1" @click="showCheckoutModal = false">Cancel</button>
        <button class="btn btn-primary flex-1" :disabled="loading" @click="confirmCheckout">
          {{ loading ? 'Processing…' : isDelivery ? 'Confirm Delivery' : 'Confirm Sale' }}
        </button>
      </div>
    </div>
  </AppModal>
</template>
