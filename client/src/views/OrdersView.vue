<script setup lang="ts">
import PageHeader from '@/components/PageHeader.vue';
import { DataTable, Column, Button, Tag, useConfirm, useToast } from 'primevue';
import { useOrdersStore } from '@/stores/orders';
import { useUsersStore } from '@/stores/users';
import { useProductsStore } from '@/stores/products';
import { onMounted, ref } from 'vue';
import OrderForm from '@/components/OrderForm.vue';
import type { Order, OrderItem, ShippingAddress } from '@/models';
import Plus from '@primeicons/vue/plus-circle';
import Box from '@primeicons/vue/box';
import ExclamationTriangle from '@primeicons/vue/exclamation-triangle';

const toast = useToast();
const confirm = useConfirm();
const ordersStore = useOrdersStore();
const usersStore = useUsersStore();
const productsStore = useProductsStore();
const showModal = ref(false);

const currentOrder = ref<Order>({
  _id: null,
  user: null,
  items: [],
  shippingAddress: { street: null, city: null, zipCode: null },
  status: 'pending',
});

onMounted(() => {
  ordersStore.fetchOrders();
  usersStore.fetchUsers();
  productsStore.fetchProducts();
});

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

function formatCurrency(value: number) {
  if (!value) return '$0.00';
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

function formatDate(value: string) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('es-EC', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// user e items[].product pueden venir populados (objetos) o como string
function extractId(value: unknown): string | null {
  if (value && typeof value === 'object') {
    return (value as { _id?: string })._id ?? null;
  }
  return (value as string) ?? null;
}

function handleClickOnAdd() {
  currentOrder.value = {
    _id: null,
    user: null,
    items: [],
    shippingAddress: { street: null, city: null, zipCode: null },
    status: 'pending',
  };
  showModal.value = true;
}

function handleDelete(id: string) {
  confirm.require({
    message: '¿Seguro que deseas eliminar esta venta?',
    header: 'Eliminar Venta',
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
      await ordersStore.deleteOrder(id);
      toast.add({
        severity: 'success',
        summary: 'Venta Eliminada',
        detail: 'La venta ha sido eliminada correctamente.',
      });
      await ordersStore.fetchOrders();
    },
    reject: () => {
      console.log('Rejected');
    },
  });
}

async function handleEdit(id: string) {
  const order = await ordersStore.fetchOrderById(id);
  if (order) {
    currentOrder.value = {
      ...order,
      // El formulario trabaja solo con los ids (user e items.product vienen populados)
      user: extractId(order.user),
      items: (order.items ?? []).map((item) => ({
        product: extractId(item.product),
        quantity: item.quantity,
      })),
      shippingAddress: order.shippingAddress ?? {
        street: null,
        city: null,
        zipCode: null,
      },
    };
  }
  showModal.value = true;
}

async function handleSubmitOnOrderForm({
  orderData,
  newAddress,
}: {
  orderData: Order;
  newAddress: ShippingAddress | null;
}) {
  // Si se ingresó una nueva dirección, primero la agregamos al cliente seleccionado
  if (newAddress && orderData.user) {
    const saved = await saveNewAddressToUser(orderData.user, newAddress);
    if (!saved) return; // No guardamos la venta si falló el registro de la dirección
  }

  // La dirección solo se envía si tiene algún campo lleno
  const address = orderData.shippingAddress ?? newAddress;
  const hasAddress = !!(address?.street || address?.city || address?.zipCode);

  // El servidor toma nombre y precio actuales de cada producto y calcula los totales
  const payload: Partial<Order> = {
    user: orderData.user,
    items: (orderData.items ?? [])
      .filter((item) => item.product && item.quantity)
      .map((item) => ({ product: item.product, quantity: item.quantity })),
    shippingAddress: hasAddress
      ? {
          street: address?.street ?? null,
          city: address?.city ?? null,
          zipCode: address?.zipCode ?? null,
        }
      : undefined,
  };

  // El estado solo se envía al editar (al crear siempre inicia en pendiente)
  if (orderData._id && orderData.status) {
    payload.status = orderData.status;
  }

  if (orderData._id) {
    await ordersStore.updateOrder(orderData._id, payload);
  } else {
    await ordersStore.createOrder(payload);
  }

  if (!ordersStore.error) {
    toast.add({
      severity: 'success',
      summary: 'Venta Guardada',
      detail: 'La venta ha sido guardada correctamente.',
    });
    showModal.value = false;
  } else {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: ordersStore.error,
    });
    ordersStore.error = null;
  }

  await ordersStore.fetchOrders();
}

