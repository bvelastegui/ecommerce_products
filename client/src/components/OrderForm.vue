<script setup lang="ts">
import { Dialog, Label, Button, Select, InputNumber, InputText, Tag } from 'primevue';
import { computed, ref, watch } from 'vue';
import { useUsersStore } from '@/stores/users';
import { useProductsStore } from '@/stores/products';
import type { Address, Order } from '@/models';
import Plus from '@primeicons/vue/plus';
import Minus from '@primeicons/vue/minus';
import Trash from '@primeicons/vue/trash';

const emit = defineEmits(['toggle:visible', 'submit']);
const visible = defineModel('visible', { type: Boolean, default: false });
const order = defineModel<Order>({
  type: Object,
  required: true,
});

// Los usuarios y productos los carga la vista (OrdersView)
const usersStore = useUsersStore();
const productsStore = useProductsStore();

const statusOptions = [
  { label: 'Pendiente', value: 'pending' },
  { label: 'Pagado', value: 'paid' },
  { label: 'Enviado', value: 'sent' },
  { label: 'Entregado', value: 'delivered' },
  { label: 'Cancelado', value: 'canceled' },
];

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  sent: 'Enviado',
  delivered: 'Entregado',
  canceled: 'Cancelado',
};

const statusSeverities: Record<string, string> = {
  pending: 'warn',
  paid: 'info',
  sent: 'secondary',
  delivered: 'success',
  canceled: 'danger',
};

// Máquina de estados (espejo del backend)
const ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['paid', 'canceled'],
  paid: ['sent'],
  sent: ['delivered'],
  delivered: [],
  canceled: [],
};

// Estado destino elegido en el select (null = sin cambio)
const newStatus = ref<string | null>(null);

// Solo se ofrecen las transiciones válidas desde el estado actual
const allowedStatusOptions = computed(() => {
  const current = order.value.status ?? 'pending';
  const allowed = ORDER_STATUS_TRANSITIONS[current] ?? [];
  return statusOptions.filter((option) => allowed.includes(option.value));
});

// Los items solo se pueden modificar mientras la orden está pendiente
const itemsLocked = computed(() => (order.value.status ?? 'pending') !== 'pending');

// --- Nueva dirección: se guarda en el cliente al confirmar la venta ---
const isAddingNewAddress = ref(false);
const newAddress = ref<Address>({
  street: null,
  city: null,
  zipCode: null,
  isDefault: false,
});
const newAddressError = ref<string | null>(null);
const isEditing = computed(() => !!order.value?._id);
const header = computed(() => (isEditing.value ? 'Editar Venta' : 'Agregar Venta'));

// --- Dirección de envío: se elige entre las registradas en users.addresses ---
const selectedAddressIndex = ref<number | null>(null);

// Direcciones del cliente actualmente seleccionado
const userAddresses = computed(
  () => usersStore.users.find((u) => u._id === order.value.user)?.addresses ?? [],
);

const addressOptions = computed(() =>
  userAddresses.value.map((address, index) => ({
    label: `${address.street}, ${address.city} (${address.zipCode})${address.isDefault ? ' — Principal' : ''}`,
    value: index,
  })),
);

// Al cargar una orden para editar, preseleccionamos la dirección guardada
// si todavía coincide con alguna de las registradas por el cliente
watch(
  () => order.value,
  (newOrder) => {
    const addresses = usersStore.users.find((u) => u._id === newOrder.user)?.addresses ?? [];
    const saved = newOrder.shippingAddress;
    const index = saved?.street
      ? addresses.findIndex(
          (a) => a.street === saved.street && a.city === saved.city && a.zipCode === saved.zipCode,
        )
      : -1;
    selectedAddressIndex.value = index >= 0 ? index : null;
    // Reseteamos el modo "nueva dirección" y el cambio de estado al cargar otra orden
    isAddingNewAddress.value = false;
    newAddress.value = emptyNewAddress();
    newAddressError.value = null;
    newStatus.value = null;
  },
  { immediate: true },
);

// Al cambiar de cliente se preselecciona su dirección principal (si tiene)
function handleUserChange() {
  const defaultIndex = userAddresses.value.findIndex((a) => a.isDefault);
  selectedAddressIndex.value = defaultIndex >= 0 ? defaultIndex : null;
}

