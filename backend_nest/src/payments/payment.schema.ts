import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PaymentDocument = HydratedDocument<Payment>;

export const PAYMENT_METHODS = ['cash', 'card', 'transfer'] as const;
export const PAYMENT_STATUSES = ['completed', 'failed'] as const;

@Schema({ timestamps: true })
export class Payment {
  // Una orden puede tener varios intentos de pago, pero solo uno completado
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  order!: Types.ObjectId;

  // Monto tomado del total de la orden al momento del pago
  @Prop({ required: true, min: 0 })
  amount!: number;

  @Prop({ enum: PAYMENT_METHODS, required: true })
  method!: string;

  @Prop({ enum: PAYMENT_STATUSES, required: true })
  status!: string;

  // Identificador simulado de la transacción (solo en pagos completados)
  @Prop()
  transactionId?: string;

  @Prop()
  paidAt?: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