// Agrega la nueva dirección al documento del cliente (users.addresses).
// Si es su primera dirección, queda marcada como principal.
async function saveNewAddressToUser(userId: string, newAddress: ShippingAddress): Promise<boolean> {
  const user = usersStore.users.find((u) => u._id === userId);
  const isFirstAddress = !user?.addresses?.length;

  // El backend reemplaza el arreglo completo: enviamos las existentes
  // (sin el _id del subdocumento, que el ValidationPipe rechaza) más la nueva
  const addresses = [
    ...(user?.addresses ?? []).map((a) => ({
      street: a.street,
      city: a.city,
      zipCode: a.zipCode,
      isDefault: a.isDefault ?? false,
    })),
    {
      street: newAddress.street,
      city: newAddress.city,
      zipCode: newAddress.zipCode,
      isDefault: isFirstAddress,
    },
  ];

  await usersStore.updateUser(userId, { addresses });

  if (usersStore.error) {
    toast.add({
      severity: 'error',
      summary: 'Error al guardar la dirección',
      detail: usersStore.error,
    });
    usersStore.error = null;
    return false;
  }
  return true;
}
</script>

<template>
  <PageHeader title="Ventas" />
  <OrderForm
    v-model:visible="showModal"
    v-model="currentOrder"
    @toggle:visible="showModal = !showModal"
    @submit="handleSubmitOnOrderForm"
  />
  <div class="flex-1 p-4 flex flex-col gap-4">
    <div class="flex rounded-lg bg-surface-100 dark:bg-surface-800 p-2">
      <Button class="ml-auto" @click="handleClickOnAdd">
        <Plus />
        Agregar Venta
      </Button>
    </div>
    <div class="rounded-t-lg bg-surface-100 dark:bg-surface-800 p-1">
      <DataTable paginator :rows="10" :value="ordersStore.orders" :loading="ordersStore.loading">
        <template #empty>
          <div class="flex flex-col items-center justify-center gap-3 py-10 text-center">
            <div
              class="w-14 h-14 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center"
            >
              <Box class="w-6! h-6! text-surface-400 dark:text-surface-500" />
            </div>
            <div>
              <p class="m-0 font-semibold text-surface-900 dark:text-surface-0">
                No existen ventas
              </p>
              <p class="mt-1 text-sm text-surface-500 dark:text-surface-400">
                Agrega tu primera venta para comenzar
              </p>
            </div>
            <Button size="small" @click="handleClickOnAdd">
              <Plus />
              Agregar venta
            </Button>
          </div>
        </template>

        <Column header="Orden" header-class="rounded-tl-lg">
          <template #body="{ data }"> #{{ data._id?.slice(-6) }} </template>
        </Column>
        <Column header="Cliente">
          <template #body="{ data }">
            {{ data.user?.name ?? '—' }}
          </template>
        </Column>
        <Column header="Items">
          <template #body="{ data }">
            {{
              data.items?.reduce((sum: number, item: OrderItem) => sum + (item.quantity ?? 0), 0) ||
              0
            }}
          </template>
        </Column>
        <Column header="Total">
          <template #body="{ data }">
            {{ formatCurrency(data.total) }}
          </template>
        </Column>
        <Column header="Estado">
          <template #body="{ data }">
            <Tag
              :value="statusLabels[data.status] ?? data.status"
              :severity="statusSeverities[data.status] ?? 'info'"
            />
          </template>
        </Column>
        <Column header="Fecha">
          <template #body="{ data }">
            {{ formatDate(data.createdAt) }}
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
