<script setup>
import { ref, onMounted } from 'vue'
import { useProductsStore }  from '@/stores/products'
import { useDiscountsStore } from '@/stores/discounts'
import { useToastStore }     from '@/stores/toast'
import { formatCurrency }    from '@/utils/format'
import StockBadge  from '@/components/ui/StockBadge.vue'
import AppModal    from '@/components/ui/AppModal.vue'
import ConfirmModal from '@/components/ui/ConfirmModal.vue'

const productsStore  = useProductsStore()
const discountsStore = useDiscountsStore()
const toast          = useToastStore()

// ── Product modal ──────────────────────────────────────────────────────────
const showModal   = ref(false)
const showConfirm = ref(false)
const editingId   = ref(null)
const deletingId  = ref(null)
const saving      = ref(false)

const emptyProduct = () => ({
  name: '', price: '', category: '', sku: '',
  trackStock: false, stockQuantity: 0, lowStockThreshold: 5,
})
const form = ref(emptyProduct())

// ── Discount modal ─────────────────────────────────────────────────────────
const showDiscountModal  = ref(false)
const discountProduct    = ref(null)   // product being configured
const savingDiscount     = ref(false)
const showDeleteDiscount = ref(false)

const emptyDiscount = () => ({ minQuantity: 2, discountedPrice: '' })
const discountForm  = ref(emptyDiscount())

onMounted(() => {
  productsStore.fetchProducts()
  discountsStore.fetchRules()
})

// ── Product CRUD ──────────────────────────────────────────────────────────
function openCreate() {
  editingId.value = null
  form.value = emptyProduct()
  showModal.value = true
}

function openEdit(product) {
  editingId.value = product.id
  form.value = { ...product }
  showModal.value = true
}

function confirmDelete(id) {
  deletingId.value = id
  showConfirm.value = true
}

async function save() {
  if (!form.value.name || !form.value.price) {
    toast.error('Name and price are required.')
    return
  }
  saving.value = true
  try {
    if (editingId.value) {
      await productsStore.updateProduct(editingId.value, form.value)
      toast.success('Product updated.')
    } else {
      await productsStore.createProduct(form.value)
      toast.success('Product created.')
    }
    showModal.value = false
  } catch (e) {
    toast.error(e.response?.data?.error ?? 'Save failed.')
  } finally {
    saving.value = false
  }
}

async function doDelete() {
  try {
    await productsStore.deleteProduct(deletingId.value)
    toast.info('Product deleted.')
  } catch (e) {
    toast.error(e.response?.data?.error ?? 'Delete failed.')
  } finally {
    showConfirm.value = false
    deletingId.value = null
  }
}

// ── Discount management ───────────────────────────────────────────────────
function openDiscountModal(product) {
  discountProduct.value = product
  const existing = discountsStore.fullRuleFor(product.id)
  if (existing) {
    discountForm.value = {
      minQuantity:     existing.minQuantity,
      discountedPrice: existing.discountedPrice,
    }
  } else {
    discountForm.value = emptyDiscount()
  }
  showDiscountModal.value = true
}

async function saveDiscount() {
  const product  = discountProduct.value
  const existing = discountsStore.fullRuleFor(product.id)

  if (!discountForm.value.minQuantity || !discountForm.value.discountedPrice) {
    toast.error('Both fields are required.')
    return
  }
  if (+discountForm.value.discountedPrice >= product.price * +discountForm.value.minQuantity) {
    toast.warning('Discounted price should be less than the regular bundle price to make sense.')
  }

  savingDiscount.value = true
  try {
    if (existing) {
      await discountsStore.updateRule(existing.id, discountForm.value)
      toast.success('Discount rule updated.')
    } else {
      await discountsStore.createRule({ productId: product.id, ...discountForm.value })
      toast.success('Discount rule created.')
    }
    showDiscountModal.value = false
  } catch (e) {
    toast.error(e.response?.data?.error ?? 'Failed to save discount rule.')
  } finally {
    savingDiscount.value = false
  }
}

async function toggleDiscount(product) {
  const rule = discountsStore.fullRuleFor(product.id)
  if (!rule) return
  try {
    await discountsStore.toggleRule(rule.id)
    toast.success(rule.isActive ? 'Discount deactivated.' : 'Discount activated.')
  } catch (e) {
    toast.error('Failed to toggle discount.')
  }
}

async function doDeleteDiscount() {
  const rule = discountsStore.fullRuleFor(discountProduct.value?.id)
  if (!rule) return
  try {
    await discountsStore.deleteRule(rule.id)
    toast.info('Discount rule removed.')
    showDeleteDiscount.value = false
    showDiscountModal.value  = false
  } catch (e) {
    toast.error('Failed to delete discount rule.')
  }
}

