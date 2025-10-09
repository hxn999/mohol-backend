import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { CaslModule } from './casl/casl.module';
import { ConfigModule } from '@nestjs/config';


@Module({
  imports: [MongooseModule.forRoot('mongodb://localhost/mindscape'), UserModule, AuthModule, DashboardModule, CaslModule,ConfigModule.forRoot({isGlobal:true})],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
