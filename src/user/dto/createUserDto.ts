import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  IsPhoneNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'The full name of the user',
    example: 'John Doe',
  })
  @IsString({ message: 'Name must be a string.' })
  @IsNotEmpty({ message: 'Name is required.' })
  name: string;

  @ApiProperty({
    description: 'Unique username for the user',
    example: 'johndoe123',
  })
  @IsString({ message: 'Username must be a string.' })
  @IsNotEmpty({ message: 'Username is required.' })
  username: string;

  @ApiPropertyOptional({
    description: 'Email address of the user',
    example: 'john@example.com',
  })
  @IsEmail({}, { message: 'Invalid email format.' })
  @IsOptional()
  email: string;

  @ApiProperty({
    description: 'Password for the user account (min 8 characters)',
    example: 'Password123!',
    minLength: 8,
  })
  @IsNotEmpty({ message: 'Password is required.' })
  @IsString({ message: 'Password must be a string.' })
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  password: string;
}