// Preview: what would the bundle price be at normal rate?
function bundleRegularPrice(product) {
  if (!discountForm.value.minQuantity || !product) return null
  return product.price * +discountForm.value.minQuantity
}
</script>

<template>
  <div class="max-w-[1200px] mx-auto p-5">
    <div class="flex items-center justify-between mb-5">
      <h1 class="text-lg font-semibold">Product Catalog</h1>
      <button class="btn btn-primary btn-sm" @click="openCreate">＋ Add Product</button>
    </div>

    <div class="card overflow-hidden overflow-x-auto">
      <table class="w-full text-sm min-w-[750px]">
        <thead>
          <tr class="bg-[hsl(var(--muted))] border-b border-[hsl(var(--border))] text-[11px] text-[hsl(var(--muted-fg))] uppercase tracking-wider">
            <th class="text-left px-4 py-3">Name</th>
            <th class="text-left px-4 py-3">Price</th>
            <th class="text-left px-4 py-3">Supplier</th>
            <th class="text-left px-4 py-3">SKU</th>
            <th class="text-left px-4 py-3">Stock</th>
            <th class="text-left px-4 py-3">Discount</th>
            <th class="text-left px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="p in productsStore.products" :key="p.id"
            class="border-b border-[hsl(var(--border))] last:border-0 hover:bg-[hsl(var(--muted))] transition-colors"
          >
            <td class="px-4 py-3 font-medium">{{ p.name }}</td>
            <td class="px-4 py-3 font-mono text-sm">{{ formatCurrency(p.price) }}</td>
            <td class="px-4 py-3">
              <span v-if="p.category" class="badge badge-neutral">{{ p.category }}</span>
              <span v-else class="text-[hsl(var(--muted-fg))]">—</span>
            </td>
            <td class="px-4 py-3 font-mono text-xs text-[hsl(var(--muted-fg))]">{{ p.sku || '—' }}</td>
            <td class="px-4 py-3"><StockBadge :product="p" /></td>

            <!-- Discount status cell -->
            <td class="px-4 py-3">
              <template v-if="discountsStore.hasRule(p.id)">
                <div class="flex items-center gap-2">
                  <button
                    class="flex items-center gap-1.5 text-xs font-medium transition-colors"
                    :class="discountsStore.fullRuleFor(p.id)?.isActive
                      ? 'text-success'
                      : 'text-[hsl(var(--muted-fg))]'"
                    @click="toggleDiscount(p)"
                  >
                    <span
                      class="w-1.5 h-1.5 rounded-full"
                      :class="discountsStore.fullRuleFor(p.id)?.isActive ? 'bg-success' : 'bg-[hsl(var(--border-2))]'"
                    />
                    {{ discountsStore.fullRuleFor(p.id)?.isActive ? 'Active' : 'Inactive' }}
                  </button>
                  <button
                    class="text-xs text-[hsl(var(--muted-fg))] hover:text-[hsl(var(--foreground))] transition-colors"
                    @click="openDiscountModal(p)"
                  >Edit</button>
                </div>
              </template>
              <button
                v-else
                class="text-xs text-[hsl(var(--muted-fg))] hover:text-[hsl(var(--foreground))] transition-colors"
                @click="openDiscountModal(p)"
              >
                + Add discount
              </button>
            </td>

            <td class="px-4 py-3">
              <div class="flex gap-2">
                <button class="btn btn-secondary btn-sm" @click="openEdit(p)">Edit</button>
                <button class="btn btn-danger btn-sm" @click="confirmDelete(p.id)">Delete</button>
              </div>
            </td>
          </tr>
          <tr v-if="!productsStore.products.length">
            <td colspan="7" class="text-center py-16 text-[hsl(var(--muted-fg))]">No products yet.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ── Product modal ──────────────────────────────────────────────────── -->
    <AppModal :show="showModal" :title="editingId ? 'Edit Product' : 'Add Product'" @close="showModal = false">
      <div class="space-y-4">
        <div>
          <label class="label">Name <span class="text-danger">*</span></label>
          <input v-model="form.name" type="text" class="input" placeholder="e.g. 100g Garlic Overload" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label">Price <span class="text-danger">*</span></label>
            <input v-model="form.price" type="number" class="input" placeholder="0.00" step="0.01" min="0" />
          </div>
          <div>
            <label class="label">Supplier</label>
            <input v-model="form.category" type="text" class="input" placeholder="e.g. Supplier 1" />
          </div>
        </div>
        <div>
          <label class="label">SKU / Code</label>
          <input v-model="form.sku" type="text" class="input" placeholder="e.g. S1-001" />
        </div>
        <hr class="border-[hsl(var(--border))]" />
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm font-medium">Track Stock</div>
            <div class="text-xs text-[hsl(var(--muted-fg))]">Deduct on each sale</div>
          </div>
          <button
            class="w-11 h-6 rounded-full transition-colors relative"
            :class="form.trackStock ? 'bg-[hsl(var(--foreground))]' : 'bg-[hsl(var(--surface-2))]'"
            @click="form.trackStock = !form.trackStock"
          >
            <span
              class="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
              :class="form.trackStock ? 'translate-x-5' : 'translate-x-0.5'"
            />
          </button>
        </div>
        <div v-if="form.trackStock" class="grid grid-cols-2 gap-3">
          <div>
            <label class="label">Stock Qty</label>
            <input v-model="form.stockQuantity" type="number" class="input" min="0" />
          </div>
          <div>
            <label class="label">Low Stock Alert</label>
            <input v-model="form.lowStockThreshold" type="number" class="input" min="0" />
          </div>
        </div>
        <div class="flex gap-3 justify-end pt-2">
          <button class="btn btn-secondary btn-sm" @click="showModal = false">Cancel</button>
          <button class="btn btn-primary btn-sm" :disabled="saving" @click="save">
            {{ saving ? 'Saving…' : 'Save Product' }}
          </button>
        </div>
      </div>
    </AppModal>

    <!-- ── Discount modal ─────────────────────────────────────────────────── -->
    <AppModal
      :show="showDiscountModal"
      :title="discountsStore.hasRule(discountProduct?.id) ? 'Edit Discount Rule' : 'Add Discount Rule'"
      @close="showDiscountModal = false"
    >
      <div class="space-y-4" v-if="discountProduct">

        <!-- Product context -->
        <div class="bg-[hsl(var(--muted))] rounded-md px-4 py-3 text-sm">
          <div class="font-medium">{{ discountProduct.name }}</div>
          <div class="text-[hsl(var(--muted-fg))] text-xs mt-0.5">
            Regular price: <span class="font-mono">{{ formatCurrency(discountProduct.price) }}</span>
          </div>
        </div>

        <div>
          <label class="label">Minimum Quantity to Trigger <span class="text-danger">*</span></label>
          <input v-model="discountForm.minQuantity" type="number" class="input" min="2" placeholder="e.g. 3" />
          <p class="text-xs text-[hsl(var(--muted-fg))] mt-1">
            Discount applies when buyer purchases this many or more.
          </p>
        </div>

        <div>
          <label class="label">Bundle Price <span class="text-danger">*</span></label>
          <input v-model="discountForm.discountedPrice" type="number" class="input" min="1" step="0.01" placeholder="e.g. 100" />
          <p class="text-xs text-[hsl(var(--muted-fg))] mt-1">
            Total price for every group of {{ discountForm.minQuantity }} units.
          </p>
        </div>

        <!-- Live preview -->
        <div
          v-if="discountForm.minQuantity >= 2 && discountForm.discountedPrice"
          class="bg-success/8 border border-success/25 rounded-md px-4 py-3 text-xs space-y-1"
        >
          <div class="font-semibold text-success">Preview</div>
          <div class="text-[hsl(var(--foreground))]">
            Buy {{ discountForm.minQuantity }} × {{ discountProduct.name }}
          </div>
          <div class="flex items-center gap-3 font-mono">
            <span class="line-through text-[hsl(var(--muted-fg))]">
              {{ formatCurrency(bundleRegularPrice(discountProduct)) }}
            </span>
            <span class="text-success font-semibold">
              {{ formatCurrency(+discountForm.discountedPrice) }}
            </span>
            <span class="text-success">
              (save {{ formatCurrency(bundleRegularPrice(discountProduct) - +discountForm.discountedPrice) }})
            </span>
          </div>
        </div>

        <div class="flex items-center justify-between pt-1">
          <button
            v-if="discountsStore.hasRule(discountProduct.id)"
            class="btn btn-danger btn-sm"
            @click="showDeleteDiscount = true"
          >
            Remove Rule
          </button>
          <div v-else />
          <div class="flex gap-2">
            <button class="btn btn-secondary btn-sm" @click="showDiscountModal = false">Cancel</button>
            <button class="btn btn-primary btn-sm" :disabled="savingDiscount" @click="saveDiscount">
              {{ savingDiscount ? 'Saving…' : 'Save Rule' }}
            </button>
          </div>
        </div>
      </div>
    </AppModal>

    <!-- Confirm delete product -->
    <ConfirmModal
      :show="showConfirm"
      title="Delete Product"
      message="Are you sure you want to delete this product? This cannot be undone."
      danger
      @confirm="doDelete"
      @cancel="showConfirm = false"
    />

    <!-- Confirm delete discount rule -->
    <ConfirmModal
      :show="showDeleteDiscount"
      title="Remove Discount Rule"
      :message="`Remove the discount rule for ${discountProduct?.name}? This cannot be undone.`"
      confirm-label="Remove"
      danger
      @confirm="doDeleteDiscount"
      @cancel="showDeleteDiscount = false"
    />
  </div>
</template>
