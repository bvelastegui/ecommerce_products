import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { useAxios } from '@/composables/axios.ts';
import { isAxiosError } from 'axios';

interface AuthUser {
  name: string;
  email: string;
  role: string;
}

export const useAuthStore = defineStore('auth', () => {
  const { axios } = useAxios();
  const token = ref<string | null>(localStorage.getItem('token'));
  const user = ref<AuthUser | null>(
    JSON.parse(localStorage.getItem('user') || 'null') as AuthUser | null,
  );
  const loading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => !!token.value);

  async function login(email: string, password: string): Promise<boolean> {
    const defaultErrorMessage = 'Error al iniciar sesión';
    try {
      loading.value = true;
      error.value = null;
      const response = await axios.post('/auth/login', { email, password });
      token.value = response.data.access_token;
      user.value = response.data.user as AuthUser;
      localStorage.setItem('token', token.value as string);
      localStorage.setItem('user', JSON.stringify(user.value));
      return true;
    } catch (err) {
      if (isAxiosError(err)) {
        const message = err.response?.data.message;
        error.value = Array.isArray(message)
          ? message.join(', ')
          : message || defaultErrorMessage;
      } else {
        error.value = defaultErrorMessage;
      }
      return false;
    } finally {
      loading.value = false;
    }
  }

  function logout() {
    token.value = null;
    user.value = null;
    error.value = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  return { token, user, loading, error, isAuthenticated, login, logout };
});
