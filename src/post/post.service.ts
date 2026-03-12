import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { Post, NewPost, PostUpdate, Comment, NewComment, LikesPost, Shares } from 'src/database/database.types';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { sql } from 'kysely';

@Injectable()
export class PostService {
    constructor(private readonly db: DatabaseService) { }

    async create(createPostDto: CreatePostDto): Promise<Post> {
        const result = await sql<Post>`
      INSERT INTO post (body, user_id, group_id, original_post_id, type, visibility, status)
      VALUES (
        ${createPostDto.body || null},
        ${createPostDto.user_id},
        ${createPostDto.group_id || null},
        ${createPostDto.original_post_id || null},
        ${createPostDto.type || 'text'},
        ${createPostDto.visibility || 'public'},
        ${createPostDto.status || 'active'}
      )
      RETURNING *
    `.execute(this.db);

        if (result.rows.length === 0) {
            throw new BadRequestException('Failed to create post');
        }

        return result.rows[0];
    }

    async findAll(): Promise<Post[]> {
        const result = await sql<Post>`
      SELECT * FROM post ORDER BY created_at DESC
    `.execute(this.db);
        return result.rows;
    }

    async findOne(id: string): Promise<Post> {
        const result = await sql<Post>`
      SELECT * FROM post WHERE id = ${id}
    `.execute(this.db);

        if (result.rows.length === 0) {
            throw new NotFoundException(`Post with ID ${id} not found`);
        }

        return result.rows[0];
    }

    async update(id: string, updatePostDto: UpdatePostDto): Promise<Post> {
        // Note: Kysely sql template literals are great for raw SQL, 
        // but for dynamic updates we might want to use the Kysely builder if it was more integrated.
        // However, staying consistent with the existing UserService pattern:

        let updateQuery = sql`UPDATE post SET updated_at = CURRENT_TIMESTAMP`;

        if (updatePostDto.body !== undefined) {
            updateQuery = sql`${updateQuery}, body = ${updatePostDto.body}`;
        }
        if (updatePostDto.visibility !== undefined) {
            updateQuery = sql`${updateQuery}, visibility = ${updatePostDto.visibility}`;
        }
        if (updatePostDto.status !== undefined) {
            updateQuery = sql`${updateQuery}, status = ${updatePostDto.status}`;
        }

        const result = await sql<Post>`
      ${updateQuery}
      WHERE id = ${id}
      RETURNING *
    `.execute(this.db);

        if (result.rows.length === 0) {
            throw new NotFoundException(`Post with ID ${id} not found`);
        }

        return result.rows[0];
    }

    async remove(id: string): Promise<{ deleted: boolean }> {
        const result = await sql`
      DELETE FROM post WHERE id = ${id}
    `.execute(this.db);

        if (result.numAffectedRows === undefined || result.numAffectedRows === BigInt(0)) {
            throw new NotFoundException(`Post with ID ${id} not found`);
        }

        return { deleted: true };
    }

    // === COMMENT METHODS ===

    async createComment(createCommentDto: CreateCommentDto): Promise<Comment> {
        const result = await sql<Comment>`
      INSERT INTO comment (post_id, user_id, parent_id, comment)
      VALUES (
        ${createCommentDto.post_id},
        ${createCommentDto.user_id},
        ${createCommentDto.parent_id || null},
        ${createCommentDto.comment}
      )
      RETURNING *
    `.execute(this.db);

        if (result.rows.length === 0) {
            throw new BadRequestException('Failed to create comment');
        }

        return result.rows[0];
    }

    async findCommentsByPost(postId: string): Promise<Comment[]> {
        const result = await sql<Comment>`
      SELECT * FROM comment WHERE post_id = ${postId} ORDER BY created_at ASC
    `.execute(this.db);
        return result.rows;
    }

    async updateComment(id: string, updateCommentDto: UpdateCommentDto): Promise<Comment> {
        const result = await sql<Comment>`
      UPDATE comment 
      SET comment = ${updateCommentDto.comment}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `.execute(this.db);

        if (result.rows.length === 0) {
            throw new NotFoundException(`Comment with ID ${id} not found`);
        }

        return result.rows[0];
    }

    async removeComment(id: string): Promise<{ deleted: boolean }> {
        const result = await sql`
      DELETE FROM comment WHERE id = ${id}
    `.execute(this.db);

        if (result.numAffectedRows === undefined || result.numAffectedRows === BigInt(0)) {
            throw new NotFoundException(`Comment with ID ${id} not found`);
        }

        return { deleted: true };
    }

    // === LIKE METHODS ===

    async likePost(userId: string, postId: string): Promise<LikesPost> {
        const result = await sql<LikesPost>`
      INSERT INTO likes_post (user_id, post_id)
      VALUES (${userId}, ${postId})
      ON CONFLICT (user_id, post_id) DO NOTHING
      RETURNING *
    `.execute(this.db);

        if (result.rows.length === 0) {
            // Already liked, fetch existing or just return
            const existing = await sql<LikesPost>`
        SELECT * FROM likes_post WHERE user_id = ${userId} AND post_id = ${postId}
      `.execute(this.db);
            return existing.rows[0];
        }

        return result.rows[0];
    }

    async unlikePost(userId: string, postId: string): Promise<{ unliked: boolean }> {
        const result = await sql`
      DELETE FROM likes_post WHERE user_id = ${userId} AND post_id = ${postId}
    `.execute(this.db);

        return { unliked: result.numAffectedRows !== undefined && result.numAffectedRows > BigInt(0) };
    }

    // === SHARE METHODS ===

    async sharePost(userId: string, postId: string): Promise<Shares> {
        const result = await sql<Shares>`
      INSERT INTO shares (user_id, post_id)
      VALUES (${userId}, ${postId})
      ON CONFLICT (user_id, post_id) DO NOTHING
      RETURNING *
    `.execute(this.db);

        if (result.rows.length === 0) {
            const existing = await sql<Shares>`
        SELECT * FROM shares WHERE user_id = ${userId} AND post_id = ${postId}
      `.execute(this.db);
            return existing.rows[0];
        }

        return result.rows[0];
    }
}
