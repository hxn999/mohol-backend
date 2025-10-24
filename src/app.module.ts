import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { CaslModule } from './casl/casl.module';
import { ConfigModule } from '@nestjs/config';
import { ProductsModule } from './products/products.module';
import { CouponModule } from './coupon/coupon.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { HttpModule } from '@nestjs/axios';
import { CloudinaryModule } from './cloudinary/cloudinary.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/miskbd'),
    UserModule,
    AuthModule,
    DashboardModule,
    CaslModule,
    HttpModule,
    ConfigModule.forRoot({isGlobal:true}),
    ProductsModule,
    CouponModule,
    OrdersModule,
    PaymentsModule,
    AnalyticsModule,
    CloudinaryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
