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
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { MediaService } from 'src/media/media.service';

@Injectable()
export class UserService {
  constructor(
    private readonly db: DatabaseService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly mediaService: MediaService,
  ) {}
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
      SELECT * FROM users WHERE id = ${id} 
    `.execute(this.db);

    if (result.rows.length === 0) {
      throw new NotFoundException(`User with identifier ${id} not found`);
    }

    return result.rows[0];
  }


  async findOneEmail(email: string): Promise<User> {
    const result = await sql<User>`
      SELECT * FROM users WHERE email = ${email}
    `.execute(this.db);

    if (result.rows.length === 0) {
      throw new NotFoundException(`User with identifier ${email} not found`);
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

  async updateOne(id: number | string, updatedUser: UpdateUserDto): Promise<User> {
    try {
      const user = await this.findOne(id);
      let updateQuery = sql`UPDATE users SET updated_at = CURRENT_TIMESTAMP`;

      if (updatedUser.full_name !== undefined) {
        updateQuery = sql`${updateQuery}, full_name = ${updatedUser.full_name}`;
      }
      if (updatedUser.bio !== undefined) {
        updateQuery = sql`${updateQuery}, bio = ${updatedUser.bio}`;
      }
      if (updatedUser.profile_pic_id !== undefined) {
        updateQuery = sql`${updateQuery}, profile_pic_id = ${updatedUser.profile_pic_id}`;
      }
      if (updatedUser.cover_pic_id !== undefined) {
        updateQuery = sql`${updateQuery}, cover_pic_id = ${updatedUser.cover_pic_id}`;
      }
      if (updatedUser.password !== undefined) {
        const saltOrRounds = 10;
        const hashedPassword = await bcrypt.hash(updatedUser.password, saltOrRounds);
        updateQuery = sql`${updateQuery}, password = ${hashedPassword}`;
      }

      const result = await sql<User>`
        ${updateQuery}
        WHERE id = ${user.id}
        RETURNING *
      `.execute(this.db);

      if (result.rows.length === 0) {
        throw new NotFoundException(`User not found`);
      }
      return result.rows[0];
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  async uploadProfilePicture(userId: number, file: Express.Multer.File): Promise<User> {
    const uploadResult = await this.cloudinaryService.uploadFile(file);
    const image = await this.mediaService.create({
      url: uploadResult.secure_url,
      user_id: userId,
      type: 'profile',
    });
    return this.updateOne(userId, { profile_pic_id: image.id });
  }

  async uploadCoverPicture(userId: number, file: Express.Multer.File): Promise<User> {
    const uploadResult = await this.cloudinaryService.uploadFile(file);
    const image = await this.mediaService.create({
      url: uploadResult.secure_url,
      user_id: userId,
      type: 'cover',
    });
    return this.updateOne(userId, { cover_pic_id: image.id });
  }
}
