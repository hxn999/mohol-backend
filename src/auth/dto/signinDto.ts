import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SigninDto {
  @ApiPropertyOptional({
    description: 'Email address of the user',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Invalid email format.' })
  @IsOptional()
  email: string;



  @ApiProperty({
    description: 'Password for the account',
    example: 'P@ssword123',
  })
  @IsNotEmpty({ message: 'Password is required.' })
  @IsString({ message: 'Password must be a string.' })
  password: string;
}
