import { ref } from 'vue';
import { defineStore } from 'pinia';
import { useAxios } from '@/composables/axios.ts';
import { isAxiosError } from 'axios';
import type { User } from '@/models';

export const useUsersStore = defineStore('users', () => {
  const { axios } = useAxios();
  const users = ref<User[]>([]);
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

  async function fetchUsers() {
    const defaultErrorMessage = 'Error al obtener los usuarios';
    try {
      loading.value = true;
      const response = await axios.get<User[]>('/users');
      users.value = response.data;
    } catch (err) {
      error.value = resolveErrorMessage(err, defaultErrorMessage);
    } finally {
      loading.value = false;
    }
  }

  async function fetchUserById(id: string) {
    const defaultErrorMessage = 'Error al obtener el usuario';
    try {
      loading.value = true;
      const response = await axios.get<User>(`/users/${id}`);
      return response.data;
    } catch (err) {
      error.value = resolveErrorMessage(err, defaultErrorMessage);
    } finally {
      loading.value = false;
    }
  }

  async function deleteUser(id: string) {
    const defaultErrorMessage = 'Error al eliminar el usuario';
    try {
      loading.value = true;
      await axios.delete(`/users/${id}`);
      users.value = users.value.filter((user) => user._id !== id);
    } catch (err) {
      error.value = resolveErrorMessage(err, defaultErrorMessage);
    } finally {
      loading.value = false;
    }
  }

  async function createUser(user: Partial<User>) {
    const defaultErrorMessage = 'Error al crear el usuario';
    try {
      loading.value = true;
      const newUser = await axios.post('/users', user);
      users.value.push(newUser.data as User);
    } catch (err) {
      error.value = resolveErrorMessage(err, defaultErrorMessage);
    } finally {
      loading.value = false;
    }
  }

  async function updateUser(id: string, user: Partial<User>) {
    const defaultErrorMessage = 'Error al actualizar el usuario';
    try {
      loading.value = true;
      const response = await axios.patch<User>(`/users/${id}`, user);
      const index = users.value.findIndex((u) => u._id === id);
      if (index !== -1) {
        users.value[index] = response.data;
      }
    } catch (err) {
      error.value = resolveErrorMessage(err, defaultErrorMessage);
    } finally {
      loading.value = false;
    }
  }

  return {
    users,
    loading,
    error,
    fetchUsers,
    fetchUserById,
    deleteUser,
    createUser,
    updateUser,
  };
});
