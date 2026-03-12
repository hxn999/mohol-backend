import { IsString, IsNotEmpty, IsOptional, IsUUID, IsEnum } from 'class-validator';
import { NotificationType, NotificationRefType } from 'src/database/database.types';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNotificationDto {
    @ApiProperty()
    @IsUUID()
    @IsNotEmpty()
    user_id: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    message: string;

    @ApiProperty({ enum: ['like', 'comment', 'follow', 'friend_request', 'mention', 'group_invite', 'post_share'] })
    @IsEnum(['like', 'comment', 'follow', 'friend_request', 'mention', 'group_invite', 'post_share'])
    @IsNotEmpty()
    type: NotificationType;

    @ApiProperty({ required: false })
    @IsUUID()
    @IsOptional()
    ref_id?: string;

    @ApiProperty({ enum: ['post', 'comment', 'user', 'group'], required: false })
    @IsEnum(['post', 'comment', 'user', 'group'])
    @IsOptional()
    ref_type?: NotificationRefType;
}
