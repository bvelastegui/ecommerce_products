import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      name: 'Home',
      component: () => import('../views/HomeView.vue'),
    },
    {
      path: '/products',
      name: 'Products',
      component: () => import('../views/ProductsView.vue'),
    },
    {
      path: '/categories',
      name: 'Categories',
      component: () => import('../views/CategoriesView.vue'),
    },
    {
      path: '/users',
      name: 'Users',
      component: () => import('../views/UsersView.vue'),
    },
    {
      path: '/orders',
      name: 'Orders',
      component: () => import('../views/OrdersView.vue'),
    },
    {
      path: '/payments',
      name: 'Payments',
      component: () => import('../views/PaymentsView.vue'),
    },
  ],
});

// Guard de navegación: solo usuarios autenticados pueden entrar al panel
router.beforeEach((to) => {
  const token = localStorage.getItem('token');

  if (to.meta.public) {
    // Si ya está autenticado y va al login, lo llevamos al inicio
    return token ? { name: 'Home' } : true;
  }

  if (!token) {
    // Guardamos la ruta destino para volver después del login
    return { name: 'Login', query: { redirect: to.fullPath } };
  }

  return true;
});

export default router;
