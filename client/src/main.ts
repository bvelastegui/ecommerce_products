import { createApp } from 'vue';
import { createPinia } from 'pinia';
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';
import './assets/global.css';
import { ToastService, ConfirmationService } from 'primevue';

import App from './App.vue';
import router from './router';

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(PrimeVue, {
  theme: {
    preset: Aura,
  },
  license: import.meta.env.VITE_PRIME_VUE_LICENSE || '',
});
app.use(ToastService);
app.use(ConfirmationService);

app.mount('#app');
