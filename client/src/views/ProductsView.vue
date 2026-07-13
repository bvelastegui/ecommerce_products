<script setup lang="ts">
import PageHeader from '@/components/PageHeader.vue';
import { DataTable, Column, Button, useConfirm, useToast } from 'primevue';
import { useProductsStore } from '@/stores/products';
import { onMounted, ref } from 'vue';
import ProductForm from '@/components/ProductForm.vue';
import type { Product } from '@/models';
import Plus from '@primeicons/vue/plus-circle';
import Box from '@primeicons/vue/box';
import ExclamationTriangle from '@primeicons/vue/exclamation-triangle';

const toast = useToast();
const confirm = useConfirm();
const productsStore = useProductsStore();
const showModal = ref(false);
const currentProduct = ref<Product>({
  _id: null,
  title: null,
  description: null,
  price: null,
  category: null,
  stock: null,
});

onMounted(() => {
  productsStore.fetchProducts();
});

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}
function handleClickOnAdd() {
  currentProduct.value = {
    _id: null,
    title: null,
    description: null,
    price: null,
    category: null,
    stock: null,
  };
  showModal.value = true;
}
function handleDelete(id: string) {
  confirm.require({
    message: '¿Seguro que deseas eliminar este producto?',
    header: 'Eliminar Producto',
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
      await productsStore.deleteProduct(id);
      toast.add({
        severity: 'success',
        summary: 'Producto Eliminado',
        detail: 'El producto ha sido eliminado correctamente.',
      });
    },
    reject: () => {
      console.log('Rejected');
    },
  });
}
async function handleEdit(id: string) {
  currentProduct.value = (await productsStore.fetchProductById(id)) || currentProduct.value;
  showModal.value = true;
}
function handleSubmitOnProductForm() {
  if (currentProduct.value._id) {
    productsStore.updateProduct(currentProduct.value._id, currentProduct.value);
  } else {
    productsStore.createProduct(currentProduct.value);
  }

  if (!productsStore.error) {
    toast.add({
      severity: 'success',
      summary: 'Producto Guardado',
      detail: 'El producto ha sido guardado correctamente.',
    });
    showModal.value = false;
  }
}
</script>

<template>
  <PageHeader title="Productos" />
  <ProductForm
    v-model:visible="showModal"
    v-model="currentProduct"
    @toggle:visible="showModal = !showModal"
    @submit="handleSubmitOnProductForm"
  />
  <div class="flex-1 p-4 flex flex-col gap-4">
    <div class="flex rounded-lg bg-surface-100 dark:bg-surface-800 p-4">
      <Button class="ml-auto" @click="handleClickOnAdd">
        <Plus />
        Agregar Producto
      </Button>
    </div>
    <div class="rounded-lg bg-surface-100 dark:bg-surface-800 p-4">
      <DataTable
        :value="productsStore.products"
        :loading="productsStore.loading"
      >
        <template #empty>
          <div class="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <div
              class="w-14 h-14 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center"
            >
              <Box class="w-6! h-6! text-surface-400 dark:text-surface-500" />
            </div>
            <div>
              <p class="m-0 font-semibold text-surface-900 dark:text-surface-0">
                No existen productos
              </p>
              <p class="mt-1 text-sm text-surface-500 dark:text-surface-400">
                Agrega tu primer producto para comenzar
              </p>
            </div>
            <Button size="small" @click="handleClickOnAdd">
              <Plus />
              Agregar producto
            </Button>
          </div>
        </template>
        <Column field="title" header="Titulo" header-class="rounded-tl-lg" />
        <Column field="description" header="Descripción" />
        <Column field="category" header="Categoría" />
        <Column header="Precio">
          <template #body="{ data }">
            {{ formatCurrency(data.price) }}
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
              <Button size="small" severity="danger" @click="handleDelete(data._id)">Eliminar</Button>
              <Button size="small" severity="secondary" @click="handleEdit(data._id)">Editar</Button>
            </div>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>
