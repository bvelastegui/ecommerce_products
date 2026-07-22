import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { ProductsModule } from './products/products.module';
import { CategoryModule } from './category/category.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ServeStaticModule.forRoot(
      {
        rootPath: join(__dirname, '..', 'uploads'),
        serveRoot: '/uploads',
      },
      {
        rootPath: join(__dirname, '..', '..', 'client', 'dist'),
      },
    ),
    MongooseModule.forRoot('mongodb://localhost:27017/ecommerce'),
    ScheduleModule.forRoot(),
    ProductsModule,
    CategoryModule,
    UsersModule,
    AuthModule,
    OrdersModule,
    PaymentsModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
