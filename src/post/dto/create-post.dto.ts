import { IsString, IsNotEmpty, IsOptional, IsInt, IsEnum } from 'class-validator';
import { PostType, PostVisibility, PostStatus } from 'src/database/database.types';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreatePostDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  body?: string;

  @ApiProperty()
  @IsInt()
  @Type(() => Number)
  @IsNotEmpty()
  user_id: number;

  @ApiProperty({ required: false })
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  group_id?: number;

  @ApiProperty({ required: false })
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  original_post_id?: number;

  @ApiProperty({ enum: ['text', 'image', 'video', 'share'], default: 'text' })
  @IsEnum(['text', 'image', 'video', 'share'])
  @IsOptional()
  type?: PostType;

  @ApiProperty({ enum: ['public', 'private', 'friends_only', 'group_only'], default: 'public' })
  @IsEnum(['public', 'private', 'friends_only', 'group_only'])
  @IsOptional()
  visibility?: PostVisibility;

  @ApiProperty({ enum: ['active', 'archived', 'deleted', 'pending'], default: 'active' })
  @IsEnum(['active', 'archived', 'deleted', 'pending'])
  @IsOptional()
  status?: PostStatus;

  @ApiProperty({ required: false, type: [Number] })
  @IsOptional()
  tags?: number[];
}
