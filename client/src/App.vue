<script setup lang="ts">
import { SidebarLayout, SidebarMain, ConfirmDialog, Toast } from 'primevue';
import MainSidebar from '@/components/MainSidebar.vue';
</script>

<template>
  <div class="border border-surface-200 dark:border-surface-700 h-screen overflow-hidden">
    <SidebarLayout class="min-h-full! relative!">
      <MainSidebar />
      <SidebarMain>
        <ConfirmDialog />
        <Toast />
        <RouterView />
      </SidebarMain>
    </SidebarLayout>
  </div>
</template>

<style scoped></style>
