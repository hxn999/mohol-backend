import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PasswordChangeDto {
  @ApiProperty({
    description: 'The current password of the user',
    example: 'OldP@ssword123',
  })
  @IsNotEmpty({ message: 'Password is required.' })
  @IsString({ message: 'Password must be a string.' })
  @MinLength(8, { message: 'Password is at least 8 characters long.' })
  prevPassword: string;

  @ApiProperty({
    description: 'The new password for the account',
    example: 'NewP@ssword123',
    minLength: 8,
  })
  @IsNotEmpty({ message: 'Password is required.' })
  @IsString({ message: 'Password must be a string.' })
  @MinLength(8, { message: 'Password is at least 8 characters long.' })
  newPassword: string;
}
  