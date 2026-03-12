import { IsString, IsOptional, IsEnum } from 'class-validator';
import { PostVisibility, PostStatus } from 'src/database/database.types';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePostDto {
    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    body?: string;

    @ApiProperty({ enum: ['public', 'private', 'friends_only', 'group_only'], required: false })
    @IsEnum(['public', 'private', 'friends_only', 'group_only'])
    @IsOptional()
    visibility?: PostVisibility;

    @ApiProperty({ enum: ['active', 'archived', 'deleted', 'pending'], required: false })
    @IsEnum(['active', 'archived', 'deleted', 'pending'])
    @IsOptional()
    status?: PostStatus;
}
