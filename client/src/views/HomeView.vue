<script setup lang="ts">
import PageHeader from '@/components/PageHeader.vue';
import { DataTable, Column, Tag, Skeleton, Button, SelectButton } from 'primevue';
import Chart from 'primevue/chart';
import { useDashboardStore } from '@/stores/dashboard';
import { computed, onMounted, ref, watch } from 'vue';
import Dollar from '@primeicons/vue/dollar';
import Wallet from '@primeicons/vue/wallet';
import Inbox from '@primeicons/vue/inbox';
import Users from '@primeicons/vue/users';
import Box from '@primeicons/vue/box';
import Percentage from '@primeicons/vue/percentage';
import Refresh from '@primeicons/vue/refresh';

const dashboardStore = useDashboardStore();

// Rango de fechas a consultar en el dashboard
const rangeOptions = [
  { label: 'Esta Semana', value: 'week' },
  { label: 'Este Mes', value: 'month' },
  { label: 'Este Quimestre', value: 'semester' },
  { label: 'Este Año', value: 'year' },
];
const selectedRange = ref('year');

onMounted(() => {
  dashboardStore.fetchDashboard(selectedRange.value);
});

watch(selectedRange, (range) => {
  dashboardStore.fetchDashboard(range);
});

function formatCurrency(value: number) {
  if (!value) return '$0.00';
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
}

function formatMonth(month: string) {
  const date = new Date(`${month}-01T00:00:00`);
  return date.toLocaleDateString('es-EC', { month: 'short', year: 'numeric' });
}

function formatDate(value: string) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('es-EC', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  sent: 'Enviado',
  delivered: 'Entregado',
  canceled: 'Cancelado',
};

const statusColors: Record<string, string> = {
  pending: '#f59e0b',
  paid: '#3b82f6',
  sent: '#8b5cf6',
  delivered: '#22c55e',
  canceled: '#ef4444',
};

const statusSeverities: Record<string, string> = {
  pending: 'warn',
  paid: 'info',
  sent: 'secondary',
  delivered: 'success',
  canceled: 'danger',
};

const methodLabels: Record<string, string> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transferencia',
};

const methodColors: Record<string, string> = {
  cash: '#22c55e',
  card: '#3b82f6',
  transfer: '#8b5cf6',
};

// --- Tarjetas de resumen ---
const kpiCards = computed(() => {
  const summary = dashboardStore.dashboard?.summary;
  if (!summary) return [];
  return [
    {
      label: 'Ingresos Totales',
      value: formatCurrency(summary.totalRevenue),
      icon: Dollar,
      hint: `${summary.completedSales} ventas completadas`,
    },
    {
      label: 'Ticket Promedio',
      value: formatCurrency(summary.averageOrderValue),
      icon: Wallet,
      hint: 'Por venta completada',
    },
    {
      label: 'Órdenes Totales',
      value: summary.totalOrders,
      icon: Inbox,
      hint: `${summary.pendingOrders} pendientes`,
    },
    {
      label: 'Clientes',
      value: summary.totalUsers,
      icon: Users,
      hint: 'Usuarios registrados',
    },
    {
      label: 'Productos',
      value: summary.totalProducts,
      icon: Box,
      hint: `${summary.totalCategories} categorías`,
    },
    {
      label: 'Tasa de Cancelación',
      value: `${summary.cancellationRate}%`,
      icon: Percentage,
      hint: `${summary.canceledOrders} canceladas`,
    },
  ];
});

// --- Gráfico: Ingresos por mes ---
const salesChartData = computed(() => {
  const data = dashboardStore.dashboard?.salesByMonth ?? [];
  return {
    labels: data.map((row) => formatMonth(row.month)),
    datasets: [
      {
        label: 'Ingresos',
        data: data.map((row) => row.revenue),
        backgroundColor: '#6366f1',
        borderRadius: 6,
      },
    ],
  };
});

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false } },
    y: { beginAtZero: true },
  },
};

// --- Gráfico: Órdenes por estado ---
const statusChartData = computed(() => {
  const data = dashboardStore.dashboard?.ordersByStatus ?? [];
  return {
    labels: data.map((row) => statusLabels[row.status] ?? row.status),
    datasets: [
      {
        data: data.map((row) => row.count),
        backgroundColor: data.map((row) => statusColors[row.status] ?? '#94a3b8'),
      },
    ],
  };
});

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom' } },
};

// --- Gráfico: Top productos ---
const topProductsChartData = computed(() => {
  const data = dashboardStore.dashboard?.topProducts ?? [];
  return {
    labels: data.map((row) => row.name),
    datasets: [
      {
        label: 'Unidades vendidas',
        data: data.map((row) => row.quantitySold),
        backgroundColor: '#22c55e',
        borderRadius: 6,
      },
    ],
  };
});

const horizontalBarOptions = {
  indexAxis: 'y' as const,
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: { x: { beginAtZero: true } },
};

