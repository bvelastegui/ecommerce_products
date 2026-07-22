import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, PaymentDocument } from './payment.schema';
import { OrdersService } from '../orders/orders.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    private readonly ordersService: OrdersService,
  ) {}

  // Registra un pago SIMULADO sobre una orden pendiente.
  // Si el pago es exitoso, la orden pasa a estado 'paid' (y descuenta el stock)
  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    const order = await this.ordersService.findOne(createPaymentDto.order);

    // Una orden solo puede tener un pago completado
    const existingPayment = await this.paymentModel
      .findOne({ order: createPaymentDto.order, status: 'completed' })
      .exec();
    if (existingPayment) {
      throw new BadRequestException(
        `La orden ${createPaymentDto.order} ya tiene un pago registrado`,
      );
    }

    if (order.status !== 'pending') {
      throw new BadRequestException(
        `La orden está en estado '${order.status}' y no puede pagarse`,
      );
    }

    // Simulación de rechazo del pago (la orden sigue pendiente)
    if (createPaymentDto.simulateFailure) {
      const failedPayment = new this.paymentModel({
        order: createPaymentDto.order,
        amount: order.total,
        method: createPaymentDto.method,
        status: 'failed',
      });
      return failedPayment.save();
    }

    // Pago exitoso: la orden se marca como pagada (descuenta el stock)
    await this.ordersService.markAsPaid(createPaymentDto.order);

    const payment = new this.paymentModel({
      order: createPaymentDto.order,
      amount: order.total,
      method: createPaymentDto.method,
      status: 'completed',
      transactionId: this.generateTransactionId(),
      paidAt: new Date(),
    });

    const savedPayment = await payment.save();
    return savedPayment.populate({ path: 'order', populate: { path: 'user' } });
  }

  async findAll(): Promise<Payment[]> {
    return this.paymentModel
      .find()
      .populate({ path: 'order', populate: { path: 'user' } })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentModel
      .findById(id)
      .populate({ path: 'order', populate: { path: 'user' } })
      .exec();
    if (!payment) throw new NotFoundException(`Pago ${id} no encontrado`);
    return payment;
  }

  async remove(id: string) {
    const payment = await this.paymentModel.findByIdAndDelete(id).exec();
    if (!payment) throw new NotFoundException(`Pago ${id} no encontrado`);
  }

  // ID de transacción falso, como el que devolvería una pasarela real
  private generateTransactionId(): string {
    const random = Math.round(Math.random() * 1e9);
    return `SIM-${Date.now()}-${random}`;
  }
}
