<script setup>
import { useToastStore } from '@/stores/toast'
const toast = useToastStore()

const typeConfig = {
  success: { icon: '✓', cls: 'border-success/30 bg-success/10 text-success' },
  error:   { icon: '✕', cls: 'border-danger/30  bg-danger/10  text-danger'  },
  info:    { icon: 'i', cls: 'border-info/30    bg-info/10    text-info'    },
  warning: { icon: '!', cls: 'border-warning/30 bg-warning/10 text-warning' },
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
      <TransitionGroup
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-2 scale-95"
        enter-to-class="opacity-100 translate-y-0 scale-100"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0 scale-100"
        leave-to-class="opacity-0 translate-y-2 scale-95"
      >
        <div
          v-for="t in toast.toasts"
          :key="t.id"
          class="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg border text-sm font-medium shadow-lg min-w-[260px] max-w-xs bg-[hsl(var(--surface))]"
          :class="typeConfig[t.type]?.cls"
        >
          <span class="shrink-0 w-4 h-4 flex items-center justify-center font-bold text-[11px] rounded-full border border-current">
            {{ typeConfig[t.type]?.icon }}
          </span>
          <span class="flex-1 text-[hsl(var(--foreground))]">{{ t.message }}</span>
          <button
            class="shrink-0 opacity-40 hover:opacity-80 transition-opacity"
            @click="toast.remove(t.id)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
