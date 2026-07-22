import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Order, OrderDocument, OrderItem } from './order.schema';
import { Product, ProductDocument } from '../products/product.schema';
import { User } from '../users/user.schema';
import { CreateOrderDto, CreateOrderItemDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

// IVA Ecuador
const TAX_RATE = 0.15;

// Minutos que una orden puede permanecer pendiente antes de cancelarse sola
const PAYMENT_TIMEOUT_MINUTES = 15;

// Máquina de estados: transiciones permitidas entre estados de la orden
const ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['paid', 'canceled'],
  paid: ['sent'],
  sent: ['delivered'],
  delivered: [],
  canceled: [],
};

interface BuiltItems {
  items: OrderItem[];
  subTotal: number;
  tax: number;
  total: number;
}

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    await this.validateUserExists(createOrderDto.user);

    // Reservamos el stock de cada item (bloqueo mientras está pendiente)
    const { items, ...totals } = await this.buildItems(createOrderDto.items);

    const createdOrder = new this.orderModel({
      user: createOrderDto.user,
      items,
      shippingAddress: createOrderDto.shippingAddress,
      ...totals,
      expiresAt: new Date(Date.now() + PAYMENT_TIMEOUT_MINUTES * 60 * 1000),
    });

    try {
      const savedOrder = await createdOrder.save();
      return await savedOrder.populate(['user', 'items.product']);
    } catch (err) {
      // Si algo falla al guardar, liberamos el stock reservado
      await this.releaseReservations(items);
      throw err;
    }
  }

  async findAll(): Promise<Order[]> {
    return this.orderModel
      .find()
      .populate('user')
      .populate('items.product')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderModel
      .findById(id)
      .populate('user')
      .populate('items.product')
      .exec();
    if (!order) throw new NotFoundException(`Orden ${id} no encontrada`);
    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order> {
    const order = await this.orderModel.findById(id).exec();
    if (!order) throw new NotFoundException(`Orden ${id} no encontrada`);

    // Los items solo se pueden modificar mientras la orden está pendiente
    if (updateOrderDto.items) {
      if (order.status !== 'pending') {
        throw new BadRequestException(
          `No se pueden modificar los items de una orden en estado '${order.status}'`,
        );
      }

      // Si los items no cambiaron (ej. solo se actualizó el estado),
      // conservamos los snapshots y reservas existentes sin tocar el stock
      if (!this.itemsAreEqual(order.items, updateOrderDto.items)) {
        // Liberamos primero las reservas actuales: los productos de esta
        // misma orden deben contar como disponibles al re-reservar
        await this.releaseReservations(order.items);
        try {
          const { items, ...totals } = await this.buildItems(
            updateOrderDto.items,
          );
          order.items = items;
          Object.assign(order, totals);
        } catch (err) {
          // Rollback: intentamos restaurar las reservas originales
          try {
            await this.buildItems(
              order.items.map((item) => ({
                product: item.product.toString(),
                quantity: item.quantity,
              })),
            );
          } catch (rollbackErr) {
            this.logger.error(
              `No se pudieron restaurar las reservas de la orden ${order._id.toString()}`,
              rollbackErr,
            );
          }
          throw err;
        }
      }
    }

    if (updateOrderDto.user) {
      await this.validateUserExists(updateOrderDto.user);
      order.user = updateOrderDto.user as unknown as Types.ObjectId;
    }

    if (updateOrderDto.shippingAddress) {
      order.shippingAddress = updateOrderDto.shippingAddress;
    }

    // Cambio de estado: validamos la transición y movemos el stock
    if (updateOrderDto.status && updateOrderDto.status !== order.status) {
      this.assertValidTransition(order.status, updateOrderDto.status);

      if (updateOrderDto.status === 'paid') {
        // La reserva se convierte en venta: baja el stock físico
        await this.confirmStockDeduction(order.items);
      }

      if (updateOrderDto.status === 'canceled') {
        // Se libera el stock bloqueado
        await this.releaseReservations(order.items);
      }

      order.status = updateOrderDto.status;
    }

    const updatedOrder = await order.save();
    return updatedOrder.populate(['user', 'items.product']);
  }

  async remove(id: string) {
    const order = await this.orderModel.findByIdAndDelete(id).exec();
    if (!order) throw new NotFoundException(`Orden ${id} no encontrada`);
  }

  // Tarea programada: cada minuto cancela las órdenes pendientes cuyo
  // tiempo de pago expiró y libera su stock reservado
  @Cron(CronExpression.EVERY_MINUTE)
  async cancelExpiredPendingOrders() {
    const expiredOrders = await this.orderModel
      .find({ status: 'pending', expiresAt: { $lt: new Date() } })
      .exec();

    for (const order of expiredOrders) {
      await this.releaseReservations(order.items);
      order.status = 'canceled';
      await order.save();
      this.logger.log(
        `Orden ${order._id.toString()} cancelada automáticamente por falta de pago`,
      );
    }
  }

  // Construye los items con el nombre y precio actuales del producto en BD,
  // calcula los totales y reserva el stock de cada producto
  private async buildItems(
    itemDtos: CreateOrderItemDto[],
  ): Promise<BuiltItems> {
    const items: OrderItem[] = [];
    const reserved: OrderItem[] = [];
    let subTotal = 0;

    try {
      for (const itemDto of itemDtos) {
        const product = await this.productModel
          .findById(itemDto.product)
          .exec();
        if (!product) {
          throw new NotFoundException(
            `Producto ${itemDto.product} no encontrado`,
          );
        }

        // Reserva atómica: solo descuenta de lo disponible si alcanza
        const reservation = await this.productModel.updateOne(
          {
            _id: product._id,
            $expr: {
              $gte: [
                { $subtract: ['$stock', '$reservedStock'] },
                itemDto.quantity,
              ],
            },
          },
          { $inc: { reservedStock: itemDto.quantity } },
        );

        if (reservation.modifiedCount === 0) {
          const available = product.stock - (product.reservedStock ?? 0);
          throw new BadRequestException(
            `Stock insuficiente para "${product.name}" (disponible: ${available}, solicitado: ${itemDto.quantity})`,
          );
        }

        const item = {
          product: product._id,
          productName: product.name,
          quantity: itemDto.quantity,
          priceAtPurchase: product.basePrice,
        };

        items.push(item);
        reserved.push(item);
        subTotal += product.basePrice * itemDto.quantity;
      }
    } catch (err) {
      // Si algún item falla, liberamos las reservas hechas en esta misma operación
      await this.releaseReservations(reserved);
      throw err;
    }

    subTotal = this.roundMoney(subTotal);
    const tax = this.roundMoney(subTotal * TAX_RATE);
    const total = this.roundMoney(subTotal + tax);

    return { items, subTotal, tax, total };
  }

  // pending -> paid: la reserva se convierte en salida definitiva de stock
  private async confirmStockDeduction(items: OrderItem[]) {
    for (const item of items) {
      await this.productModel.updateOne(
        { _id: item.product },
        { $inc: { stock: -item.quantity, reservedStock: -item.quantity } },
      );
    }
  }

  // pending -> canceled: se libera el stock bloqueado sin tocar el físico
  private async releaseReservations(items: OrderItem[]) {
    for (const item of items) {
      await this.productModel.updateOne(
        { _id: item.product, reservedStock: { $gte: item.quantity } },
        { $inc: { reservedStock: -item.quantity } },
      );
    }
  }

  private assertValidTransition(currentStatus: string, newStatus: string) {
    const allowed = ORDER_STATUS_TRANSITIONS[currentStatus] ?? [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `No se puede cambiar el estado de '${currentStatus}' a '${newStatus}'`,
      );
    }
  }

  // Compara items ignorando el orden: mismos productos y cantidades
  private itemsAreEqual(
    currentItems: OrderItem[],
    incomingItems: CreateOrderItemDto[],
  ): boolean {
    if (currentItems.length !== incomingItems.length) return false;
    const normalize = (items: { product: string; quantity: number }[]) =>
      items
        .map((item) => `${item.product}:${item.quantity}`)
        .sort()
        .join('|');
    const current = currentItems.map((item) => ({
      product: item.product.toString(),
      quantity: item.quantity,
    }));
    return normalize(current) === normalize(incomingItems);
  }

  private async validateUserExists(userId: string) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException(`Usuario ${userId} no encontrado`);
  }

  private roundMoney(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
