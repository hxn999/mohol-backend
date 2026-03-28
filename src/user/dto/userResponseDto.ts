import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../userRolesEnum';

export class UserResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'johndoe123' })
  username: string;

  @ApiProperty({ example: 'John Doe' })
  full_name: string;

  @ApiProperty({ example: 'john@example.com' })
  email: string;

  @ApiPropertyOptional({ example: '1' })
  profile_pic_id?: string | null;

  @ApiPropertyOptional({ example: '2' })
  cover_pic_id?: string | null;

  @ApiPropertyOptional({ example: 'I am a web developer' })
  bio?: string | null;

  @ApiProperty({ enum: UserRole, example: UserRole.USER })
  role: UserRole;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}
