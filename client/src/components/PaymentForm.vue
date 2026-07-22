<script setup lang="ts">
import { Dialog, Label, Button, Select, ToggleSwitch, Message } from 'primevue';
import { computed } from 'vue';
import { useOrdersStore } from '@/stores/orders';
import { usePaymentsStore } from '@/stores/payments';
import type { Payment } from '@/models';

const emit = defineEmits(['toggle:visible', 'submit']);
const visible = defineModel('visible', { type: Boolean, default: false });
const payment = defineModel<Payment>({
  type: Object,
  required: true,
});

// Las órdenes y los pagos los carga la vista (PaymentsView)
const ordersStore = useOrdersStore();
const paymentsStore = usePaymentsStore();

const methodOptions = [
  { label: 'Efectivo', value: 'cash' },
  { label: 'Tarjeta', value: 'card' },
  { label: 'Transferencia', value: 'transfer' },
];

const header = computed(() => 'Registrar Pago');

// order puede venir populado (objeto) o como string
function extractOrderId(order: unknown): string | null {
  if (order && typeof order === 'object') {
    return (order as { _id?: string })._id ?? null;
  }
  return (order as string) ?? null;
}

// Solo se pueden pagar órdenes pendientes que no tengan ya un pago completado
const payableOrders = computed(() =>
  ordersStore.orders.filter(
    (order) =>
      order.status === 'pending' &&
      !paymentsStore.payments.some(
        (p) => p.status === 'completed' && extractOrderId(p.order) === order._id,
      ),
  ),
);

const orderOptions = computed(() =>
  payableOrders.value.map((order) => ({
    label: `#${order._id?.slice(-6)} — ${(order.user as unknown as { name?: string })?.name ?? 'Cliente'} — ${formatCurrency(order.total ?? 0)}`,
    value: order._id,
  })),
);

// Monto a pagar: el total de la orden seleccionada
const selectedOrderTotal = computed(() => {
  const order = payableOrders.value.find((o) => o._id === payment.value.order);
  return order?.total ?? 0;
});

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

// ToggleSwitch no acepta null, normalizamos a boolean
const simulateFailure = computed({
  get: () => payment.value.simulateFailure ?? false,
  set: (value: boolean) => {
    payment.value.simulateFailure = value;
  },
});

function handleClickOnCancel() {
  payment.value = {
    order: null,
    method: 'card',
    simulateFailure: false,
  };
  emit('toggle:visible');
}

function handleClickOnSave() {
  emit('submit', payment.value);
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
          <Label for="order" class="font-semibold">Orden</Label>
          <Select
            id="order"
            v-model="payment.order"
            :options="orderOptions"
            option-label="label"
            option-value="value"
            placeholder="Selecciona una orden pendiente"
            :loading="ordersStore.loading"
            filter
          />
          <small
            v-if="orderOptions.length === 0 && !ordersStore.loading"
            class="text-surface-500 dark:text-surface-400"
          >
            No hay órdenes pendientes de pago.
          </small>
        </div>
        <div class="flex flex-col gap-1">
          <Label for="method" class="font-semibold">Método de pago</Label>
          <Select
            id="method"
            v-model="payment.method"
            :options="methodOptions"
            option-label="label"
            option-value="value"
            placeholder="Selecciona un método"
          />
        </div>
        <div class="flex justify-between items-center rounded-lg bg-surface-100 dark:bg-surface-900 p-3">
          <span class="text-sm text-surface-500">Monto a pagar</span>
          <span class="font-semibold">{{ formatCurrency(selectedOrderTotal) }}</span>
        </div>
        <div class="flex items-center justify-between gap-2">
          <Label for="simulateFailure" class="font-semibold">
            Simular pago rechazado
          </Label>
          <ToggleSwitch id="simulateFailure" v-model="simulateFailure" />
        </div>
        <Message severity="info" :closable="false">
          Si el pago es exitoso, la orden pasará a estado Pagado y se descontará el
          stock reservado.
        </Message>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2 mt-4 pt-4">
          <Button severity="secondary" @click="handleClickOnCancel">Cancelar</Button>
          <Button :disabled="!payment.order || !payment.method" @click="handleClickOnSave">
            Registrar Pago
          </Button>
        </div>
      </template>
    </Dialog>
  </div>
</template>

<style scoped></style>
