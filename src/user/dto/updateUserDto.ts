import {
  IsString,
  IsOptional,
  IsInt,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'Update profile picture' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  profile_pic_id?: number;

  @ApiPropertyOptional({ description: 'Update cover picture' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  cover_pic_id?: number;

  @ApiPropertyOptional({ description: 'Update full name' })
  @IsOptional()
  @IsString()
  full_name?: string;

  @ApiPropertyOptional({ description: 'Update bio' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ description: 'Update password' })
  @IsOptional()
  @IsString()
  password?: string;
}
