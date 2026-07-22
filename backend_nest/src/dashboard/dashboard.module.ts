import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Order, OrderSchema } from '../orders/order.schema';
import { Payment, PaymentSchema } from '../payments/payment.schema';
import { Product, ProductSchema } from '../products/product.schema';
import { User, UserSchema } from '../users/user.schema';
import { Category, CategorySchema } from '../category/category.schema';

@Module({
  imports: [
    // Solo lectura: registramos los esquemas que necesitan las agregaciones
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Payment.name, schema: PaymentSchema },
      { name: Product.name, schema: ProductSchema },
      { name: User.name, schema: UserSchema },
      { name: Category.name, schema: CategorySchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
