<script setup lang="ts">
import { Dialog, InputText, Label, Button, Textarea, ToggleSwitch } from 'primevue';
import { computed } from 'vue';
import type { Category } from '@/models';

const emit = defineEmits(['toggle:visible', 'submit']);
const visible = defineModel('visible', { type: Boolean, default: false });
const category = defineModel<Category>({
  type: Object,
  required: true,
});

const header = computed(() => (category.value?._id ? 'Editar Categoría' : 'Agregar Categoría'));

// ToggleSwitch no acepta null, normalizamos a boolean
const isActive = computed({
  get: () => category.value.isActive ?? true,
  set: (value: boolean) => {
    category.value.isActive = value;
  },
});

function handleClickOnCancel() {
  category.value = {
    _id: null,
    name: null,
    description: null,
    isActive: true,
  };
  emit('toggle:visible');
}

function handleClickOnSave() {
  emit('submit', category.value);
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
      :style="{ width: '30rem' }"
    >
      <div class="flex flex-col gap-6">
        <div class="flex flex-col gap-1">
          <Label for="name" class="font-semibold">Nombre</Label>
          <InputText id="name" v-model="category.name" />
        </div>
        <div class="flex flex-col gap-1">
          <Label for="description" class="font-semibold">Descripción</Label>
          <Textarea auto-resize rows="4" id="description" v-model="category.description" />
        </div>
        <div class="flex items-center justify-between gap-2">
          <Label for="isActive" class="font-semibold">Activa</Label>
          <ToggleSwitch id="isActive" v-model="isActive" />
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
