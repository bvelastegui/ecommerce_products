<script setup lang="ts">
import PageHeader from '@/components/PageHeader.vue';
import { DataTable, Column, Button, Tag, useConfirm, useToast } from 'primevue';
import { usePaymentsStore } from '@/stores/payments';
import { useOrdersStore } from '@/stores/orders';
import { onMounted, ref } from 'vue';
import PaymentForm from '@/components/PaymentForm.vue';
import type { Payment } from '@/models';
import Plus from '@primeicons/vue/plus-circle';
import Box from '@primeicons/vue/box';
import ExclamationTriangle from '@primeicons/vue/exclamation-triangle';

const toast = useToast();
const confirm = useConfirm();
const paymentsStore = usePaymentsStore();
const ordersStore = useOrdersStore();
const showModal = ref(false);

const currentPayment = ref<Payment>({
  order: null,
  method: 'card',
  simulateFailure: false,
});

onMounted(() => {
  paymentsStore.fetchPayments();
  ordersStore.fetchOrders();
});

const methodLabels: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
};

const methodSeverities: Record<string, string> = {
  cash: 'success',
  card: 'info',
  transfer: 'secondary',
};

function formatCurrency(value: number) {
  if (!value) return '$0.00';
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

function formatDate(value: string) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('es-EC', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function handleClickOnAdd() {
  currentPayment.value = {
    order: null,
    method: 'card',
    simulateFailure: false,
  };
  showModal.value = true;
}

function handleDelete(id: string) {
  confirm.require({
    message: '¿Seguro que deseas eliminar este pago?',
    header: 'Eliminar Pago',
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
      await paymentsStore.deletePayment(id);
      toast.add({
        severity: 'success',
        summary: 'Pago Eliminado',
        detail: 'El pago ha sido eliminado correctamente.',
      });
    },
    reject: () => {
      console.log('Rejected');
    },
  });
}

async function handleSubmitOnPaymentForm(paymentData: Payment) {
  const created = await paymentsStore.createPayment({
    order: paymentData.order,
    method: paymentData.method,
    simulateFailure: paymentData.simulateFailure ?? false,
  });

  if (!paymentsStore.error && created) {
    // La orden cambió de estado (o quedó con intento fallido): refrescamos
    await ordersStore.fetchOrders();
    showModal.value = false;
    if (created.status === 'failed') {
      toast.add({
        severity: 'warn',
        summary: 'Pago Rechazado',
        detail: 'El pago fue rechazado (simulación). La orden sigue pendiente.',
      });
    } else {
      toast.add({
        severity: 'success',
        summary: 'Pago Registrado',
        detail: 'El pago se completó y la orden pasó a estado Pagado.',
      });
    }
  } else if (paymentsStore.error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: paymentsStore.error,
    });
    paymentsStore.error = null;
  }
}
</script>

<template>
  <PageHeader title="Pagos" />
  <PaymentForm
    v-model:visible="showModal"
    v-model="currentPayment"
    @toggle:visible="showModal = !showModal"
    @submit="handleSubmitOnPaymentForm"
  />
  <div class="flex-1 p-4 flex flex-col gap-4">
    <div class="flex rounded-lg bg-surface-100 dark:bg-surface-800 p-4">
      <Button class="ml-auto" @click="handleClickOnAdd">
        <Plus />
        Registrar Pago
      </Button>
    </div>
    <div class="rounded-lg bg-surface-100 dark:bg-surface-800 p-4">
      <DataTable :value="paymentsStore.payments" :loading="paymentsStore.loading">
        <template #empty>
          <div class="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <div
              class="w-14 h-14 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center"
            >
              <Box class="w-6! h-6! text-surface-400 dark:text-surface-500" />
            </div>
            <div>
              <p class="m-0 font-semibold text-surface-900 dark:text-surface-0">No existen pagos</p>
              <p class="mt-1 text-sm text-surface-500 dark:text-surface-400">
                Registra el primer pago de una orden pendiente
              </p>
            </div>
            <Button size="small" @click="handleClickOnAdd">
              <Plus />
              Registrar pago
            </Button>
          </div>
        </template>

        <Column header="Transacción" header-class="rounded-tl-lg">
          <template #body="{ data }">
            <span class="font-mono text-sm">{{ data.transactionId ?? '—' }}</span>
          </template>
        </Column>
        <Column header="Orden">
          <template #body="{ data }"> #{{ data.order?._id?.slice(-6) ?? '—' }} </template>
        </Column>
        <Column header="Cliente">
          <template #body="{ data }">
            {{ data.order?.user?.name ?? '—' }}
          </template>
        </Column>
        <Column header="Monto">
          <template #body="{ data }">
            {{ formatCurrency(data.amount) }}
          </template>
        </Column>
        <Column header="Método">
          <template #body="{ data }">
            <Tag
              :value="methodLabels[data.method] ?? data.method"
              :severity="methodSeverities[data.method] ?? 'info'"
            />
          </template>
        </Column>
        <Column header="Estado">
          <template #body="{ data }">
            <Tag
              :value="data.status === 'completed' ? 'Completado' : 'Fallido'"
              :severity="data.status === 'completed' ? 'success' : 'danger'"
            />
          </template>
        </Column>
        <Column header="Fecha">
          <template #body="{ data }">
            {{ formatDate(data.paidAt ?? data.createdAt) }}
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
            </div>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>
