<script setup>
import AppModal from './AppModal.vue'

defineProps({
  show:         Boolean,
  title:        { type: String, default: 'Confirm' },
  message:      String,
  confirmLabel: { type: String, default: 'Confirm' },
  danger:       { type: Boolean, default: false },
})
defineEmits(['confirm', 'cancel'])
</script>

<template>
  <AppModal :show="show" :title="title" @close="$emit('cancel')">
    <p class="text-sm text-[hsl(var(--muted-fg))] mb-6 leading-relaxed">{{ message }}</p>
    <div class="flex gap-2 justify-end">
      <button class="btn btn-secondary btn-sm" @click="$emit('cancel')">Cancel</button>
      <button
        class="btn btn-sm"
        :class="danger ? 'btn-danger' : 'btn-primary'"
        @click="$emit('confirm')"
      >
        {{ confirmLabel }}
      </button>
    </div>
  </AppModal>
</template>
