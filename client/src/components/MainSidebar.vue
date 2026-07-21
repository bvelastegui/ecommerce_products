<script setup lang="ts">
import {computed, onBeforeUnmount, onMounted, ref, useTemplateRef} from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import Palette from '@primeicons/vue/palette';
import Inbox from '@primeicons/vue/inbox';
import Home from '@primeicons/vue/home';
import Users from '@primeicons/vue/users';
import Box from '@primeicons/vue/box';
import Dollar from '@primeicons/vue/dollar';
import ChevronDown from '@primeicons/vue/chevron-down';
import SignOut from '@primeicons/vue/sign-out';
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
  Menu,
} from 'primevue';

const router = useRouter();
const authStore = useAuthStore();
const isMobile = ref(false);
const open = ref(true);
const userMenu = useTemplateRef('userMenu')
const userMenuItems = [
  {
    label: 'Cerrar Sesión',
    icon: SignOut,
    command: () => handleLogout(),
  }
]
const userInitials = computed(() => {
  if (!authStore.user?.name) return '?';
  return authStore.user.name
    .split(' ')
    .map((word) => word.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();
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

function handleLogout() {
  authStore.logout();
  router.push({ name: 'Login' });
}
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
              <SidebarMenuButton
                class="p-1!"
                @click="(e: Event) => userMenu!.toggle(e)"
                aria-haspopup="true"
              >
                <Avatar :label="userInitials" shape="circle" class="size-6 shrink-0 text-xs" />
                <div class="flex flex-col items-start overflow-hidden">
                  <span class="text-sm truncate max-w-full">{{ authStore.user?.name }}</span>
                </div>
                <ChevronDown class="ml-auto" />
              </SidebarMenuButton>
              <Menu ref="userMenu" id="user_menu" :model="userMenuItems" :popup="true">
                <template #start>
                  <div class="px-3 py-1 text-xs font-medium text-muted-color">{{ authStore.user?.email }}</div>
                </template>
              </Menu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </SidebarPanel>
    </SidebarAside>
  </Sidebar>
</template>

<style scoped></style>
