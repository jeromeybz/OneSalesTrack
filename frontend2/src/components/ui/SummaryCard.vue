<script setup>
defineProps({
  label: String,
  value: [String, Number],
  color: { type: String, default: 'neutral' },
})

const colorMap = {
  neutral: 'text-[hsl(var(--foreground))]',
  success: 'text-success',
  warning: 'text-warning',
  danger:  'text-danger',
  info:    'text-info',
}
</script>

<template>
  <div class="card p-4">
    <div class="text-[11px] font-medium text-[hsl(var(--muted-fg))] uppercase tracking-wider mb-2">
      {{ label }}
    </div>
    <div class="text-2xl font-semibold font-mono tracking-tight" :class="colorMap[color] ?? colorMap.neutral">
      {{ value }}
    </div>
  </div>
</template>
