import { Nullable } from '@primevue/core';

interface Product {
  _id?: Nullable<string>;
  slug?: Nullable<string>;
  name: Nullable<string>;
  description: Nullable<string>;
  basePrice: Nullable<number>;
  categoryId: Nullable<string>;
  images: Nullable<string[]>;
  stock: Nullable<number>;
  isActive?: Nullable<boolean>;
}

interface Category {
  _id?: Nullable<string>;
  slug?: Nullable<string>;
  name: Nullable<string>;
  description: Nullable<string>;
  isActive?: Nullable<boolean>;
}
