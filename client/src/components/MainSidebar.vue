<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import Palette from '@primeicons/vue/palette';
import Inbox from '@primeicons/vue/inbox';
import Home from '@primeicons/vue/home';
import Users from '@primeicons/vue/users';
import Box from '@primeicons/vue/box';
import Dollar from '@primeicons/vue/dollar';
import {
  Sidebar,
  SidebarBackdrop,
  SidebarSpacer,
  SidebarAside,
  SidebarPanel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarFooter,
  SidebarContent,
  SidebarGroupContent,
  Avatar,
} from 'primevue';

const router = useRouter();
const isMobile = ref(false);
const open = ref(true);
let mql: MediaQueryList | null = null;
let onMqlChange: null | ((event: MediaQueryListEvent) => void) = null;

onMounted(() => {
  if (typeof window === 'undefined') return;

  mql = window.matchMedia('(max-width: 1023px)');
  isMobile.value = mql.matches;
  open.value = !isMobile.value;
  onMqlChange = (event) => {
    isMobile.value = event.matches;
    open.value = !event.matches;
  };
  mql.addEventListener('change', onMqlChange);
});

onBeforeUnmount(() => {
  if (mql && onMqlChange) {
    mql.removeEventListener('change', onMqlChange);
  }
});

const items = computed(() => [
  {
    label: 'Inicio',
    icon: Home,
    isActive: router.currentRoute.value.name === 'Home',
    command: () => router.push({ name: 'Home' }),
  },
  {
    label: 'Productos',
    icon: Box,
    isActive: router.currentRoute.value.name === 'Products',
    command: () => router.push({ name: 'Products' }),
  },
  {
    label: 'Categorías',
    icon: Palette,
    isActive: router.currentRoute.value.name === 'Categories',
    command: () => router.push({ name: 'Categories' }),
  },
  {
    label: 'Usuarios',
    icon: Users,
    isActive: router.currentRoute.value.name === 'Users',
    command: () => router.push({ name: 'Users' }),
  },
  {
    label: 'Ventas',
    icon: Inbox,
    isActive: router.currentRoute.value.name === 'Orders',
    command: () => router.push({ name: 'Orders' }),
  },
  {
    label: 'Pagos',
    icon: Dollar,
    isActive: router.currentRoute.value.name === 'Payments',
    command: () => router.push({ name: 'Payments' }),
  },
]);
</script>

<template>
  <SidebarBackdrop v-if="isMobile && open" class="absolute!" />
  <Sidebar
    id="mobile-nav"
    :collapsible="isMobile ? 'offcanvas' : 'icon'"
    :overlay="isMobile"
    v-model:open="open"
    width="14rem"
  >
    <SidebarSpacer />
    <SidebarAside>
      <SidebarPanel>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton class="p-1!" @click="router.push({ name: 'Home' })">
                <div
                  class="flex size-6 shrink-0 items-center justify-center rounded-md bg-linear-to-br from-violet-500 to-indigo-600 text-white text-xs font-bold leading-none"
                >
                  E
                </div>
                <span class="font-semibold text-sm">Ecommerce</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Menu</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem v-for="item in items" :key="item.label">
                  <SidebarMenuButton :isActive="item.isActive" @click="item.command()">
                    <component :is="item.icon" />
                    <span>{{ item.label }}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton class="p-1!">
                <Avatar label="JD" shape="circle" class="size-6 shrink-0 text-xs" />
                <span>John Doe</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </SidebarPanel>
    </SidebarAside>
  </Sidebar>
</template>

<style scoped></style>
