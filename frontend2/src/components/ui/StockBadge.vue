<script setup>
import { computed } from 'vue'
import { stockStatus } from '@/utils/format'

const props = defineProps({ product: Object })

const status = computed(() => stockStatus(props.product))
const map = {
  success: 'badge-success',
  warning: 'badge-warning',
  danger:  'badge-danger',
  muted:   'badge-neutral',
}
</script>

<template>
  <span class="badge" :class="map[status.cls]">{{ status.label }}</span>
</template>
