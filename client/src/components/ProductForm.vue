<script setup lang="ts">
import {
  Dialog,
  InputText,
  Label,
  Button,
  Textarea,
  InputNumber,
  Divider,
  FileUpload,
  Select,
  type FileUploadSelectEvent,
  type FileUploadRemoveEvent,
} from 'primevue';
import { computed, ref } from 'vue';
import { useCategoriesStore } from '@/stores/categories';
import type { Product } from '@/models';
import Plus from '@primeicons/vue/plus';
import Minus from '@primeicons/vue/minus';
import Trash from '@primeicons/vue/trash';

const emit = defineEmits(['toggle:visible', 'submit']);
const visible = defineModel('visible', { type: Boolean, default: false });
const product = defineModel<Product>({
  type: Object,
  required: true,
});

// Las categorías las carga la vista (ProductsView)
const categoriesStore = useCategoriesStore();

// Las imágenes se sirven desde la raíz del servidor (no bajo /api)
const serverUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(
  /\/api\/?$/,
  '',
);

// Quita una imagen existente de la lista que se conservará al guardar
function handleRemoveExistingImage(index: number) {
  product.value.images?.splice(index, 1);
}

// Referencia para guardar temporalmente los archivos seleccionados en el FileUpload
const selectedFiles = ref<File[]>([]);

const header = computed(() => (product.value?._id ? 'Editar Producto' : 'Agregar Producto'));

// Función que captura los archivos cuando el usuario los selecciona en el FileUpload
function handleFileSelect(event: FileUploadSelectEvent) {
  // PrimeVue pasa los archivos en event.files
  selectedFiles.value = event.files;
}

// Función para manejar la eliminación de un archivo seleccionado antes de enviarlo
function handleFileRemove(event: FileUploadRemoveEvent) {
  // Si el usuario quita un archivo de la lista antes de guardar, actualizamos el array
  selectedFiles.value = selectedFiles.value.filter((file) => file.name !== event.file.name);
}

function handleClickOnCancel() {
  product.value = {
    _id: null,
    name: null,
    description: null,
    basePrice: null,
    categoryId: null,
    stock: null,
    images: [],
  };
  // Limpiamos los archivos seleccionados si el usuario cancela
  selectedFiles.value = [];
  emit('toggle:visible');
}

function handleClickOnSave() {
  // Emitimos un objeto que contiene tanto la data plana como los archivos listos para armar el FormData en el padre
  emit('submit', {
    productData: product.value,
    files: selectedFiles.value,
  });

  // Limpiamos el array interno de archivos después de emitir
  selectedFiles.value = [];
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
          <Label for="title" class="font-semibold">Titulo</Label>
          <InputText id="title" v-model="product.name" />
        </div>
        <div class="flex flex-col gap-1">
          <Label for="description" class="font-semibold">Descripción</Label>
          <Textarea auto-resize rows="5" id="description" v-model="product.description" />
        </div>
        <div class="flex flex-col gap-1">
          <Label for="price" class="font-semibold">Precio</Label>
          <InputNumber
            mode="currency"
            currency="USD"
            locale="es-EC"
            id="price"
            v-model="product.basePrice"
          />
        </div>
        <div class="flex flex-col gap-1">
          <Label for="stock" class="font-semibold">Stock</Label>
          <InputNumber
            show-buttons
            button-layout="horizontal"
            id="stock"
            v-model="product.stock"
            :step="1"
          >
            <template #incrementicon>
              <Plus />
            </template>
            <template #decrementicon>
              <Minus />
            </template>
          </InputNumber>
        </div>
        <div class="flex flex-col gap-1">
          <Label for="category" class="font-semibold">Categoría</Label>
          <Select
            id="category"
            v-model="product.categoryId"
            :options="categoriesStore.categories"
            option-label="name"
            option-value="_id"
            placeholder="Selecciona una categoría"
            :loading="categoriesStore.loading"
          />
        </div>
        <Divider />
        <div class="flex flex-col gap-2">
          <Label class="font-semibold">Imágenes del Producto</Label>
          <!-- Imágenes actuales: al quitarlas aquí se eliminan al guardar -->
          <div v-if="product.images && product.images.length > 0" class="flex flex-wrap gap-2">
            <div v-for="(image, index) in product.images" :key="image" class="relative">
              <img
                :src="`${serverUrl}${image}`"
                :alt="`Imagen ${index + 1} del producto`"
                class="w-16 h-16 object-cover rounded border border-surface-200 dark:border-surface-700"
              />
              <Button
                size="small"
                severity="danger"
                rounded
                class="absolute! -top-2 -right-2 w-5! h-5! p-0!"
                @click="handleRemoveExistingImage(index)"
              >
                <Trash class="w-3! h-3!" />
              </Button>
            </div>
          </div>
          <FileUpload
            mode="advanced"
            name="images"
            :multiple="true"
            accept="image/*"
            :maxFileSize="2000000"
            customUpload
            :auto="false"
            :showUploadButton="false"
            :showCancelButton="false"
            chooseLabel="Seleccionar Imágenes"
            @select="handleFileSelect"
            @remove="handleFileRemove"
          >
            <template #empty>
              <div class="flex items-center justify-center p-4">
                <p class="m-0 text-sm text-surface-500">Arrastra y suelta imágenes aquí.</p>
              </div>
            </template>
          </FileUpload>
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
