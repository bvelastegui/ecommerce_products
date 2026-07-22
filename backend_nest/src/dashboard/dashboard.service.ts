import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from '../orders/order.schema';
import { Payment, PaymentDocument } from '../payments/payment.schema';
import { Product, ProductDocument } from '../products/product.schema';
import { User, UserDocument } from '../users/user.schema';
import { Category, CategoryDocument } from '../category/category.schema';

// Estados que representan una venta efectiva (para ingresos y top de productos)
const SALE_STATUSES = ['paid', 'sent', 'delivered'];

// Umbral de "stock bajo": disponible (stock - reservado) menor o igual a esto
const LOW_STOCK_THRESHOLD = 10;

export type DashboardRange = 'week' | 'month' | 'semester' | 'year';
const VALID_RANGES: DashboardRange[] = ['week', 'month', 'semester', 'year'];

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  async getDashboard(range?: string) {
    const normalizedRange: DashboardRange = VALID_RANGES.includes(
      range as DashboardRange,
    )
      ? (range as DashboardRange)
      : 'year';

    const startDate = this.getStartDate(normalizedRange);

    const [
      summary,
      salesByMonth,
      ordersByStatus,
      topProducts,
      paymentsByMethod,
      recentOrders,
      lowStockProducts,
    ] = await Promise.all([
      this.getSummary(startDate),
      this.getSalesByMonth(startDate),
      this.getOrdersByStatus(startDate),
      this.getTopProducts(startDate),
      this.getPaymentsByMethod(startDate),
      this.getRecentOrders(startDate),
      this.getLowStockProducts(), // el inventario no se filtra por rango
    ]);

    return {
      range: normalizedRange,
      rangeStart: startDate,
      summary,
      salesByMonth,
      ordersByStatus,
      topProducts,
      paymentsByMethod,
      recentOrders,
      lowStockProducts,
    };
  }

  // Calcula la fecha de inicio del rango seleccionado
  private getStartDate(range: DashboardRange): Date {
    const now = new Date();

    switch (range) {
      case 'week': {
        // Semana calendario (lunes a hoy)
        const dayOfWeek = now.getDay(); // 0=domingo .. 6=sábado
        const diffToMonday = (dayOfWeek + 6) % 7;
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        start.setDate(start.getDate() - diffToMonday);
        return start;
      }
      case 'month':
        return new Date(now.getFullYear(), now.getMonth(), 1);
      case 'semester': {
        // "Quimestre": bloques de 6 meses del año (ene-jun / jul-dic)
        const startMonth = now.getMonth() < 6 ? 0 : 6;
        return new Date(now.getFullYear(), startMonth, 1);
      }
      case 'year':
      default:
        return new Date(now.getFullYear(), 0, 1);
    }
  }

  private dateFilter(startDate: Date): { createdAt: { $gte: Date } } {
    return { createdAt: { $gte: startDate } };
  }

  private async getSummary(startDate: Date) {
    const dateMatch = this.dateFilter(startDate);

    const [
      totalUsers,
      totalProducts,
      totalCategories,
      totalOrders,
      pendingOrders,
      canceledOrders,
      revenueResult,
      salesCountResult,
    ] = await Promise.all([
      this.userModel.countDocuments({ role: 'client' }).exec(),
      this.productModel.countDocuments().exec(),
      this.categoryModel.countDocuments().exec(),
      this.orderModel.countDocuments(dateMatch).exec(),
      this.orderModel.countDocuments({ ...dateMatch, status: 'pending' }).exec(),
      this.orderModel.countDocuments({ ...dateMatch, status: 'canceled' }).exec(),
      this.paymentModel
        .aggregate([
          { $match: { ...dateMatch, status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ])
        .exec(),
      this.orderModel
        .aggregate([
          { $match: { ...dateMatch, status: { $in: SALE_STATUSES } } },
          { $count: 'count' },
        ])
        .exec(),
    ]);

    const totalRevenue = revenueResult[0]?.total ?? 0;
    const completedSales = salesCountResult[0]?.count ?? 0;

    return {
      totalRevenue: this.round(totalRevenue),
      totalOrders,
      totalUsers,
      totalProducts,
      totalCategories,
      pendingOrders,
      canceledOrders,
      completedSales,
      averageOrderValue: completedSales
        ? this.round(totalRevenue / completedSales)
        : 0,
      cancellationRate: totalOrders
        ? this.round((canceledOrders / totalOrders) * 100)
        : 0,
    };
  }

  // Ingresos y cantidad de órdenes por mes (para el gráfico de tendencia)
  private async getSalesByMonth(startDate: Date) {
    const result = await this.orderModel
      .aggregate([
        { $match: { ...this.dateFilter(startDate), status: { $in: SALE_STATUSES } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            revenue: { $sum: '$total' },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .exec();

    return result.map((row) => ({
      month: row._id as string,
      revenue: this.round(row.revenue as number),
      orders: row.orders as number,
    }));
  }

  // Cantidad de órdenes por estado (para el gráfico de dona)
  private async getOrdersByStatus(startDate: Date) {
    const result = await this.orderModel
      .aggregate([
        { $match: this.dateFilter(startDate) },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ])
      .exec();

    return result.map((row) => ({
      status: row._id as string,
      count: row.count as number,
    }));
  }

  // Productos más vendidos por cantidad (solo ventas efectivas)
  private async getTopProducts(startDate: Date) {
    const result = await this.orderModel
      .aggregate([
        { $match: { ...this.dateFilter(startDate), status: { $in: SALE_STATUSES } } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            name: { $first: '$items.productName' },
            quantitySold: { $sum: '$items.quantity' },
            revenue: {
              $sum: { $multiply: ['$items.quantity', '$items.priceAtPurchase'] },
            },
          },
        },
        { $sort: { quantitySold: -1 } },
        { $limit: 8 },
      ])
      .exec();

    return result.map((row) => ({
      productId: row._id as string,
      name: row.name as string,
      quantitySold: row.quantitySold as number,
      revenue: this.round(row.revenue as number),
    }));
  }

  // Distribución de pagos completados por método
  private async getPaymentsByMethod(startDate: Date) {
    const result = await this.paymentModel
      .aggregate([
        { $match: { ...this.dateFilter(startDate), status: 'completed' } },
        {
          $group: {
            _id: '$method',
            count: { $sum: 1 },
            total: { $sum: '$amount' },
          },
        },
      ])
      .exec();

    return result.map((row) => ({
      method: row._id as string,
      count: row.count as number,
      total: this.round(row.total as number),
    }));
  }

  private async getRecentOrders(startDate: Date) {
    return this.orderModel
      .find(this.dateFilter(startDate))
      .populate('user')
      .sort({ createdAt: -1 })
      .limit(8)
      .exec();
  }

  // Productos con disponible (stock - reservado) por debajo del umbral.
  // Es una foto del inventario actual: no se filtra por rango de fechas
  private async getLowStockProducts() {
    return this.productModel
      .aggregate([
        {
          $addFields: {
            available: { $subtract: ['$stock', '$reservedStock'] },
          },
        },
        { $match: { available: { $lte: LOW_STOCK_THRESHOLD } } },
        { $sort: { available: 1 } },
        { $limit: 8 },
      ])
      .exec();
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
