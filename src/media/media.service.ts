import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { Image, NewImage, TagsImage } from 'src/database/database.types';
import { CreateImageDto } from './dto/create-image.dto';
import { sql } from 'kysely';

@Injectable()
export class MediaService {
    constructor(private readonly db: DatabaseService) { }

    async create(createImageDto: CreateImageDto): Promise<Image> {
        const result = await sql<Image>`
      INSERT INTO image (url, post_id, user_id, type)
      VALUES (${createImageDto.url}, ${createImageDto.post_id || null}, ${createImageDto.user_id || null}, ${createImageDto.type})
      RETURNING *
    `.execute(this.db);

        if (result.rows.length === 0) {
            throw new BadRequestException('Failed to create image record');
        }

        return result.rows[0];
    }

    async findAll(): Promise<Image[]> {
        const result = await sql<Image>`
      SELECT * FROM image ORDER BY created_at DESC
    `.execute(this.db);
        return result.rows;
    }

    async findOne(id: string): Promise<Image> {
        const result = await sql<Image>`
      SELECT * FROM image WHERE id = ${id}
    `.execute(this.db);

        if (result.rows.length === 0) {
            throw new NotFoundException(`Image with ID ${id} not found`);
        }

        return result.rows[0];
    }

    async remove(id: string): Promise<{ deleted: boolean }> {
        const result = await sql`
      DELETE FROM image WHERE id = ${id}
    `.execute(this.db);

        if (result.numAffectedRows === undefined || result.numAffectedRows === BigInt(0)) {
            throw new NotFoundException(`Image with ID ${id} not found`);
        }

        return { deleted: true };
    }

    // === IMAGE TAGS ===

    async tagUser(imageId: string, userId: string): Promise<TagsImage> {
        const result = await sql<TagsImage>`
      INSERT INTO tags_image (image_id, user_id)
      VALUES (${imageId}, ${userId})
      ON CONFLICT (image_id, user_id) DO NOTHING
      RETURNING *
    `.execute(this.db);

        if (result.rows.length === 0) {
            const existing = await sql<TagsImage>`
        SELECT * FROM tags_image WHERE image_id = ${imageId} AND user_id = ${userId}
      `.execute(this.db);
            return existing.rows[0];
        }

        return result.rows[0];
    }

    async untagUser(imageId: string, userId: string): Promise<{ untagged: boolean }> {
        const result = await sql`
      DELETE FROM tags_image WHERE image_id = ${imageId} AND user_id = ${userId}
    `.execute(this.db);

        return { untagged: (result.numAffectedRows !== undefined && result.numAffectedRows > BigInt(0)) };
    }

    async findTagsByImage(imageId: string): Promise<TagsImage[]> {
        const result = await sql<TagsImage>`
      SELECT * FROM tags_image WHERE image_id = ${imageId}
    `.execute(this.db);
        return result.rows;
    }
}
