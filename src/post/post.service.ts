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

    async getRecommendations(userId: string): Promise<Post[]> {
        const result = await sql<Post>`
            WITH user_friends AS (
                SELECT 
                    CASE WHEN user_id = ${userId} THEN friend_id ELSE user_id END AS friend_id,
                    created_at
                FROM friend
                WHERE (user_id = ${userId} OR friend_id = ${userId}) 
                  AND status = 'accepted'
            ),
            user_groups AS (
                SELECT group_id
                FROM membership
                WHERE user_id = ${userId}
            ),
            user_interactions AS (
                SELECT interacted_user_id, count(*) AS interaction_score
                FROM (
                    SELECT p.user_id AS interacted_user_id FROM likes_post lp JOIN post p ON lp.post_id = p.id WHERE lp.user_id = ${userId}
                    UNION ALL
                    SELECT p.user_id AS interacted_user_id FROM comment c JOIN post p ON c.post_id = p.id WHERE c.user_id = ${userId}
                    UNION ALL
                    SELECT p.user_id AS interacted_user_id FROM shares s JOIN post p ON s.post_id = p.id WHERE s.user_id = ${userId}
                ) interactions
                GROUP BY interacted_user_id
            )
            SELECT p.*,
                (
                    -- New Friend Boost (within 7 days)
                    (CASE WHEN uf.friend_id IS NOT NULL AND uf.created_at > (CURRENT_TIMESTAMP - INTERVAL '7 days') THEN 50 ELSE 0 END) +
                    -- Friend Boost
                    (CASE WHEN uf.friend_id IS NOT NULL THEN 30 ELSE 0 END) +
                    -- Interaction Boost
                    (COALESCE(ui.interaction_score, 0) * 5) +
                    -- Recency Boost (within 1 day)
                    (CASE WHEN p.created_at > (CURRENT_TIMESTAMP - INTERVAL '1 day') THEN 20 ELSE 0 END)
                ) AS recommendation_score
            FROM post p
            LEFT JOIN user_friends uf ON p.user_id = uf.friend_id
            LEFT JOIN user_interactions ui ON p.user_id = ui.interacted_user_id
            WHERE 
                p.status = 'active'
                AND (
                    p.user_id = ${userId}
                    OR p.visibility = 'public'
                    OR (p.visibility = 'friends_only' AND uf.friend_id IS NOT NULL)
                    OR (p.visibility = 'group_only' AND p.group_id IN (SELECT group_id FROM user_groups))
                )
            ORDER BY recommendation_score DESC, p.created_at DESC
            LIMIT 50
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
