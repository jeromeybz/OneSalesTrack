<script setup>
import { ref, computed, onMounted } from 'vue'
import { useReportsStore } from '@/stores/reports'

const store = useReportsStore()

const now   = new Date()
const year  = ref(now.getFullYear())
const month = ref(now.getMonth() + 1)

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

const years = computed(() => {
  const y = []
  for (let i = now.getFullYear(); i >= now.getFullYear() - 5; i--) y.push(i)
  return y
})

const selectedCategory = ref('All')

// Distinct categories from report rows
const categories = computed(() => {
  if (!store.report) return []
  const cats = [...new Set(store.report.rows.map(r => r.category).filter(Boolean))].sort()
  return ['All', ...cats]
})

// Rows filtered by selected category
const filteredRows = computed(() => {
  if (!store.report) return []
  if (selectedCategory.value === 'All') return store.report.rows
  return store.report.rows.filter(r => r.category === selectedCategory.value)
})

onMounted(() => fetchReport())

async function fetchReport() {
  selectedCategory.value = 'All'
  await store.fetchMonthly(year.value, month.value)
}

const days = computed(() => {
  if (!store.report) return []
  return Array.from({ length: store.report.daysInMonth }, (_, i) => i + 1)
})

// Product IDs in the currently filtered rows — used to filter deliveries
const filteredProductIds = computed(() =>
  new Set(filteredRows.value.map(r => r.id))
)

// Group delivery notes by recipient, filtered by selected category
const groupedDeliveries = computed(() => {
  if (!store.report?.deliveryNotes) return []
  const map = {}
  for (const dn of store.report.deliveryNotes) {
    // Filter items to only those whose product is in the current category filter
    const matchingItems = selectedCategory.value === 'All'
      ? dn.items
      : dn.items.filter(i => filteredProductIds.value.has(i.productId))

    if (!matchingItems.length) continue  // skip entire delivery if no matching items

    const key = dn.recipient || '—'
    if (!map[key]) map[key] = { recipient: key, entries: [] }
    map[key].entries.push({ ...dn, items: matchingItems })
  }
  return Object.values(map)
})

function fmtDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-PH', { month: 'short', day: '2-digit' })
}

// ── Excel Export ──────────────────────────────────────────────────────────────
async function exportExcel() {
  const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs')
  const rpt  = store.report
  if (!rpt) return

  const wb        = XLSX.utils.book_new()
  const monthName = MONTHS[rpt.month - 1]

  // ── Sheet 1: Sales Report ──
  const titleRow  = [`DAILY SALES - ${monthName.toUpperCase()} ${rpt.year}`]
  const headerRow = [
    'PRODUCT', 'INVENTORY\nBEGINNING', 'ADDITION', 'TOTAL\n(B to C)', 'DELIVERY/\nPULL-OUT',
    ...days.value.map(String),
    'TOTAL\n(E to AJ)', 'INVENTORY\nEND',
  ]

  const rowsToExport = selectedCategory.value === 'All' ? rpt.rows : rpt.rows.filter(r => r.category === selectedCategory.value)
  const dataRows = rowsToExport.map((r, i) => {
    const excelRow = i + 3 // title=1, header=2, data starts at 3
    return [
      r.name,
      r.beginningInventory ?? '',
      r.addition           ?? '',
      r.trackStock ? { f: `B${excelRow}+C${excelRow}` } : '',
      r.deliveryPullout || '',
      ...days.value.map((d) => r.dailySales[d] || ''),
      r.totalSold   || '',
      r.endingInventory ?? '',
    ]
  })

  // Blank row then DELIVERIES section
  const blankRow       = ['']
  const deliveryHeader = ['DELIVERIES:']
  // Filter delivery notes by category for export
  const exportDeliveries = rpt.deliveryNotes
    .map(dn => ({
      ...dn,
      items: selectedCategory.value === 'All'
        ? dn.items
        : dn.items.filter(i => filteredProductIds.value.has(i.productId))
    }))
    .filter(dn => dn.items.length > 0)

  const deliveryRows = exportDeliveries.length
    ? exportDeliveries.map((dn) => [
        '',
        `- ${dn.recipient}`,
        dn.note ? dn.note : dn.items.map(i => i.label).join(', '),
        '',
        fmtDate(dn.date),
      ])
    : [['', '(no deliveries this month)']]

  const wsData = [titleRow, headerRow, ...dataRows, blankRow, deliveryHeader, ...deliveryRows]
  const ws     = XLSX.utils.aoa_to_sheet(wsData)

  // Column widths
  ws['!cols'] = [
    { wch: 24 }, { wch: 10 }, { wch: 9 }, { wch: 9 }, { wch: 10 },
    ...days.value.map(() => ({ wch: 4 })),
    { wch: 10 }, { wch: 10 },
  ]

  // Merge title row across all columns
  const totalCols = 5 + days.value.length + 2
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } }]

  XLSX.utils.book_append_sheet(wb, ws, `${monthName} ${rpt.year}`)
  XLSX.writeFile(wb, `sales_report_${monthName}_${rpt.year}.xlsx`)
}
</script>

