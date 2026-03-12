import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new notification' })
    create(@Body() createNotificationDto: CreateNotificationDto) {
        return this.notificationService.create(createNotificationDto);
    }

    @Get('user/:userId')
    @ApiOperation({ summary: 'Get all notifications for a user' })
    findAllByUser(@Param('userId', ParseUUIDPipe) userId: string) {
        return this.notificationService.findAllByUser(userId);
    }

    @Patch(':id/read')
    @ApiOperation({ summary: 'Mark a notification as read' })
    markAsRead(@Param('id', ParseUUIDPipe) id: string) {
        return this.notificationService.markAsRead(id);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a notification' })
    remove(@Param('id', ParseUUIDPipe) id: string) {
        return this.notificationService.remove(id);
    }
}
