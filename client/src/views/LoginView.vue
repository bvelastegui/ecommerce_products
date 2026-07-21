<script setup lang="ts">
import { Button, InputText, Label, Password, Message } from 'primevue';
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const email = ref<string>('');
const password = ref<string>('');

async function handleSubmit() {
  const success = await authStore.login(email.value, password.value);
  if (success) {
    // Volvemos a la ruta que el usuario intentaba visitar (si venía de un redirect)
    const redirect = (route.query.redirect as string) || '/';
    router.push(redirect);
  }
}
</script>

<template>
  <div class="flex-1 flex items-center justify-center bg-surface-100 dark:bg-surface-900 p-4">
    <div class="w-full max-w-sm rounded-lg bg-surface-0 dark:bg-surface-800 p-8 shadow-sm border border-surface-200 dark:border-surface-700">
      <div class="flex flex-col items-center gap-2 mb-6">
        <div
          class="flex size-10 items-center justify-center rounded-md bg-linear-to-br from-violet-500 to-indigo-600 text-white text-lg font-bold"
        >
          E
        </div>
        <h1 class="m-0 text-xl font-semibold text-surface-900 dark:text-surface-0">
          Ecommerce Admin
        </h1>
        <p class="m-0 text-sm text-surface-500 dark:text-surface-400">
          Ingresa con tu cuenta de administrador
        </p>
      </div>
      <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
        <div class="flex flex-col gap-1">
          <Label for="email" class="font-semibold">Email</Label>
          <InputText
            id="email"
            v-model="email"
            type="email"
            placeholder="admin@example.com"
            required
            fluid
          />
        </div>
        <div class="flex flex-col gap-1">
          <Label for="password" class="font-semibold">Contraseña</Label>
          <Password
            id="password"
            v-model="password"
            :feedback="false"
            toggle-mask
            required
            fluid
          />
        </div>
        <Message v-if="authStore.error" severity="error" :closable="false">
          {{ authStore.error }}
        </Message>
        <Button type="submit" :loading="authStore.loading" class="mt-2">
          Ingresar
        </Button>
      </form>
    </div>
  </div>
</template>

<style scoped></style>
