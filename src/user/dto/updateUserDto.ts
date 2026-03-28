import {
  IsString,
  IsOptional,
  MaxLength,
  IsPhoneNumber,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Update user bio',
    example: 'New bio description',
  })
  @IsOptional()
  @IsString()
  bio?: string;
}
