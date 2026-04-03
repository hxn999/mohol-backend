import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { DatabaseModule } from 'src/database/database.module';
import { NotificationGateway } from './notification.gateway';

@Module({
    imports: [DatabaseModule],
    controllers: [NotificationController],
    providers: [NotificationService, NotificationGateway],
    exports: [NotificationService, NotificationGateway],
})
export class NotificationModule { }
