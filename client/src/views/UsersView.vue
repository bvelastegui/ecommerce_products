<script setup lang="ts">
import PageHeader from '@/components/PageHeader.vue';
import { DataTable, Column, Button, Tag, useConfirm, useToast } from 'primevue';
import { useUsersStore } from '@/stores/users';
import { onMounted, ref } from 'vue';
import UserForm from '@/components/UserForm.vue';
import type { User } from '@/models';
import Plus from '@primeicons/vue/plus-circle';
import Box from '@primeicons/vue/box';
import ExclamationTriangle from '@primeicons/vue/exclamation-triangle';

const toast = useToast();
const confirm = useConfirm();
const usersStore = useUsersStore();
const showModal = ref(false);

const currentUser = ref<User>({
  _id: null,
  name: null,
  email: null,
  password: null,
  role: 'client',
  addresses: [],
});

onMounted(() => {
  usersStore.fetchUsers();
});

function handleClickOnAdd() {
  currentUser.value = {
    _id: null,
    name: null,
    email: null,
    password: null,
    role: 'client',
    addresses: [],
  };
  showModal.value = true;
}

function handleDelete(id: string) {
  confirm.require({
    message: '¿Seguro que deseas eliminar este usuario?',
    header: 'Eliminar Usuario',
    icon: ExclamationTriangle,
    acceptProps: {
      label: 'Eliminar',
      severity: 'danger',
    },
    rejectProps: {
      label: 'Cancelar',
      severity: 'secondary',
    },
    accept: async () => {
      await usersStore.deleteUser(id);
      toast.add({
        severity: 'success',
        summary: 'Usuario Eliminado',
        detail: 'El usuario ha sido eliminado correctamente.',
      });
      await usersStore.fetchUsers();
    },
    reject: () => {
      console.log('Rejected');
    },
  });
}

async function handleEdit(id: string) {
  const user = await usersStore.fetchUserById(id);
  if (user) {
    currentUser.value = {
      ...user,
      // La contraseña nunca llega del backend: en blanco significa "no cambiar"
      password: null,
      addresses: user.addresses ?? [],
    };
  }
  showModal.value = true;
}

async function handleSubmitOnUserForm(userData: User) {
  // Solo enviamos los campos que acepta el DTO del backend.
  // Las direcciones se envían sin el _id del subdocumento (el ValidationPipe lo rechaza)
  const payload: Partial<User> = {
    name: userData.name,
    email: userData.email,
    role: userData.role,
    addresses: (userData.addresses ?? []).map((address) => ({
      street: address.street,
      city: address.city,
      zipCode: address.zipCode,
      isDefault: address.isDefault ?? false,
    })),
  };

  // La contraseña solo se envía si el usuario escribió una nueva
  if (userData.password) {
    payload.password = userData.password;
  }

  if (userData._id) {
    await usersStore.updateUser(userData._id, payload);
  } else {
    await usersStore.createUser(payload);
  }

  if (!usersStore.error) {
    toast.add({
      severity: 'success',
      summary: 'Usuario Guardado',
      detail: 'El usuario ha sido guardado correctamente.',
    });
    showModal.value = false;
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: usersStore.error,
    });
    usersStore.error = null;
  }
  await usersStore.fetchUsers();
}
</script>

<template>
  <PageHeader title="Usuarios" />
  <UserForm
    v-model:visible="showModal"
    v-model="currentUser"
    @toggle:visible="showModal = !showModal"
    @submit="handleSubmitOnUserForm"
  />
  <div class="flex-1 p-4 flex flex-col gap-4">
    <div class="flex rounded-lg bg-surface-100 dark:bg-surface-800 p-2">
      <Button class="ml-auto" @click="handleClickOnAdd">
        <Plus />
        Agregar Usuario
      </Button>
    </div>
    <div class="rounded-t-lg bg-surface-100 dark:bg-surface-800 p-1">
      <DataTable paginator :rows="10" :value="usersStore.users" :loading="usersStore.loading">
        <template #empty>
          <div class="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <div
              class="w-14 h-14 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center"
            >
              <Box class="w-6! h-6! text-surface-400 dark:text-surface-500" />
            </div>
            <div>
              <p class="m-0 font-semibold text-surface-900 dark:text-surface-0">
                No existen usuarios
              </p>
              <p class="mt-1 text-sm text-surface-500 dark:text-surface-400">
                Agrega tu primer usuario para comenzar
              </p>
            </div>
            <Button size="small" @click="handleClickOnAdd">
              <Plus />
              Agregar usuario
            </Button>
          </div>
        </template>

        <Column field="name" header="Nombre" header-class="rounded-tl-lg" />
        <Column field="email" header="Email" />
        <Column header="Rol">
          <template #body="{ data }">
            <Tag
              :value="data.role === 'admin' ? 'Administrador' : 'Cliente'"
              :severity="data.role === 'admin' ? 'info' : 'success'"
            />
          </template>
        </Column>
        <Column header="Direcciones">
          <template #body="{ data }">
            {{ data.addresses?.length || 0 }}
          </template>
        </Column>
        <Column
          exclude-global-filter
          header-style="justify-items: end;"
          body-style="text-align: end;"
          header-class="rounded-tr-lg"
        >
          <template #body="{ data }">
            <div class="flex gap-2 justify-end">
              <Button size="small" severity="danger" @click="handleDelete(data._id)"
                >Eliminar</Button
              >
              <Button size="small" severity="secondary" @click="handleEdit(data._id)"
                >Editar</Button
              >
            </div>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>
