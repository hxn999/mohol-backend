import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';

import { CaslModule } from './casl/casl.module';
import { ConfigModule } from '@nestjs/config';


import { HttpModule } from '@nestjs/axios';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    DatabaseModule,
    UserModule,
    AuthModule,
   
    CaslModule,
    HttpModule,
    ConfigModule.forRoot({isGlobal:true}),

  
  
   
    CloudinaryModule,
   
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
