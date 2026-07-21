<script setup lang="ts">
import {
  Dialog,
  InputText,
  Label,
  Button,
  Divider,
  Select,
  Password,
  ToggleSwitch,
} from 'primevue';
import { computed } from 'vue';
import type { User } from '@/models';
import Plus from '@primeicons/vue/plus';
import Trash from '@primeicons/vue/trash';

const emit = defineEmits(['toggle:visible', 'submit']);
const visible = defineModel('visible', { type: Boolean, default: false });
const user = defineModel<User>({
  type: Object,
  required: true,
});

const roleOptions = [
  { label: 'Cliente', value: 'client' },
  { label: 'Administrador', value: 'admin' },
];

const isEditing = computed(() => !!user.value?._id);
const header = computed(() => (isEditing.value ? 'Editar Usuario' : 'Agregar Usuario'));

function emptyUser(): User {
  return {
    _id: null,
    name: null,
    email: null,
    password: null,
    role: 'client',
    addresses: [],
  };
}

function handleAddAddress() {
  if (!user.value.addresses) user.value.addresses = [];
  user.value.addresses.push({
    street: null,
    city: null,
    zipCode: null,
    isDefault: false,
  });
}

function handleRemoveAddress(index: number) {
  user.value.addresses?.splice(index, 1);
}

function handleClickOnCancel() {
  user.value = emptyUser();
  emit('toggle:visible');
}

function handleClickOnSave() {
  emit('submit', user.value);
}
</script>

<template>
  <div class="flex justify-center">
    <Dialog
      v-model:visible="visible"
      modal
      draggable
      :close-on-escape="false"
      :closable="false"
      :header="header"
      :style="{ width: '35rem' }"
    >
      <div class="flex flex-col gap-6">
        <div class="flex flex-col gap-1">
          <Label for="name" class="font-semibold">Nombre</Label>
          <InputText id="name" v-model="user.name" />
        </div>
        <div class="flex flex-col gap-1">
          <Label for="email" class="font-semibold">Email</Label>
          <InputText id="email" type="email" v-model="user.email" />
        </div>
        <div class="flex flex-col gap-1">
          <Label for="password" class="font-semibold">Contraseña</Label>
          <Password
            id="password"
            v-model="user.password"
            :feedback="false"
            toggle-mask
            :placeholder="isEditing ? 'Dejar en blanco para mantener la actual' : ''"
            fluid
          />
        </div>
        <div class="flex flex-col gap-1">
          <Label for="role" class="font-semibold">Rol</Label>
          <Select
            id="role"
            v-model="user.role"
            :options="roleOptions"
            option-label="label"
            option-value="value"
            placeholder="Selecciona un rol"
          />
        </div>
        <Divider />
        <div class="flex flex-col gap-3">
          <Label class="font-semibold">Direcciones</Label>
          <div
            v-for="(address, index) in user.addresses"
            :key="index"
            class="flex flex-col gap-2 rounded-lg border border-surface-200 dark:border-surface-700 p-3"
          >
            <div class="flex items-center justify-between">
              <span class="text-sm font-semibold">Dirección {{ index + 1 }}</span>
              <Button size="small" severity="danger" text @click="handleRemoveAddress(index)">
                <Trash />
              </Button>
            </div>
            <InputText v-model="address.street" placeholder="Calle" />
            <div class="flex gap-2">
              <InputText v-model="address.city" placeholder="Ciudad" class="flex-1" />
              <InputText v-model="address.zipCode" placeholder="Código postal" class="w-32" />
            </div>
            <div class="flex items-center gap-2">
              <ToggleSwitch v-model="address.isDefault" :input-id="`isDefault-${index}`" />
              <Label :for="`isDefault-${index}`" class="text-sm">Dirección principal</Label>
            </div>
          </div>
          <Button severity="secondary" size="small" @click="handleAddAddress">
            <Plus />
            Agregar dirección
          </Button>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2 mt-4 pt-4">
          <Button severity="secondary" @click="handleClickOnCancel">Cancelar</Button>
          <Button @click="handleClickOnSave">Guardar</Button>
        </div>
      </template>
    </Dialog>
  </div>
</template>

<style scoped></style>
