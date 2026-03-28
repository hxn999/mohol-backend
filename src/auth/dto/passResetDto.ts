import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PassresetDto {
  @ApiProperty({
    description: 'The new password for the account',
    example: 'NewP@ssword123',
    minLength: 8,
  })
  @IsNotEmpty({ message: 'Password is required.' })
  @IsString({ message: 'Password must be a string.' })
  @MinLength(8, { message: 'Password is at least 8 characters long.' })
  password: string;
}
