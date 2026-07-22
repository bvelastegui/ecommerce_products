import { ref } from 'vue';
import { defineStore } from 'pinia';
import { useAxios } from '@/composables/axios.ts';
import { isAxiosError } from 'axios';
import type { Order } from '@/models';

export const useOrdersStore = defineStore('orders', () => {
  const { axios } = useAxios();
  const orders = ref<Order[]>([]);
  const loading = ref(true);
  const error = ref<string | null>(null);

  // El backend puede devolver message como array (errores del ValidationPipe)
  function resolveErrorMessage(err: unknown, defaultErrorMessage: string) {
    if (isAxiosError(err)) {
      const message = err.response?.data.message;
      return Array.isArray(message) ? message.join(', ') : message || defaultErrorMessage;
    }
    return defaultErrorMessage;
  }

  async function fetchOrders() {
    const defaultErrorMessage = 'Error al obtener las ventas';
    try {
      loading.value = true;
      const response = await axios.get<Order[]>('/orders');
      orders.value = response.data;
    } catch (err) {
      error.value = resolveErrorMessage(err, defaultErrorMessage);
    } finally {
      loading.value = false;
    }
  }

  async function fetchOrderById(id: string) {
    const defaultErrorMessage = 'Error al obtener la venta';
    try {
      loading.value = true;
      const response = await axios.get<Order>(`/orders/${id}`);
      return response.data;
    } catch (err) {
      error.value = resolveErrorMessage(err, defaultErrorMessage);
    } finally {
      loading.value = false;
    }
  }

  async function deleteOrder(id: string) {
    const defaultErrorMessage = 'Error al eliminar la venta';
    try {
      loading.value = true;
      await axios.delete(`/orders/${id}`);
      orders.value = orders.value.filter((order) => order._id !== id);
    } catch (err) {
      error.value = resolveErrorMessage(err, defaultErrorMessage);
    } finally {
      loading.value = false;
    }
  }

  async function createOrder(order: Partial<Order>) {
    console.log(order);
    const defaultErrorMessage = 'Error al crear la venta';
    try {
      loading.value = true;
      const newOrder = await axios.post('/orders', order);
      orders.value.unshift(newOrder.data as Order);
    } catch (err) {
      error.value = resolveErrorMessage(err, defaultErrorMessage);
    } finally {
      loading.value = false;
    }
  }

  async function updateOrder(id: string, order: Partial<Order>) {
    const defaultErrorMessage = 'Error al actualizar la venta';
    try {
      loading.value = true;
      const response = await axios.patch<Order>(`/orders/${id}`, order);
      const index = orders.value.findIndex((o) => o._id === id);
      if (index !== -1) {
        orders.value[index] = response.data;
      }
    } catch (err) {
      error.value = resolveErrorMessage(err, defaultErrorMessage);
    } finally {
      loading.value = false;
    }
  }

  return {
    orders,
    loading,
    error,
    fetchOrders,
    fetchOrderById,
    deleteOrder,
    createOrder,
    updateOrder,
  };
});
