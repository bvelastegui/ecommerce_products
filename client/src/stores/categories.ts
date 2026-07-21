import { ref } from 'vue';
import { defineStore } from 'pinia';
import { useAxios } from '@/composables/axios.ts';
import { isAxiosError } from 'axios';
import type { Category } from '@/models';

export const useCategoriesStore = defineStore('categories', () => {
  const { axios } = useAxios();
  const categories = ref<Category[]>([]);
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

  async function fetchCategories() {
    const defaultErrorMessage = 'Error al obtener las categorías';
    try {
      loading.value = true;
      const response = await axios.get<Category[]>('/categories');
      categories.value = response.data;
    } catch (err) {
      error.value = resolveErrorMessage(err, defaultErrorMessage);
    } finally {
      loading.value = false;
    }
  }

  async function fetchCategoryById(id: string) {
    const defaultErrorMessage = 'Error al obtener la categoría';
    try {
      loading.value = true;
      const response = await axios.get<Category>(`/categories/${id}`);
      return response.data;
    } catch (err) {
      error.value = resolveErrorMessage(err, defaultErrorMessage);
    } finally {
      loading.value = false;
    }
  }

  async function deleteCategory(id: string) {
    const defaultErrorMessage = 'Error al eliminar la categoría';
    try {
      loading.value = true;
      await axios.delete(`/categories/${id}`);
      categories.value = categories.value.filter((category) => category._id !== id);
    } catch (err) {
      error.value = resolveErrorMessage(err, defaultErrorMessage);
    } finally {
      loading.value = false;
    }
  }

  async function createCategory(category: Category) {
    const defaultErrorMessage = 'Error al crear la categoría';
    try {
      loading.value = true;
      const newCategory = await axios.post('/categories', category);
      categories.value.push(newCategory.data as Category);
    } catch (err) {
      error.value = resolveErrorMessage(err, defaultErrorMessage);
    } finally {
      loading.value = false;
    }
  }

  async function updateCategory(id: string, category: Category) {
    const defaultErrorMessage = 'Error al actualizar la categoría';
    try {
      loading.value = true;
      const response = await axios.patch<Category>(`/categories/${id}`, category);
      const index = categories.value.findIndex((c) => c._id === id);
      if (index !== -1) {
        categories.value[index] = response.data;
      }
    } catch (err) {
      error.value = resolveErrorMessage(err, defaultErrorMessage);
    } finally {
      loading.value = false;
    }
  }

  return {
    categories,
    loading,
    error,
    fetchCategories,
    fetchCategoryById,
    deleteCategory,
    createCategory,
    updateCategory,
  };
});
