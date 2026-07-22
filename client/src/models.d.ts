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
  reservedStock?: Nullable<number>;
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

interface OrderItem {
  _id?: Nullable<string>;
  product: Nullable<string>;
  productName?: Nullable<string>;
  quantity: Nullable<number>;
  priceAtPurchase?: Nullable<number>;
}

interface ShippingAddress {
  street: Nullable<string>;
  city: Nullable<string>;
  zipCode: Nullable<string>;
}

interface Order {
  _id?: Nullable<string>;
  user: Nullable<string>;
  items: Nullable<OrderItem[]>;
  shippingAddress?: Nullable<ShippingAddress>;
  subTotal?: Nullable<number>;
  tax?: Nullable<number>;
  total?: Nullable<number>;
  status?: Nullable<string>;
  expiresAt?: Nullable<string>;
  createdAt?: Nullable<string>;
}

interface Payment {
  _id?: Nullable<string>;
  order: Nullable<string>;
  amount?: Nullable<number>;
  method: Nullable<string>;
  status?: Nullable<string>;
  transactionId?: Nullable<string>;
  paidAt?: Nullable<string>;
  createdAt?: Nullable<string>;
  // Solo para el formulario: fuerza un pago rechazado (simulación)
  simulateFailure?: Nullable<boolean>;
}

interface DashboardSummary {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  totalCategories: number;
  pendingOrders: number;
  canceledOrders: number;
  completedSales: number;
  averageOrderValue: number;
  cancellationRate: number;
}

interface DashboardSalesByMonth {
  month: string;
  revenue: number;
  orders: number;
}

interface DashboardOrdersByStatus {
  status: string;
  count: number;
}

interface DashboardTopProduct {
  productId: string;
  name: string;
  quantitySold: number;
  revenue: number;
}

interface DashboardPaymentsByMethod {
  method: string;
  count: number;
  total: number;
}

interface DashboardLowStockProduct {
  _id: string;
  name: string;
  stock: number;
  reservedStock: number;
}

interface Dashboard {
  range?: string;
  rangeStart?: string;
  summary: DashboardSummary;
  salesByMonth: DashboardSalesByMonth[];
  ordersByStatus: DashboardOrdersByStatus[];
  topProducts: DashboardTopProduct[];
  paymentsByMethod: DashboardPaymentsByMethod[];
  recentOrders: Order[];
  lowStockProducts: DashboardLowStockProduct[];
}
