import { ref } from 'vue';
import { defineStore } from 'pinia';
import { useAxios } from '@/composables/axios.ts';
import { isAxiosError } from 'axios';
import type { Product } from '@/models';

export const useProductsStore = defineStore('products', () => {
  const { axios } = useAxios();
  const products = ref<Product[]>([]);
  const loading = ref(true);
  const error = ref<string | null>(null);

  async function fetchProducts() {
    const defaultErrorMessage = 'Error al obtener los productos';
    try {
      loading.value = true;
      const response = await axios.get<Product[]>('/products');
      products.value = response.data;
    } catch (err) {
      if (isAxiosError(err)) {
        error.value = err.response?.data.message || defaultErrorMessage;
      } else {
        error.value = defaultErrorMessage;
      }
    } finally {
      loading.value = false;
    }
  }

  async function fetchProductById(id: string) {
    const defaultErrorMessage = 'Error al obtener el producto';
    try {
      loading.value = true;
      const response = await axios.get<Product>(`/products/${id}`);
      return response.data;
    } catch (err) {
      if (isAxiosError(err)) {
        error.value = err.response?.data.message || defaultErrorMessage;
      } else {
        error.value = defaultErrorMessage;
      }
    } finally {
      loading.value = false;
    }
  }

  async function deleteProduct(id: string) {
    const defaultErrorMessage = 'Error al eliminar el producto';
    try {
      loading.value = true;
      await axios.delete(`/products/${id}`);
      products.value = products.value.filter((product) => product._id !== id);
    } catch (err) {
      if (isAxiosError(err)) {
        error.value = err.response?.data.message || defaultErrorMessage;
      } else {
        error.value = defaultErrorMessage;
      }
    } finally {
      loading.value = false;
    }
  }

  async function createProduct(product: FormData) {
    const defaultErrorMessage = 'Error al crear el producto';
    try {
      loading.value = true;
      const newProduct = await axios.post('/products', product);
      products.value.push(newProduct.data as Product);
    } catch (err) {
      if (isAxiosError(err)) {
        error.value = err.response?.data.message || defaultErrorMessage;
      } else {
        error.value = defaultErrorMessage;
      }
    } finally {
      loading.value = false;
    }
  }

  async function updateProduct(id: string, product: Product | FormData) {
    const defaultErrorMessage = 'Error al actualizar el producto';
    try {
      loading.value = true;
      const response = await axios.patch<Product>(`/products/${id}`, product);
      const index = products.value.findIndex((p) => p._id === id);
      if (index !== -1) {
        // La respuesta incluye la categoría populada que necesita la tabla
        products.value[index] = response.data;
      }
    } catch (err) {
      if (isAxiosError(err)) {
        error.value = err.response?.data.message || defaultErrorMessage;
      } else {
        error.value = defaultErrorMessage;
      }
    } finally {
      loading.value = false;
    }
  }

  return {
    products,
    loading,
    error,
    fetchProducts,
    deleteProduct,
    createProduct,
    updateProduct,
    fetchProductById,
  };
});
