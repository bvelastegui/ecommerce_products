<script setup lang="ts">
import { SidebarLayout, SidebarMain } from 'primevue';
import MainSidebar from '@/components/MainSidebar.vue';
</script>

<template>
  <div class="border border-surface-200 dark:border-surface-700 h-[calc(100vh-2rem)] rounded-lg overflow-hidden">
    <SidebarLayout class="min-h-full! relative!">
      <MainSidebar />
      <SidebarMain>
        <RouterView />
      </SidebarMain>
    </SidebarLayout>
  </div>
</template>

<style scoped></style>
