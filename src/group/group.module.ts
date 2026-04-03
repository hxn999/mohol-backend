import { Module } from '@nestjs/common';
import { GroupService } from './group.service';
import { GroupController } from './group.controller';
import { DatabaseModule } from 'src/database/database.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
    imports: [DatabaseModule, NotificationModule],
    controllers: [GroupController],
    providers: [GroupService],
    exports: [GroupService],
})
export class GroupModule { }
