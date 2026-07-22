import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OrderDocument = HydratedDocument<Order>;

// Item de la orden: guarda un "snapshot" del nombre y precio del producto
// al momento de la compra (si el producto cambia después, la orden no se altera)
@Schema({ _id: true })
export class OrderItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  product!: Types.ObjectId;

  @Prop({ required: true })
  productName!: string;

  @Prop({ required: true, min: 1 })
  quantity!: number;

  @Prop({ required: true, min: 0 })
  priceAtPurchase!: number;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

// Dirección de envío embebida (copia de la dirección del usuario al comprar)
@Schema({ _id: false })
export class ShippingAddress {
  @Prop()
  street!: string;

  @Prop()
  city!: string;

  @Prop()
  zipCode!: string;
}

export const ShippingAddressSchema =
  SchemaFactory.createForClass(ShippingAddress);

export const ORDER_STATUSES = [
  'pending',
  'paid',
  'sent',
  'delivered',
  'canceled',
] as const;

@Schema({ timestamps: true })
export class Order {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user!: Types.ObjectId;

  @Prop({ type: [OrderItemSchema], default: [] })
  items!: OrderItem[];

  @Prop({ type: ShippingAddressSchema })
  shippingAddress!: ShippingAddress;

  @Prop({ required: true, min: 0 })
  subTotal!: number;

  @Prop({ default: 0, min: 0 })
  tax!: number;

  @Prop({ required: true, min: 0 })
  total!: number;

  @Prop({ enum: ORDER_STATUSES, default: 'pending' })
  status: string;

  // Fecha límite de pago: si la orden sigue pendiente después de esta fecha,
  // se cancela automáticamente y se libera el stock reservado
  @Prop()
  expiresAt?: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
