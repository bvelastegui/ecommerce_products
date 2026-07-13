<script setup lang="ts">
import { Dialog, InputText, Label, Button, Textarea, InputNumber } from 'primevue';
import { computed } from 'vue';
import type { Product } from '@/models';
import Plus from '@primeicons/vue/plus';
import Minus from '@primeicons/vue/minus';

const emit = defineEmits(['toggle:visible', 'submit']);
const visible = defineModel('visible', { type: Boolean, default: false });
const product = defineModel<Product>({
  type: Object,
  required: true,
});

const header = computed(() => (product.value?._id ? 'Editar Producto' : 'Agregar Producto'));

function handleClickOnCancel() {
  product.value = {
    _id: null,
    title: null,
    description: null,
    price: null,
    category: null,
    stock: null,
  };

  emit('toggle:visible');
}
function handleClickOnSave() {
  emit('submit');
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
          <InputText id="title" v-model="product.title" />
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
            v-model="product.price"
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
          <InputText id="category" v-model="product.category" />
        </div>
        <div class="flex justify-end gap-2">
          <Button severity="secondary" @click="handleClickOnCancel">Cancelar</Button>
          <Button @click="handleClickOnSave">Guardar</Button>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<style scoped></style>
