import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsOptional,
  MinLength,
  Matches,
  IsEnum,
} from 'class-validator';
// import { UserRol } from './user-role.enum';
import { UserRole } from '../userRolesEnum';

/**
 * Data Transfer Object for creating a new user.
 * Validation mirrors the requirements set in the Mongoose schema.
 */
export class CreateUserDto {
  // name: string (required, trim)
  @IsString({ message: 'Name must be a string.' })
  @IsNotEmpty({ message: 'Name is required.' })
  name: string;

  // pfp: string (required, trim) - Assuming this is a URL string
  @IsString({ message: 'Profile picture (pfp) must be a string (URL).' })
  @IsNotEmpty({ message: 'Profile picture (pfp) is required.' })
  pfp: string;

  // email: string (required, trim)
  @IsEmail({}, { message: 'Invalid email format.' })
  @IsNotEmpty({ message: 'Email is required.' })
  email: string;

  // phone: string (optional, trim)
  @IsOptional()
  @IsString({ message: 'Phone must be a string.' })
  phone?: string;

  // password: string (required) - Enforcing complexity: min 8, uppercase, number, special char
  @IsNotEmpty({ message: 'Password is required.' })
  @IsString({ message: 'Password must be a string.' })
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  @Matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/, {
    message: 'Password must contain at least one uppercase letter, one number, and one special character (e.g., !@#$%^&*).',
  })
  password: string;

  // institute: string (optional, trim)
  @IsOptional()
  @IsString({ message: 'Institute must be a string.' })
  institute?: string;

  // role: UserRole (required, enum, default: VIEWER)
  // We mark it as Optional because the schema provides a default value,
  // meaning the client is not required to send it.
  @IsOptional()
  @IsEnum(UserRole, { message: 'Invalid role provided. Must be one of: VIEWER, EDITOR, ADMIN.' })
  role?: UserRole;
}
