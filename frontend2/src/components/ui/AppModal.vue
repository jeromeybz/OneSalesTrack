<script setup>
defineProps({ title: String, show: Boolean })
defineEmits(['close'])
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-200"
      enter-from-class="opacity-0"
      leave-active-class="transition-all duration-150"
      leave-to-class="opacity-0"
    >
      <div
        v-if="show"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4"
        style="background: rgba(0,0,0,0.5);"
        @click.self="$emit('close')"
      >
        <Transition
          enter-active-class="transition-all duration-200"
          enter-from-class="opacity-0 scale-95 translate-y-1"
          leave-active-class="transition-all duration-150"
          leave-to-class="opacity-0 scale-95 translate-y-1"
        >
          <div
            v-if="show"
            class="card w-full max-w-md shadow-xl"
          >
            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-[hsl(var(--border))]">
              <h2 class="text-sm font-semibold">{{ title }}</h2>
              <button
                class="w-7 h-7 flex items-center justify-center rounded-md text-[hsl(var(--muted-fg))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors text-base"
                @click="$emit('close')"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <!-- Body -->
            <div class="px-6 py-5">
              <slot />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