function emptyNewAddress(): Address {
  return { street: null, city: null, zipCode: null, isDefault: false };
}

function handleStartNewAddress() {
  selectedAddressIndex.value = null;
  newAddressError.value = null;
  isAddingNewAddress.value = true;
}

function handleCancelNewAddress() {
  isAddingNewAddress.value = false;
  newAddress.value = emptyNewAddress();
  newAddressError.value = null;
  // Volvemos a preseleccionar la dirección principal del cliente
  handleUserChange();
}

function emptyOrder(): Order {
  return {
    _id: null,
    user: null,
    items: [],
    shippingAddress: { street: null, city: null, zipCode: null },
    status: 'pending',
  };
}

function handleAddItem() {
  if (!order.value.items) order.value.items = [];
  order.value.items.push({ product: null, quantity: 1 });
}

function handleRemoveItem(index: number) {
  order.value.items?.splice(index, 1);
}

// Precio actual de un producto según el catálogo cargado
function getProductPrice(productId: string | null | undefined): number {
  if (!productId) return 0;
  return productsStore.products.find((p) => p._id === productId)?.basePrice ?? 0;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

// Totales estimados en vivo (el servidor los recalcula al guardar)
const TAX_RATE = 0.15;
const subTotal = computed(() =>
  (order.value.items ?? []).reduce(
    (sum, item) => sum + getProductPrice(item.product) * (item.quantity ?? 0),
    0,
  ),
);
const tax = computed(() => subTotal.value * TAX_RATE);
const total = computed(() => subTotal.value + tax.value);

function handleClickOnCancel() {
  selectedAddressIndex.value = null;
  isAddingNewAddress.value = false;
  newAddress.value = emptyNewAddress();
  newAddressError.value = null;
  order.value = emptyOrder();
  emit('toggle:visible');
}

function handleClickOnSave() {
  // Aplicamos el cambio de estado elegido (si hay uno)
  if (newStatus.value) {
    order.value.status = newStatus.value;
  }

  // Modo nueva dirección: validamos y la enviamos junto a la venta
  // (la vista la agregará al cliente antes de guardar la orden)
  if (isAddingNewAddress.value) {
    const { street, city, zipCode } = newAddress.value;
    if (!street || !city || !zipCode) {
      newAddressError.value = 'Completa calle, ciudad y código postal.';
      return;
    }
    order.value.shippingAddress = { street, city, zipCode };
    emit('submit', { orderData: order.value, newAddress: newAddress.value });
    return;
  }

  // Modo dirección existente: la orden guarda una copia (snapshot) de la elegida
  const selected =
    selectedAddressIndex.value !== null ? userAddresses.value[selectedAddressIndex.value] : null;
  order.value.shippingAddress = selected
    ? { street: selected.street, city: selected.city, zipCode: selected.zipCode }
    : { street: null, city: null, zipCode: null };
  emit('submit', { orderData: order.value, newAddress: null });
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
      :style="{ width: '85%' }"
    >
      <div class="flex flex-col gap-6">
        <div class="flex flex-col gap-1">
          <Label for="user" class="font-semibold">Cliente</Label>
          <Select
            id="user"
            v-model="order.user"
            :options="usersStore.users"
            option-label="name"
            option-value="_id"
            placeholder="Selecciona un cliente"
            :loading="usersStore.loading"
            filter
            @change="handleUserChange"
          />
        </div>

        <div class="flex flex-col gap-3">
          <Label class="font-semibold">Items de la venta</Label>
          <div v-for="(item, index) in order.items" :key="index" class="flex items-center gap-4">
            <Select
              v-model="item.product"
              :options="productsStore.products"
              option-label="name"
              option-value="_id"
              placeholder="Producto"
              :loading="productsStore.loading"
              :disabled="itemsLocked"
              filter
              class="flex-1"
            >
              <template #option="{ option }">
                <div class="flex items-center justify-between gap-4 w-full">
                  <span>{{ option.name }}</span>
                  <span class="text-sm text-surface-400">
                    disp: {{ (option.stock ?? 0) - (option.reservedStock ?? 0) }}
                  </span>
                </div>
              </template>
            </Select>
            <InputNumber
              v-model="item.quantity"
              :min="1"
              show-buttons
              button-layout="horizontal"
              :step="1"
              :disabled="itemsLocked"
            >
              <template #incrementicon>
                <Plus />
              </template>
              <template #decrementicon>
                <Minus />
              </template>
            </InputNumber>
            <span class="text-right text-sm text-surface-500">
              {{ formatCurrency(getProductPrice(item.product) * (item.quantity ?? 0)) }}
            </span>
            <Button
              size="small"
              severity="danger"
              text
              :disabled="itemsLocked"
              @click="handleRemoveItem(index)"
            >
              <Trash />
            </Button>
          </div>
          <Button severity="secondary" size="small" :disabled="itemsLocked" @click="handleAddItem">
            <Plus />
            Agregar item
          </Button>
          <small v-if="itemsLocked" class="text-surface-500 dark:text-surface-400">
            Los items solo se pueden modificar mientras la orden está pendiente.
          </small>
        </div>

        <div class="flex flex-col gap-2 rounded-lg bg-surface-100 dark:bg-surface-900 p-3">
          <div class="flex justify-between text-sm">
            <span class="text-surface-500">Subtotal</span>
            <span>{{ formatCurrency(subTotal) }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-surface-500">IVA (15%)</span>
            <span>{{ formatCurrency(tax) }}</span>
          </div>
          <div class="flex justify-between font-semibold">
            <span>Total</span>
            <span>{{ formatCurrency(total) }}</span>
          </div>
        </div>

        <div class="flex flex-col gap-1">
          <Label for="shippingAddress" class="font-semibold">Dirección de envío</Label>
          <div class="flex items-center gap-2">
            <Select
              id="shippingAddress"
              v-model="selectedAddressIndex"
              :options="addressOptions"
              option-label="label"
              option-value="value"
              :placeholder="
                order.user ? 'Selecciona una dirección' : 'Primero selecciona un cliente'
              "
              :disabled="!order.user || addressOptions.length === 0 || isAddingNewAddress"
              show-clear
              class="flex-1"
            />
            <Button
              v-if="isAddingNewAddress"
              severity="warn"
              variant="outlined"
              @click="handleCancelNewAddress"
              >Dejar de añadir nueva dirección</Button
            >
            <Button v-else variant="outlined" @click="handleStartNewAddress"
              >Añadir Dirección de envío</Button
            >
          </div>
          <small
            v-if="order.user && addressOptions.length === 0"
            class="text-surface-500 dark:text-surface-400"
          >
            Este cliente no tiene direcciones registradas.
          </small>
        </div>

        <div v-if="isAddingNewAddress" class="flex flex-col gap-3">
          <Label class="font-semibold">Dirección de envío (opcional)</Label>
          <InputText v-model="newAddress!.street" placeholder="Calle" />
          <div class="flex gap-2">
            <InputText v-model="newAddress!.city" placeholder="Ciudad" class="flex-1" />
            <InputText v-model="newAddress!.zipCode" placeholder="Código postal" class="w-32" />
          </div>
          <small v-if="newAddressError" class="text-red-500">
            {{ newAddressError }}
          </small>
        </div>

        <div v-if="isEditing" class="flex flex-col gap-2">
          <Label for="status" class="font-semibold">Estado</Label>
          <div class="flex items-center gap-2">
            <Tag
              :value="statusLabels[order.status ?? 'pending'] ?? order.status"
              :severity="statusSeverities[order.status ?? 'pending'] ?? 'info'"
            />
            <template v-if="allowedStatusOptions.length > 0">
              <span class="text-surface-400">→</span>
              <Select
                id="status"
                v-model="newStatus"
                :options="allowedStatusOptions"
                option-label="label"
                option-value="value"
                placeholder="Cambiar a..."
                class="flex-1"
              />
            </template>
          </div>
          <small
            v-if="allowedStatusOptions.length === 0"
            class="text-surface-500 dark:text-surface-400"
          >
            La orden está en un estado final y ya no puede cambiar.
          </small>
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
