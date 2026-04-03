import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { DatabaseModule } from 'src/database/database.module';
import { MediaModule } from 'src/media/media.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
    imports: [DatabaseModule, MediaModule, NotificationModule],
    controllers: [PostController],
    providers: [PostService],
    exports: [PostService],
})
export class PostModule { }
