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

import { PostModule } from './post/post.module';
import { GroupModule } from './group/group.module';
import { MediaModule } from './media/media.module';
import { RelationshipModule } from './relationship/relationship.module';
import { NotificationModule } from './notification/notification.module';
import { SearchModule } from './search/search.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    DatabaseModule,
    UserModule,
    AuthModule,
    PostModule,
    GroupModule,
    MediaModule,
    RelationshipModule,
    NotificationModule,
    SearchModule,
    AnalyticsModule,

    CaslModule,
    HttpModule,
    ConfigModule.forRoot({ isGlobal: true }),




    CloudinaryModule,

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
