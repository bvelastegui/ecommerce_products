<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { SidebarLayout, SidebarMain, ConfirmDialog, Toast } from 'primevue';
import MainSidebar from '@/components/MainSidebar.vue';

const route = useRoute();

// Las rutas públicas (login) se renderizan sin el layout del panel
const isPublic = computed(() => !!route.meta.public);
</script>

<template>
  <div class="border border-surface-200 dark:border-surface-700 h-screen overflow-hidden">
    <!-- Rutas públicas: pantalla completa sin sidebar -->
    <div v-if="isPublic" class="h-full flex flex-col">
      <Toast />
      <RouterView />
    </div>
    <!-- Panel de administración -->
    <SidebarLayout v-else class="h-full! relative!">
      <MainSidebar />
      <SidebarMain class="h-full overflow-y-auto">
        <ConfirmDialog />
        <Toast />
        <RouterView />
      </SidebarMain>
    </SidebarLayout>
  </div>
</template>

<style scoped></style>