// --- Gráfico: Pagos por método ---
const paymentsChartData = computed(() => {
  const data = dashboardStore.dashboard?.paymentsByMethod ?? [];
  return {
    labels: data.map((row) => methodLabels[row.method] ?? row.method),
    datasets: [
      {
        data: data.map((row) => row.total),
        backgroundColor: data.map((row) => methodColors[row.method] ?? '#94a3b8'),
      },
    ],
  };
});
</script>

<template>
  <PageHeader title="Inicio" />
  <div class="flex-1 p-4 flex flex-col gap-4 overflow-y-scroll">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <SelectButton
        v-model="selectedRange"
        :options="rangeOptions"
        option-label="label"
        option-value="value"
        :allow-empty="false"
      />
      <Button
        size="small"
        severity="secondary"
        :loading="dashboardStore.loading"
        @click="dashboardStore.fetchDashboard(selectedRange)"
      >
        <Refresh />
        Actualizar
      </Button>
    </div>

    <!-- Tarjetas de resumen -->
    <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      <template v-if="kpiCards.length > 0">
        <div
          v-for="card in kpiCards"
          :key="card.label"
          class="rounded-lg bg-surface-100 dark:bg-surface-800 p-4 flex flex-col gap-2"
        >
          <div class="flex items-center justify-between">
            <span class="text-sm text-surface-500 dark:text-surface-400">{{ card.label }}</span>
            <component :is="card.icon" class="w-5! h-5! text-surface-400" />
          </div>
          <span class="text-2xl font-semibold text-surface-900 dark:text-surface-0">
            {{ card.value }}
          </span>
          <span class="text-xs text-surface-400">{{ card.hint }}</span>
        </div>
      </template>
      <template v-else>
        <Skeleton v-for="n in 6" :key="n" height="6.5rem" class="rounded-lg!" />
      </template>
    </div>

    <!-- Ingresos por mes + Órdenes por estado -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <div class="xl:col-span-2 rounded-lg bg-surface-100 dark:bg-surface-800 p-4">
        <h3 class="text-sm font-semibold mb-4">Ingresos por Mes</h3>
        <div class="h-72">
          <Chart type="bar" :data="salesChartData" :options="barChartOptions" class="h-full" />
        </div>
      </div>
      <div class="rounded-lg bg-surface-100 dark:bg-surface-800 p-4">
        <h3 class="text-sm font-semibold mb-4">Órdenes por Estado</h3>
        <div class="h-72">
          <Chart
            type="doughnut"
            :data="statusChartData"
            :options="doughnutOptions"
            class="h-full"
          />
        </div>
      </div>
    </div>

    <!-- Top productos + Pagos por método -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <div class="xl:col-span-2 rounded-lg bg-surface-100 dark:bg-surface-800 p-4">
        <h3 class="text-sm font-semibold mb-4">Productos Más Vendidos</h3>
        <div class="h-80">
          <Chart
            type="bar"
            :data="topProductsChartData"
            :options="horizontalBarOptions"
            class="h-full"
          />
        </div>
      </div>
      <div class="rounded-lg bg-surface-100 dark:bg-surface-800 p-4">
        <h3 class="text-sm font-semibold mb-4">Pagos por Método</h3>
        <div class="h-80">
          <Chart
            type="doughnut"
            :data="paymentsChartData"
            :options="doughnutOptions"
            class="h-full"
          />
        </div>
      </div>
    </div>

    <!-- Órdenes recientes + Stock bajo -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <div class="rounded-lg bg-surface-100 dark:bg-surface-800 p-4">
        <h3 class="text-sm font-semibold mb-4">Órdenes Recientes</h3>
        <DataTable
          :value="dashboardStore.dashboard?.recentOrders ?? []"
          :loading="dashboardStore.loading"
        >
          <Column header="Cliente">
            <template #body="{ data }">{{ data.user?.name ?? '—' }}</template>
          </Column>
          <Column header="Total">
            <template #body="{ data }">{{ formatCurrency(data.total) }}</template>
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
            <template #body="{ data }">{{ formatDate(data.createdAt) }}</template>
          </Column>
        </DataTable>
      </div>
      <div class="rounded-lg bg-surface-100 dark:bg-surface-800 p-4">
        <h3 class="text-sm font-semibold mb-4">Stock Bajo</h3>
        <DataTable
          :value="dashboardStore.dashboard?.lowStockProducts ?? []"
          :loading="dashboardStore.loading"
        >
          <template #empty>
            <p class="text-sm text-surface-500 dark:text-surface-400 py-4 text-center">
              Todo el inventario está en niveles saludables.
            </p>
          </template>
          <Column field="name" header="Producto" />
          <Column header="Disponible">
            <template #body="{ data }">{{ data.stock - data.reservedStock }}</template>
          </Column>
          <Column field="reservedStock" header="Reservado" />
        </DataTable>
      </div>
    </div>
  </div>
</template>