<template>
  <div class="max-w-full mx-auto p-5">

    <!-- Header -->
    <div class="flex items-center gap-3 mb-5 flex-wrap">
      <h1 class="text-lg font-semibold flex-1">Sales Report</h1>
      <select v-model="year"  class="input w-28 text-sm" @change="fetchReport">
        <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
      </select>
      <select v-model="month" class="input w-36 text-sm" @change="fetchReport">
        <option v-for="(m, i) in MONTHS" :key="i" :value="i + 1">{{ m }}</option>
      </select>
      <select v-model="selectedCategory" class="input w-36 text-sm">
        <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
      </select>
      <button
        class="btn btn-secondary btn-sm flex items-center gap-2"
        :disabled="!store.report || store.loading"
        @click="exportExcel"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Export Excel
      </button>
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="flex items-center justify-center py-24">
      <div class="w-6 h-6 border-2 border-[hsl(var(--border-2))] border-t-[hsl(var(--foreground))] rounded-full animate-spin" />
    </div>

    <div v-else-if="store.error" class="card p-6 text-sm text-danger">{{ store.error }}</div>

    <template v-else-if="store.report">

      <!-- ── Sales table ── -->
      <div class="card overflow-x-auto mb-6">
        <table class="text-xs border-collapse min-w-max w-full">
          <thead>
            <tr>
              <th
                :colspan="5 + days.length + 2"
                class="text-center py-2 px-3 font-semibold text-sm border border-[hsl(var(--border))] bg-[hsl(var(--muted))]"
              >
                DAILY SALES — {{ MONTHS[store.report.month - 1].toUpperCase() }} {{ store.report.year }}
              </th>
            </tr>
            <tr class="bg-[hsl(var(--surface-2))]">
              <th class="sticky left-0 z-10 bg-[hsl(var(--surface-2))] border border-[hsl(var(--border))] px-3 py-2 text-left font-semibold min-w-[180px]">PRODUCT</th>
              <th class="border border-[hsl(var(--border))] px-2 py-2 font-semibold whitespace-nowrap min-w-[72px]">INV. BEGIN</th>
              <th class="border border-[hsl(var(--border))] px-2 py-2 font-semibold min-w-[60px]">ADDITION</th>
              <th class="border border-[hsl(var(--border))] px-2 py-2 font-semibold min-w-[56px]">TOTAL</th>
              <th class="border border-[hsl(var(--border))] px-2 py-2 font-semibold whitespace-nowrap min-w-[72px]">DELIV/PULL</th>
              <th v-for="d in days" :key="d" class="border border-[hsl(var(--border))] w-8 py-2 font-semibold text-center">{{ d }}</th>
              <th class="border border-[hsl(var(--border))] px-2 py-2 font-semibold whitespace-nowrap min-w-[64px]">TOTAL SOLD</th>
              <th class="border border-[hsl(var(--border))] px-2 py-2 font-semibold whitespace-nowrap min-w-[72px]">INV. END</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in filteredRows" :key="row.id"
              class="hover:bg-[hsl(var(--muted))] transition-colors"
            >
              <td class="sticky left-0 z-10 bg-[hsl(var(--surface))] border border-[hsl(var(--border))] px-3 py-1.5 font-medium">
                <div class="flex items-center gap-1.5">
                  <span v-if="row.category" class="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-[hsl(var(--surface-2))] text-[hsl(var(--muted-fg))]">{{ row.category }}</span>
                  {{ row.name }}
                </div>
              </td>
              <td class="border border-[hsl(var(--border))] px-2 py-1.5 text-center font-mono">
                <span v-if="row.trackStock">{{ row.beginningInventory }}</span>
                <span v-else class="text-[hsl(var(--muted-fg))]">—</span>
              </td>
              <td class="border border-[hsl(var(--border))] px-2 py-1.5 text-center font-mono">
                <span v-if="row.trackStock && row.addition > 0" class="text-success font-semibold">+{{ row.addition }}</span>
                <span v-else-if="row.trackStock" class="text-[hsl(var(--muted-fg))]">—</span>
                <span v-else class="text-[hsl(var(--muted-fg))]">—</span>
              </td>
              <td class="border border-[hsl(var(--border))] px-2 py-1.5 text-center font-mono font-semibold">
                <span v-if="row.trackStock">{{ row.totalBeforeMonth }}</span>
                <span v-else class="text-[hsl(var(--muted-fg))]">—</span>
              </td>
              <!-- Delivery/pullout -->
              <td class="border border-[hsl(var(--border))] px-2 py-1.5 text-center font-mono">
                <span v-if="row.deliveryPullout > 0" class="text-info font-semibold">{{ row.deliveryPullout }}</span>
                <span v-else class="text-[hsl(var(--muted-fg))]">—</span>
              </td>
              <!-- Daily columns -->
              <td
                v-for="d in days" :key="d"
                class="border border-[hsl(var(--border))] w-8 py-1.5 text-center font-mono"
                :class="row.dailySales[d] > 0 ? 'font-semibold' : 'text-[hsl(var(--muted-fg))]'"
              >{{ row.dailySales[d] > 0 ? row.dailySales[d] : '' }}</td>
              <td class="border border-[hsl(var(--border))] px-2 py-1.5 text-center font-mono font-semibold"
                :class="row.totalSold > 0 ? '' : 'text-[hsl(var(--muted-fg))]'">
                {{ row.totalSold || '—' }}
              </td>
              <td class="border border-[hsl(var(--border))] px-2 py-1.5 text-center font-mono"
                :class="{
                  'text-danger font-semibold': row.trackStock && row.endingInventory <= 0,
                  'text-warning': row.trackStock && row.endingInventory > 0 && row.endingInventory <= 5,
                  'text-[hsl(var(--muted-fg))]': !row.trackStock,
                }">
                <span v-if="row.trackStock">{{ row.endingInventory }}</span>
                <span v-else>—</span>
              </td>
            </tr>
            <tr v-if="!filteredRows.length">
              <td :colspan="5 + days.length + 2" class="text-center py-12 text-[hsl(var(--muted-fg))]">No products found.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ── Deliveries section ── -->
      <div class="card p-5">
        <div class="text-sm font-semibold mb-4">DELIVERIES:</div>

        <div v-if="!groupedDeliveries.length" class="text-sm text-[hsl(var(--muted-fg))]">
          No deliveries{{ selectedCategory.value !== 'All' ? ' for this supplier' : '' }} this month.
        </div>

        <div v-else class="space-y-1">
          <template v-for="(group, gIdx) in groupedDeliveries" :key="gIdx">
            <!-- Recipient name -->
            <div class="text-sm font-medium mt-3 first:mt-0">
              — {{ group.recipient }}{{ group.recipient !== '—' ? ':' : '' }}
            </div>
            <!-- Each delivery entry -->
            <div
              v-for="dn in group.entries" :key="dn.id"
              class="flex items-baseline gap-6 pl-6 text-sm text-[hsl(var(--muted-fg))]"
            >
              <span class="flex-1">
                {{ dn.note || dn.items.map(i => i.label).join(', ') }}
              </span>
              <span class="font-mono text-xs shrink-0">{{ fmtDate(dn.date) }}</span>
            </div>
          </template>
        </div>
      </div>

    </template>
  </div>
</template>
