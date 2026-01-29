import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { User } from 'src/database/database.types';
import { CreateUserDto } from './dto/createUserDto';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/updateUserDto';
import { sql } from 'kysely';

@Injectable()
export class UserService {
  constructor(private readonly db: DatabaseService) {}
  private readonly logger = new Logger(UserService.name);

  async create(user: CreateUserDto): Promise<User> {
    // Check for duplicate accounts (email)
    if (user.email) {
      const existingByEmail = await sql<User>`
        SELECT * FROM users WHERE email = ${user.email}
      `.execute(this.db);
      
      if (existingByEmail.rows.length > 0) {
        throw new ConflictException(`Account with email ${user.email} already exists!`);
      }
    }

    // Hash password
    const saltOrRounds = 10;
    const hashedPassword = await bcrypt.hash(user.password, saltOrRounds);

    // Generate username from email or timestamp
    const username = user.username;

    // Create user with raw SQL
    const result = await sql<User>`
      INSERT INTO users (username, password, full_name, email, profile_pic_id, cover_pic_id, bio, role)
      VALUES (${username}, ${hashedPassword}, ${user.name}, ${user.email || null}, NULL, NULL, NULL, 'user')
      RETURNING *
    `.execute(this.db);

    if (result.rows.length === 0) {
      throw new BadRequestException('Failed to create user');
    }

    return result.rows[0];
  }

  async findOne(query: string): Promise<User> {
    // Check if it's a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    let result;
    if (uuidRegex.test(query)) {
      // Find by UUID
      result = await sql<User>`
        SELECT * FROM users WHERE id = ${query}
      `.execute(this.db);
    } else {
      // Try email or username
      result = await sql<User>`
        SELECT * FROM users WHERE email = ${query} OR username = ${query}
      `.execute(this.db);
    }

    if (result.rows.length === 0) {
      throw new NotFoundException(`User with identifier ${query} not found`);
    }

    return result.rows[0];
  }

  async findMany(query: Record<string, any>): Promise<User[]> {
    // Build query using sql template literals
    if (query.email && query.username && query.role) {
      const result = await sql<User>`
        SELECT * FROM users 
        WHERE email = ${query.email} 
        AND username = ${query.username} 
        AND role = ${query.role}
      `.execute(this.db);
      if (result.rows.length === 0) {
        throw new NotFoundException(`No users found matching criteria`);
      }
      return result.rows;
    } else if (query.email && query.username) {
      const result = await sql<User>`
        SELECT * FROM users 
        WHERE email = ${query.email} 
        AND username = ${query.username}
      `.execute(this.db);
      if (result.rows.length === 0) {
        throw new NotFoundException(`No users found matching criteria`);
      }
      return result.rows;
    } else if (query.email && query.role) {
      const result = await sql<User>`
        SELECT * FROM users 
        WHERE email = ${query.email} 
        AND role = ${query.role}
      `.execute(this.db);
      if (result.rows.length === 0) {
        throw new NotFoundException(`No users found matching criteria`);
      }
      return result.rows;
    } else if (query.username && query.role) {
      const result = await sql<User>`
        SELECT * FROM users 
        WHERE username = ${query.username} 
        AND role = ${query.role}
      `.execute(this.db);
      if (result.rows.length === 0) {
        throw new NotFoundException(`No users found matching criteria`);
      }
      return result.rows;
    } else if (query.email) {
      const result = await sql<User>`
        SELECT * FROM users WHERE email = ${query.email}
      `.execute(this.db);
      if (result.rows.length === 0) {
        throw new NotFoundException(`No users found matching criteria`);
      }
      return result.rows;
    } else if (query.username) {
      const result = await sql<User>`
        SELECT * FROM users WHERE username = ${query.username}
      `.execute(this.db);
      if (result.rows.length === 0) {
        throw new NotFoundException(`No users found matching criteria`);
      }
      return result.rows;
    } else if (query.role) {
      const result = await sql<User>`
        SELECT * FROM users WHERE role = ${query.role}
      `.execute(this.db);
      if (result.rows.length === 0) {
        throw new NotFoundException(`No users found matching criteria`);
      }
      return result.rows;
    } else {
      // No filters, return all users
      const result = await sql<User>`SELECT * FROM users ORDER BY created_at DESC`.execute(this.db);
      return result.rows;
    }
  }

  async findAll(): Promise<User[]> {
    // Get all users without any filters
    const result = await sql<User>`
      SELECT * FROM users 
      ORDER BY created_at DESC
    `.execute(this.db);
    
    return result.rows;
  }

  async deleteOne(query: string): Promise<{ deleted: boolean }> {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    let result;
    if (uuidRegex.test(query)) {
      result = await sql`
        DELETE FROM users WHERE id = ${query}
      `.execute(this.db);
    } else {
      result = await sql`
        DELETE FROM users WHERE email = ${query}
      `.execute(this.db);
    }

    if (result.numAffectedRows === BigInt(0)) {
      throw new NotFoundException(`User with identifier ${query} not found`);
    }

    return { deleted: true };
  }

  async updateOne(query: string, updatedUser: UpdateUserDto | { password?: string }): Promise<User> {
    try {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      // Handle password update (for auth service)
      if ('password' in updatedUser && updatedUser.password) {
        // Build update query with password
        if (uuidRegex.test(query)) {
          const result = await sql<User>`
            UPDATE users 
            SET password = ${updatedUser.password}, updated_at = CURRENT_TIMESTAMP
            WHERE id = ${query}
            RETURNING *
          `.execute(this.db);
          
          if (result.rows.length === 0) {
            throw new NotFoundException(`User with identifier ${query} not found`);
          }
          return result.rows[0];
        } else {
          const result = await sql<User>`
            UPDATE users 
            SET password = ${updatedUser.password}, updated_at = CURRENT_TIMESTAMP
            WHERE email = ${query}
            RETURNING *
          `.execute(this.db);
          
          if (result.rows.length === 0) {
            throw new NotFoundException(`User with identifier ${query} not found`);
          }
          return result.rows[0];
        }
      }

      // For other updates, just update updated_at for now
      // Note: phone, address, district, city, deliver_instructions are not in the new schema
      if (uuidRegex.test(query)) {
        const result = await sql<User>`
          UPDATE users 
          SET updated_at = CURRENT_TIMESTAMP
          WHERE id = ${query}
          RETURNING *
        `.execute(this.db);
        
        if (result.rows.length === 0) {
          throw new NotFoundException(`User with identifier ${query} not found`);
        }
        return result.rows[0];
      } else {
        const result = await sql<User>`
          UPDATE users 
          SET updated_at = CURRENT_TIMESTAMP
          WHERE email = ${query}
          RETURNING *
        `.execute(this.db);
        
        if (result.rows.length === 0) {
          throw new NotFoundException(`User with identifier ${query} not found`);
        }
        return result.rows[0];
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

}
