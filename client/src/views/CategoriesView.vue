<script setup lang="ts">
import PageHeader from '@/components/PageHeader.vue';
import { DataTable, Column, Button, Tag, useConfirm, useToast } from 'primevue';
import { useCategoriesStore } from '@/stores/categories';
import { onMounted, ref } from 'vue';
import CategoryForm from '@/components/CategoryForm.vue';
import type { Category } from '@/models';
import Plus from '@primeicons/vue/plus-circle';
import Box from '@primeicons/vue/box';
import ExclamationTriangle from '@primeicons/vue/exclamation-triangle';

const toast = useToast();
const confirm = useConfirm();
const categoriesStore = useCategoriesStore();
const showModal = ref(false);

const currentCategory = ref<Category>({
  _id: null,
  name: null,
  description: null,
  isActive: true,
});

onMounted(() => {
  categoriesStore.fetchCategories();
});

// Genera el slug a partir del nombre (el backend lo requiere y debe ser único)
function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
}

function handleClickOnAdd() {
  currentCategory.value = {
    _id: null,
    name: null,
    description: null,
    isActive: true,
  };
  showModal.value = true;
}

function handleDelete(id: string) {
  confirm.require({
    message: '¿Seguro que deseas eliminar esta categoría?',
    header: 'Eliminar Categoría',
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
      await categoriesStore.deleteCategory(id);
      toast.add({
        severity: 'success',
        summary: 'Categoría Eliminada',
        detail: 'La categoría ha sido eliminada correctamente.',
      });
    },
    reject: () => {
      console.log('Rejected');
    },
  });
}

async function handleEdit(id: string) {
  currentCategory.value = (await categoriesStore.fetchCategoryById(id)) || currentCategory.value;
  showModal.value = true;
}

async function handleSubmitOnCategoryForm(categoryData: Category) {
  const payload: Category = {
    // Solo enviamos los campos que acepta el DTO del backend
    // (el documento de Mongo incluye createdAt, updatedAt y __v que el ValidationPipe rechaza)
    name: categoryData.name,
    slug: categoryData.name ? slugify(categoryData.name) : null,
    description: categoryData.description,
    isActive: categoryData.isActive,
  };

  if (categoryData._id) {
    await categoriesStore.updateCategory(categoryData._id, payload);
  } else {
    await categoriesStore.createCategory(payload);
  }

  if (!categoriesStore.error) {
    toast.add({
      severity: 'success',
      summary: 'Categoría Guardada',
      detail: 'La categoría ha sido guardada correctamente.',
    });
    showModal.value = false;
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: categoriesStore.error,
    });
    categoriesStore.error = null;
  }
}
</script>

<template>
  <PageHeader title="Categorías" />
  <CategoryForm
    v-model:visible="showModal"
    v-model="currentCategory"
    @toggle:visible="showModal = !showModal"
    @submit="handleSubmitOnCategoryForm"
  />
  <div class="flex-1 p-4 flex flex-col gap-4">
    <div class="flex rounded-lg bg-surface-100 dark:bg-surface-800 p-2">
      <Button class="ml-auto" @click="handleClickOnAdd">
        <Plus />
        Agregar Categoría
      </Button>
    </div>
    <div class="rounded-t-lg bg-surface-100 dark:bg-surface-800 p-1">
      <DataTable paginator :rows="10"  :value="categoriesStore.categories" :loading="categoriesStore.loading">
        <template #empty>
          <div class="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <div
              class="w-14 h-14 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center"
            >
              <Box class="w-6! h-6! text-surface-400 dark:text-surface-500" />
            </div>
            <div>
              <p class="m-0 font-semibold text-surface-900 dark:text-surface-0">
                No existen categorías
              </p>
              <p class="mt-1 text-sm text-surface-500 dark:text-surface-400">
                Agrega tu primera categoría para comenzar
              </p>
            </div>
            <Button size="small" @click="handleClickOnAdd">
              <Plus />
              Agregar categoría
            </Button>
          </div>
        </template>

        <Column field="name" header="Nombre" header-class="rounded-tl-lg" />
        <Column field="slug" header="Slug" />
        <Column field="description" header="Descripción" />
        <Column header="Estado">
          <template #body="{ data }">
            <Tag
              :value="data.isActive ? 'Activa' : 'Inactiva'"
              :severity="data.isActive ? 'success' : 'danger'"
            />
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
