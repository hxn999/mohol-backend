import { IsString, IsNotEmpty, IsOptional, IsInt, IsEnum } from 'class-validator';
import { NotificationType, NotificationRefType } from 'src/database/database.types';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateNotificationDto {
    @ApiProperty()
    @IsInt()
    @Type(() => Number)
    @IsNotEmpty()
    user_id: number;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    message: string;

    @ApiProperty({ enum: ['like', 'comment', 'follow', 'friend_request', 'mention', 'group_invite', 'post_share'] })
    @IsEnum(['like', 'comment', 'follow', 'friend_request', 'mention', 'group_invite', 'post_share'])
    @IsNotEmpty()
    type: NotificationType;

    @ApiProperty({ required: false })
    @IsInt()
    @Type(() => Number)
    @IsOptional()
    ref_id?: number;

    @ApiProperty({ enum: ['post', 'comment', 'user', 'group'], required: false })
    @IsEnum(['post', 'comment', 'user', 'group'])
    @IsOptional()
    ref_type?: NotificationRefType;

    @ApiProperty({ required: false })
    @IsInt()
    @Type(() => Number)
    @IsOptional()
    actor_id?: number;
}
