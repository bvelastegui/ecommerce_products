import { ref } from 'vue';
import { defineStore } from 'pinia';
import { useAxios } from '@/composables/axios.ts';
import { isAxiosError } from 'axios';
import type { Payment } from '@/models';

export const usePaymentsStore = defineStore('payments', () => {
  const { axios } = useAxios();
  const payments = ref<Payment[]>([]);
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

  async function fetchPayments() {
    const defaultErrorMessage = 'Error al obtener los pagos';
    try {
      loading.value = true;
      const response = await axios.get<Payment[]>('/payments');
      payments.value = response.data;
    } catch (err) {
      error.value = resolveErrorMessage(err, defaultErrorMessage);
    } finally {
      loading.value = false;
    }
  }

  async function deletePayment(id: string) {
    const defaultErrorMessage = 'Error al eliminar el pago';
    try {
      loading.value = true;
      await axios.delete(`/payments/${id}`);
      payments.value = payments.value.filter((payment) => payment._id !== id);
    } catch (err) {
      error.value = resolveErrorMessage(err, defaultErrorMessage);
    } finally {
      loading.value = false;
    }
  }

  async function createPayment(payment: Partial<Payment>) {
    const defaultErrorMessage = 'Error al registrar el pago';
    try {
      loading.value = true;
      const newPayment = await axios.post('/payments', payment);
      const created = newPayment.data as Payment;
      payments.value.unshift(created);
      return created;
    } catch (err) {
      error.value = resolveErrorMessage(err, defaultErrorMessage);
    } finally {
      loading.value = false;
    }
  }

  return {
    payments,
    loading,
    error,
    fetchPayments,
    deletePayment,
    createPayment,
  };
});
