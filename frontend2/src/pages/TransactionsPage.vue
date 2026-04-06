<script setup>
import { ref, onMounted } from 'vue'
import { useTransactionsStore } from '@/stores/transactions'
import { formatCurrency, formatDate, today } from '@/utils/format'
import SummaryCard from '@/components/ui/SummaryCard.vue'

const store = useTransactionsStore()
const date  = ref(today())

onMounted(() => fetchData())

async function fetchData() {
  await store.fetchTransactions(date.value ? { date: date.value } : {})
}
</script>

<template>
  <div class="max-w-[900px] mx-auto p-5">
    <div class="flex items-center gap-3 mb-5 flex-wrap">
      <h1 class="text-lg font-semibold flex-1">Sales Log</h1>
      <input type="date" v-model="date" class="input w-auto text-sm" @change="fetchData" />
      <button class="btn btn-secondary btn-sm" @click="date = ''; fetchData()">All Days</button>
    </div>

    <div class="grid grid-cols-4 gap-3 mb-6">
      <SummaryCard label="Revenue"        :value="formatCurrency(store.summary.revenue)"        color="success" />
      <SummaryCard label="Transactions"   :value="store.summary.transactions"                    color="neutral" />
      <SummaryCard label="Items Sold"     :value="store.summary.itemsSold"                       color="warning" />
      <SummaryCard label="Total Savings"  :value="formatCurrency(store.summary.totalDiscount)"  color="info"    />
    </div>

    <div v-if="store.loading" class="space-y-3">
      <div v-for="n in 4" :key="n" class="card p-4 h-20 animate-pulse bg-[hsl(var(--muted))]" />
    </div>

    <div v-else-if="store.transactions.length" class="space-y-3">
      <div v-for="tx in store.transactions" :key="tx.id" class="card overflow-hidden">
        <div class="bg-[hsl(var(--muted))] border-b border-[hsl(var(--border))] px-4 py-2.5 flex items-center gap-3 flex-wrap">
          <span class="font-mono text-xs text-[hsl(var(--muted-fg))]">#{{ String(tx.id).padStart(4, '0') }}</span>
          <span class="text-sm text-[hsl(var(--muted-fg))] flex-1">{{ formatDate(tx.createdAt) }}</span>
          <span v-if="tx.cashierName" class="text-xs text-[hsl(var(--muted-fg))] italic">by {{ tx.cashierName }}</span>
          <span class="font-mono font-semibold text-success text-sm">
            {{ formatCurrency(tx.items.reduce((s, i) => s + i.totalPrice, 0)) }}
          </span>
        </div>
        <div class="divide-y divide-[hsl(var(--border))]">
          <div v-for="item in tx.items" :key="item.id" class="px-4 py-2.5 flex items-center gap-3 text-sm">
            <span class="flex-1 font-medium flex items-center gap-2">
              {{ item.productName }}
              <span v-if="item.isDiscounted" class="badge badge-success text-[10px]">Discounted</span>
            </span>
            <span class="text-[hsl(var(--muted-fg))] font-mono text-xs w-8 text-center">×{{ item.quantity }}</span>
            <span class="text-[hsl(var(--muted-fg))] font-mono text-xs w-20 text-right">{{ formatCurrency(item.unitPrice) }}</span>
            <span v-if="item.isDiscounted" class="text-[hsl(var(--muted-fg))] font-mono text-xs w-24 text-right">
              <span class="line-through">{{ formatCurrency(item.originalTotal) }}</span>
            </span>
            <span v-else class="w-24" />
            <span class="font-mono text-xs w-20 text-right font-semibold">{{ formatCurrency(item.totalPrice) }}</span>
            <span class="font-mono text-xs w-20 text-right" :class="item.discountAmount > 0 ? 'text-success' : 'text-[hsl(var(--muted-fg))]'">
              {{ item.discountAmount > 0 ? '−' + formatCurrency(item.discountAmount) : '—' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-20 text-sm text-[hsl(var(--muted-fg))]">No transactions found.</div>
  </div>
</template>
