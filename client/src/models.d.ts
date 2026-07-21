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

interface Address {
  _id?: Nullable<string>;
  street: Nullable<string>;
  city: Nullable<string>;
  zipCode: Nullable<string>;
  isDefault: boolean;
}

interface User {
  _id?: Nullable<string>;
  name: Nullable<string>;
  email: Nullable<string>;
  password?: Nullable<string>;
  role: Nullable<string>;
  addresses: Nullable<Address[]>;
}
