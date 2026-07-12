<script setup lang="ts">
import SidebarIcon from '@primeicons/vue/sidebar';
import { SidebarTrigger } from 'primevue';

defineProps<{
  title: string;
}>();
</script>

<template>
  <header
    class="flex h-12 items-center gap-2 border-b border-surface-200 dark:border-surface-700 px-4"
  >
    <SidebarTrigger severity="secondary" target="mobile-nav" :text="true" size="small">
      <SidebarIcon />
    </SidebarTrigger>
    <span class="text-sm font-medium">{{ title }}</span>
  </header>
</template>
