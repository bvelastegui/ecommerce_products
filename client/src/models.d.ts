import { Nullable } from '@primevue/core';

interface Product {
  _id?: Nullable<string>;
  title: Nullable<string>;
  description: Nullable<string>;
  price: Nullable<number>;
  stock: Nullable<number>;
  category: Nullable<string>;
}
