import { createApp } from 'vue';
import { createPinia } from 'pinia';
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';
import './assets/global.css';

import App from './App.vue';
import router from './router';

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(PrimeVue, {
  theme: {
    preset: Aura,
  },
  license:
    'eyJpZCI6IjMwYmY2M2FjLTQxMWEtNGVhZC1iZmZjLTNiM2U1NTRhNmUyMCIsInByb2R1Y3QiOiJwcmltZXVpIiwidGllciI6ImNvbW11bml0eSIsInR5cGUiOiJkZXYiLCJpYXQiOjE3ODM4NzE0NTcsImV4cCI6MTgxNTQwNzQ1N30.dkZIt2YS8zoMyfecIWQE1wSEZcBXaZiQiCgB4kfrp0MM19z7CGVy7M6UDwDGI82LKaCV9PeszgFUOKr3qKa7BA',
});

app.mount('#app');
