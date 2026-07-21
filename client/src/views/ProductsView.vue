<script setup lang="ts">
import PageHeader from '@/components/PageHeader.vue';
import { DataTable, Column, Button, Select, Tag, useConfirm, useToast } from 'primevue';
import { useProductsStore } from '@/stores/products';
import { useCategoriesStore } from '@/stores/categories';
import { computed, onMounted, ref } from 'vue';
import ProductForm from '@/components/ProductForm.vue';
import type { Product, Category } from '@/models';
import Plus from '@primeicons/vue/plus-circle';
import Box from '@primeicons/vue/box';
import ExclamationTriangle from '@primeicons/vue/exclamation-triangle';

const toast = useToast();
const confirm = useConfirm();
const productsStore = useProductsStore();
const categoriesStore = useCategoriesStore();
const showModal = ref(false);

// Categoría seleccionada en el filtro de la tabla (null = todas)
const selectedCategory = ref<string | null>(null);

// 1. Actualizamos el estado base para que coincida con el backend simplificado
const currentProduct = ref<Product>({
  _id: null,
  name: null, // Ajustado a 'name' (en tu código original era 'title')
  description: null,
  basePrice: null, // Ajustado a 'basePrice' (en tu código original era 'price')
  categoryId: null, // Ajustado a 'categoryId' (en tu código original era 'category')
  stock: null, // El stock vuelve a ser global
  images: [], // Arreglo para las rutas de las imágenes
});

onMounted(() => {
  productsStore.fetchProducts();
  categoriesStore.fetchCategories();
});

// Productos filtrados según la categoría seleccionada
const filteredProducts = computed(() => {
  if (!selectedCategory.value) return productsStore.products;
  return productsStore.products.filter(
    (product) => extractCategoryId(product.categoryId) === selectedCategory.value,
  );
});

function formatCurrency(value: number) {
  if (!value) return '$0.00';
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

function handleClickOnAdd() {
  currentProduct.value = {
    _id: null,
    name: null,
    description: null,
    basePrice: null,
    categoryId: null,
    stock: null,
    images: [],
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
  const product = await productsStore.fetchProductById(id);
  if (product) {
    currentProduct.value = {
      ...product,
      // El backend popula categoryId; el Select del formulario necesita solo el id
      categoryId: extractCategoryId(product.categoryId),
    };
  }
  showModal.value = true;
}

// categoryId puede venir populado (objeto Category) o como string
function extractCategoryId(categoryId: Product['categoryId']): string | null {
  if (categoryId && typeof categoryId === 'object') {
    return (categoryId as unknown as Category)._id ?? null;
  }
  return categoryId ?? null;
}

// 2. Lógica para recibir datos + archivos y armar el FormData (crear y actualizar)
async function handleSubmitOnProductForm(payload: { productData: Product; files: File[] }) {
  const { productData, files } = payload;
  const formData = new FormData();

  // Agregamos todos los campos de texto al FormData
  if (productData.name) formData.append('name', productData.name);
  if (productData.description) formData.append('description', productData.description);
  if (productData.basePrice) formData.append('basePrice', productData.basePrice.toString());
  if (productData.categoryId) formData.append('categoryId', productData.categoryId);
  if (productData.stock !== null) formData.append('stock', productData.stock!.toString());

  if (productData._id) {
    // Al actualizar enviamos la lista de imágenes existentes que se conservan
    // (las que el usuario quitó en el formulario ya no están en productData.images)
    formData.append('images', JSON.stringify(productData.images ?? []));

    // Los archivos nuevos viajan bajo la misma clave 'images'
    files.forEach((file) => {
      formData.append('images', file);
    });

    await productsStore.updateProduct(productData._id, formData);
  } else {
    // Al crear, las imágenes son solo los archivos seleccionados
    files.forEach((file) => {
      formData.append('images', file);
    });

    await productsStore.createProduct(formData);
  }

  if (!productsStore.error) {
    toast.add({
      severity: 'success',
      summary: 'Producto Guardado',
      detail: 'El producto ha sido guardado correctamente.',
    });
    showModal.value = false;
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: productsStore.error,
    });
    productsStore.error = null;
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
    <div class="flex flex-wrap rounded-lg bg-surface-100 dark:bg-surface-800 p-2 gap-2">
      <Select
        v-model="selectedCategory"
        :options="categoriesStore.categories"
        option-label="name"
        option-value="_id"
        placeholder="Filtrar por categoría"
        show-clear
        :loading="categoriesStore.loading"
        class="w-full md:w-72"
      />
      <Button class="ml-auto" @click="handleClickOnAdd">
        <Plus />
        Agregar Producto
      </Button>
    </div>
    <div class="rounded-t-lg bg-surface-100 dark:bg-surface-800 p-1">
      <DataTable :value="filteredProducts" :loading="productsStore.loading">
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

        <Column header="Producto" header-class="rounded-tl-lg" class="text-nowrap">
          <template #body="{ data }">
            <div class="flex items-center gap-3">
              <img
                v-if="data.images && data.images.length > 0"
                :src="`http://localhost:5000${data.images[0]}`"
                :alt="data.name"
                class="shrink-0 w-12 h-12 object-cover rounded-md shadow"
              />
              <div
                v-else
                class="w-12 h-12 bg-surface-100 dark:bg-surface-800 rounded flex items-center justify-center border border-surface-200 dark:border-surface-700"
              >
                <Box class="w-5 h-5 text-surface-400" />
              </div>
              <div class="flex flex-col">
                <span class="font-medium">{{ data.name }}</span>
                <span class="text-xs text-surface-500 dark:text-surface-400">{{ data.slug }}</span>
              </div>
            </div>
          </template>
        </Column>
        <Column header="Categoría" class="text-nowrap">
          <template #body="{ data }">
            <Tag :value="data.categoryId.name" severity="secondary" />
          </template>
        </Column>
        <Column field="stock" header="Stock" />
        <Column header="Precio">
          <template #body="{ data }">
            <span class="font-semibold">{{ formatCurrency(data.basePrice) }}</span>
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
              <Button
                size="small"
                severity="danger"
                @click="handleDelete(data._id)"
              >
                Eliminar
              </Button>
              <Button
                size="small"
                severity="secondary"
                @click="handleEdit(data._id)"
              >
                Editar
              </Button>
            </div>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>
