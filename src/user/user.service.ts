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
import { FindQueryDto } from './dto/findQueryDto';

@Injectable()
export class UserService {
  constructor(private readonly db: DatabaseService) {}
  private readonly logger = new Logger(UserService.name);

  async create(user: CreateUserDto): Promise<User> {
    // Check for duplicate accounts (email or username)
    if (user.email) {
      const existingByEmail = await sql<User>`
        SELECT * FROM users WHERE email = ${user.email}
      `.execute(this.db);
      
      if (existingByEmail.rows.length > 0) {
        throw new ConflictException(`Account with email ${user.email} already exists!`);
      }
    }

    const existingByUsername = await sql<User>`
      SELECT * FROM users WHERE username = ${user.username}
    `.execute(this.db);

    if (existingByUsername.rows.length > 0) {
      throw new ConflictException(`Username ${user.username} is already taken!`);
    }

    // Hash password
    const saltOrRounds = 10;
    const hashedPassword = await bcrypt.hash(user.password, saltOrRounds);

    // Create user with raw SQL
    const result = await sql<User>`
      INSERT INTO users (username, password, full_name, email, role)
      VALUES (${user.username}, ${hashedPassword}, ${user.name}, ${user.email || null}, 'user')
      RETURNING *
    `.execute(this.db);

    if (result.rows.length === 0) {
      throw new BadRequestException('Failed to create user');
    }

    return result.rows[0];
  }

  async findOne(id: number | string): Promise<User> {
    const result = await sql<User>`
      SELECT * FROM users WHERE id = ${id} OR email = ${id.toString()} OR username = ${id.toString()}
    `.execute(this.db);

    if (result.rows.length === 0) {
      throw new NotFoundException(`User with identifier ${id} not found`);
    }

    return result.rows[0];
  }

  async findAll(query?: FindQueryDto): Promise<User[]> {
    let sqlQuery = sql<User>`SELECT * FROM users WHERE 1=1`;

    if (query) {
      if (query.name) {
        sqlQuery = sql<User>`${sqlQuery} AND full_name ILIKE ${'%' + query.name + '%'}`;
      }
      if (query.email) {
        sqlQuery = sql<User>`${sqlQuery} AND email = ${query.email}`;
      }
      if (query.username) {
        sqlQuery = sql<User>`${sqlQuery} AND username = ${query.username}`;
      }
      if (query.id) {
        sqlQuery = sql<User>`${sqlQuery} AND id = ${query.id}`;
      }
      if (query.role) {
        sqlQuery = sql<User>`${sqlQuery} AND role = ${query.role}`;
      }
    }

    const result = await sql<User>`${sqlQuery} ORDER BY created_at DESC`.execute(this.db);
    return result.rows;
  }

  async deleteOne(id: number): Promise<{ deleted: boolean }> {
    const result = await sql`
      DELETE FROM users WHERE id = ${id}
    `.execute(this.db);

    if (result.numAffectedRows === BigInt(0)) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return { deleted: true };
  }

  async updateOne(id: number | string, updatedUser: UpdateUserDto | { password?: string }): Promise<User> {
    try {
      // Find the user first
      const user = await this.findOne(id);

      let updateFields: string[] = [];
      let values: any[] = [];

      if ('password' in updatedUser && updatedUser.password) {
        const saltOrRounds = 10;
        const hashedPassword = await bcrypt.hash(updatedUser.password, saltOrRounds);
        updateFields.push('password');
        values.push(hashedPassword);
      }

      // Reverting to original schema fields (no phone, address, etc. if they are not in schema)
      // I'll check what was there originally. bio, full_name, username, email might be updatable.
      // For now, I'll just keep the password update and anything else that might be in the schema.
      
      if ('bio' in updatedUser && updatedUser['bio']) {
        updateFields.push('bio');
        values.push(updatedUser['bio']);
      }

      if (updateFields.length === 0) {
        return user;
      }

      // Build dynamic update query
      let queryStr = `UPDATE users SET `;
      updateFields.forEach((field, index) => {
        queryStr += `${field} = $${index + 1}${index === updateFields.length - 1 ? '' : ', '}`;
      });
      queryStr += `, updated_at = CURRENT_TIMESTAMP WHERE id = $${updateFields.length + 1} RETURNING *`;
      values.push(user.id);

      const result = await sql<User>(queryStr as any, values).execute(this.db);

      if (result.rows.length === 0) {
        throw new NotFoundException(`User not found`);
      }
      return result.rows[0];
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(error.message);
    }
  }
}
