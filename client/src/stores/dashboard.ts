import { ref } from 'vue';
import { defineStore } from 'pinia';
import { useAxios } from '@/composables/axios.ts';
import { isAxiosError } from 'axios';
import type { Dashboard } from '@/models';

export const useDashboardStore = defineStore('dashboard', () => {
  const { axios } = useAxios();
  const dashboard = ref<Dashboard | null>(null);
  const loading = ref(true);
  const error = ref<string | null>(null);

  async function fetchDashboard(range: string = 'year') {
    const defaultErrorMessage = 'Error al obtener el dashboard';
    try {
      loading.value = true;
      const response = await axios.get<Dashboard>('/dashboard', { params: { range } });
      dashboard.value = response.data;
    } catch (err) {
      if (isAxiosError(err)) {
        const message = err.response?.data.message;
        error.value = Array.isArray(message) ? message.join(', ') : message || defaultErrorMessage;
      } else {
        error.value = defaultErrorMessage;
      }
    } finally {
      loading.value = false;
    }
  }

  return { dashboard, loading, error, fetchDashboard };
});
