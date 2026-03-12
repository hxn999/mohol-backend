import { IsString, IsNotEmpty, IsOptional, IsUUID, IsEnum } from 'class-validator';
import { PostType, PostVisibility, PostStatus } from 'src/database/database.types';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  body?: string;

  @ApiProperty()
  @IsUUID()
  @IsNotEmpty()
  user_id: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  group_id?: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  original_post_id?: string;

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
}
