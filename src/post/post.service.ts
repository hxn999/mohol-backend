import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { Post, NewPost, PostUpdate, Comment, NewComment, LikesPost, Shares } from 'src/database/database.types';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { sql } from 'kysely';

import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { MediaService } from 'src/media/media.service';
import { NotificationService } from 'src/notification/notification.service';
import { NotificationGateway } from 'src/notification/notification.gateway';
import { RelationshipService } from 'src/relationship/relationship.service';

@Injectable()
export class PostService {
    constructor(
        private readonly db: DatabaseService,
        private readonly cloudinaryService: CloudinaryService,
        private readonly mediaService: MediaService,
        private readonly notificationService: NotificationService,
        private readonly notificationGateway: NotificationGateway,
        private readonly relationshipService: RelationshipService
    ) { }

    async create(createPostDto: CreatePostDto): Promise<Post> {
        await sql<Post>`
      CALL create_post(
        ${createPostDto.user_id},
        ${createPostDto.body || null},
        ${createPostDto.group_id || null},
        ${createPostDto.type || 'text'},
        ${createPostDto.visibility || 'public'}
      )
    `.execute(this.db);

        // For procedures, we might not get RETURNING * directly depending on how they are written.
        // But the user asked to "directly implement" using these procedures.
        // Assuming the procedure manages the data. 
        // We'll try to find the post if it was created, or just return a dummy if it's just a seed call.
        // However, the original code returned the post.
        
        const lastPostResult = await sql<Post>`
            SELECT * FROM post 
            WHERE user_id = ${createPostDto.user_id} 
            ORDER BY created_at DESC LIMIT 1
        `.execute(this.db);

        const createdPost = lastPostResult.rows[0];

        if (createdPost && createPostDto.tags && createPostDto.tags.length > 0) {
            for (const tagUserId of createPostDto.tags) {
                await sql`
                    INSERT INTO tags_post (post_id, user_id)
                    VALUES (${createdPost.id}, ${tagUserId})
                    ON CONFLICT DO NOTHING
                `.execute(this.db);
            }
        }

        return createdPost;
    }

    async createWithMedia(createPostDto: CreatePostDto, files: Express.Multer.File[]): Promise<Post> {
        const post = await this.create(createPostDto);

        if (files && files.length > 0) {
            const uploadResults = await this.cloudinaryService.uploadMultiple(files);
            for (const result of uploadResults) {
                if (result && 'secure_url' in result) {
                    await this.mediaService.create({
                        url: result.secure_url,
                        post_id: post.id,
                        user_id: post.user_id,
                        type: 'post'
                    });
                }
            }
        }

        return post;
    }

    async findAll(userId?: number): Promise<Post[]> {
        const blockedIds = userId ? await this.relationshipService.getBlockedUserIds(userId) : [];
        const blockedList = blockedIds.length > 0 ? blockedIds : [0];
        const result = await sql<Post>`
            SELECT 
                p.*,
                u.username,
                u.full_name,
                u.profile_pic_id,
                (SELECT json_agg(json_build_object('id', id, 'url', url)) FROM image WHERE post_id = p.id) as images,
                (SELECT id FROM image WHERE post_id = p.id LIMIT 1) as image_id,
                (SELECT COUNT(*)::int FROM likes_post WHERE post_id = p.id) as likes_count,
                (SELECT COUNT(*)::int FROM comment WHERE post_id = p.id) as comments_count,
                (SELECT COUNT(*)::int FROM shares WHERE post_id = p.id) as shares_count,
                COALESCE((SELECT json_agg(json_build_object('id', tu.id, 'username', tu.username, 'full_name', tu.full_name)) FROM tags_post tp JOIN users tu ON tp.user_id = tu.id WHERE tp.post_id = p.id), '[]'::json) as tags,
                op.body as original_post_body,
                op.created_at as original_post_created_at,
                ou.id as original_author_id,
                ou.username as original_author_username,
                ou.full_name as original_author_full_name,
                ou.profile_pic_id as original_author_pfp_id,
                g.title as group_name,
                g.cover_img_id as group_cover_id,
                EXISTS(SELECT 1 FROM likes_post WHERE post_id = p.id AND user_id = ${userId || 0}) as is_liked_by_me
            FROM post p
            JOIN users u ON p.user_id = u.id
            LEFT JOIN post op ON p.original_post_id = op.id
            LEFT JOIN users ou ON op.user_id = ou.id
            LEFT JOIN groups g ON p.group_id = g.id
            WHERE p.user_id != ALL(${sql`ARRAY[${sql.join(blockedList.map(id => sql`${id}`), sql`,`)}]::int[]`})
            ORDER BY p.created_at DESC
        `.execute(this.db);
        return result.rows;
    }

    async getRecommendations(userId: number): Promise<Post[]> {
        const blockedIds = await this.relationshipService.getBlockedUserIds(userId);
        const blockedList = blockedIds.length > 0 ? blockedIds : [0];
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
            SELECT 
                p.*,
                u.username,
                u.full_name,
                u.profile_pic_id,
                (SELECT json_agg(json_build_object('id', id, 'url', url)) FROM image WHERE post_id = p.id) as images,
                (SELECT id FROM image WHERE post_id = p.id LIMIT 1) as image_id,
                (SELECT COUNT(*)::int FROM likes_post WHERE post_id = p.id) as likes_count,
                (SELECT COUNT(*)::int FROM comment WHERE post_id = p.id) as comments_count,
                (SELECT COUNT(*)::int FROM shares WHERE post_id = p.id) as shares_count,
                COALESCE((SELECT json_agg(json_build_object('id', tu.id, 'username', tu.username, 'full_name', tu.full_name)) FROM tags_post tp JOIN users tu ON tp.user_id = tu.id WHERE tp.post_id = p.id), '[]'::json) as tags,
                op.body as original_post_body,
                op.created_at as original_post_created_at,
                ou.id as original_author_id,
                ou.username as original_author_username,
                ou.full_name as original_author_full_name,
                ou.profile_pic_id as original_author_pfp_id,
                g.title as group_name,
                g.cover_img_id as group_cover_id,
                EXISTS(SELECT 1 FROM likes_post WHERE post_id = p.id AND user_id = ${userId || 0}) as is_liked_by_me,
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
            JOIN users u ON p.user_id = u.id
            LEFT JOIN post op ON p.original_post_id = op.id
            LEFT JOIN users ou ON op.user_id = ou.id
            LEFT JOIN groups g ON p.group_id = g.id
            LEFT JOIN user_friends uf ON p.user_id = uf.friend_id
            LEFT JOIN user_interactions ui ON p.user_id = ui.interacted_user_id
            WHERE 
                p.status = 'active'
                AND p.user_id != ALL(${sql`ARRAY[${sql.join(blockedList.map(id => sql`${id}`), sql`,`)}]::int[]`})
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
    
    async findByGroupId(groupId: number, userId?: number): Promise<Post[]> {
        const blockedIds = userId ? await this.relationshipService.getBlockedUserIds(userId) : [];
        const blockedList = blockedIds.length > 0 ? blockedIds : [0];
        const result = await sql<any>`
            SELECT 
                p.*,
                u.username,
                u.full_name,
                u.profile_pic_id,
                (SELECT json_agg(json_build_object('id', id, 'url', url)) FROM image WHERE post_id = p.id) as images,
                (SELECT id FROM image WHERE post_id = p.id LIMIT 1) as image_id,
                (SELECT COUNT(*)::int FROM likes_post WHERE post_id = p.id) as likes_count,
                (SELECT COUNT(*)::int FROM comment WHERE post_id = p.id) as comments_count,
                (SELECT COUNT(*)::int FROM shares WHERE post_id = p.id) as shares_count,
                COALESCE((SELECT json_agg(json_build_object('id', tu.id, 'username', tu.username, 'full_name', tu.full_name)) FROM tags_post tp JOIN users tu ON tp.user_id = tu.id WHERE tp.post_id = p.id), '[]'::json) as tags,
                op.body as original_post_body,
                op.created_at as original_post_created_at,
                ou.id as original_author_id,
                ou.username as original_author_username,
                ou.full_name as original_author_full_name,
                ou.profile_pic_id as original_author_pfp_id,
                g.title as group_name,
                g.cover_img_id as group_cover_id,
                EXISTS(SELECT 1 FROM likes_post WHERE post_id = p.id AND user_id = ${userId || 0}) as is_liked_by_me
            FROM post p
            JOIN users u ON p.user_id = u.id
            LEFT JOIN post op ON p.original_post_id = op.id
            LEFT JOIN users ou ON op.user_id = ou.id
            LEFT JOIN groups g ON p.group_id = g.id
            WHERE p.group_id = ${groupId} 
              AND p.status = 'active'
              AND p.user_id != ALL(${sql`ARRAY[${sql.join(blockedList.map(id => sql`${id}`), sql`,`)}]::int[]`})
            ORDER BY p.created_at DESC
        `.execute(this.db);
        return result.rows;
    }

    async findOne(id: number, userId?: number): Promise<Post> {
        const result = await sql<Post>`
            SELECT 
                p.*,
                u.username,
                u.full_name,
                u.profile_pic_id,
                (SELECT json_agg(json_build_object('id', id, 'url', url)) FROM image WHERE post_id = p.id) as images,
                (SELECT id FROM image WHERE post_id = p.id LIMIT 1) as image_id,
                (SELECT COUNT(*)::int FROM likes_post WHERE post_id = p.id) as likes_count,
                (SELECT COUNT(*)::int FROM comment WHERE post_id = p.id) as comments_count,
                (SELECT COUNT(*)::int FROM shares WHERE post_id = p.id) as shares_count,
                COALESCE((SELECT json_agg(json_build_object('id', tu.id, 'username', tu.username, 'full_name', tu.full_name)) FROM tags_post tp JOIN users tu ON tp.user_id = tu.id WHERE tp.post_id = p.id), '[]'::json) as tags,
                op.body as original_post_body,
                op.created_at as original_post_created_at,
                ou.id as original_author_id,
                ou.username as original_author_username,
                ou.full_name as original_author_full_name,
                ou.profile_pic_id as original_author_pfp_id,
                g.title as group_name,
                g.cover_img_id as group_cover_id,
                EXISTS(SELECT 1 FROM likes_post WHERE post_id = p.id AND user_id = ${userId || 0}) as is_liked_by_me
            FROM post p
            JOIN users u ON p.user_id = u.id
            LEFT JOIN post op ON p.original_post_id = op.id
            LEFT JOIN users ou ON op.user_id = ou.id
            LEFT JOIN groups g ON p.group_id = g.id
            WHERE p.id = ${id}
        `.execute(this.db);

        if (result.rows.length === 0) {
            throw new NotFoundException(`Post with ID ${id} not found`);
        }

        return result.rows[0];
    }

    async update(id: number, updatePostDto: UpdatePostDto): Promise<Post> {
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

    async remove(id: number): Promise<{ deleted: boolean }> {
        const post = await this.findOne(id);
        
        await sql`
      CALL delete_post(${post.user_id}, ${id})
    `.execute(this.db);

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

        const comment = result.rows[0];

        // Notify post owner
        const post = await this.findOne(createCommentDto.post_id);
        if (post && post.user_id !== createCommentDto.user_id) {
            const notif = await this.notificationService.create({
                user_id: post.user_id,
                message: 'commented on your post.',
                type: 'comment',
                ref_id: post.id,
                ref_type: 'post',
                actor_id: createCommentDto.user_id
            });
            this.notificationGateway.sendNotificationToUser(post.user_id, notif);
        }

        return comment;
    }

    async findCommentsByPost(postId: number, userId?: number): Promise<Comment[]> {
        const blockedIds = userId ? await this.relationshipService.getBlockedUserIds(userId) : [];
        const blockedList = blockedIds.length > 0 ? blockedIds : [0];
        const result = await sql<Comment>`
      SELECT * FROM comment WHERE post_id = ${postId}
        AND user_id != ALL(${sql`ARRAY[${sql.join(blockedList.map(id => sql`${id}`), sql`,`)}]::int[]`})
      ORDER BY created_at ASC
    `.execute(this.db);
        return result.rows;
    }

    async updateComment(id: number, updateCommentDto: UpdateCommentDto): Promise<Comment> {
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

    async removeComment(id: number): Promise<{ deleted: boolean }> {
        const result = await sql`
      DELETE FROM comment WHERE id = ${id}
    `.execute(this.db);

        if (result.numAffectedRows === undefined || result.numAffectedRows === BigInt(0)) {
            throw new NotFoundException(`Comment with ID ${id} not found`);
        }

        return { deleted: true };
    }

    // === LIKE METHODS ===

    async likePost(userId: number, postId: number): Promise<LikesPost> {
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

        // Notify post owner
        const post = await this.findOne(postId);
        if (post && post.user_id !== userId) {
            const notif = await this.notificationService.create({
                user_id: post.user_id,
                message: 'liked your post.',
                type: 'like',
                ref_id: post.id,
                ref_type: 'post',
                actor_id: userId
            });
            this.notificationGateway.sendNotificationToUser(post.user_id, notif);
        }

        return result.rows[0];
    }

    async unlikePost(userId: number, postId: number): Promise<{ unliked: boolean }> {
        const result = await sql`
      DELETE FROM likes_post WHERE user_id = ${userId} AND post_id = ${postId}
    `.execute(this.db);

        return { unliked: result.numAffectedRows !== undefined && result.numAffectedRows > BigInt(0) };
    }

    // === SHARE METHODS ===

    async sharePost(userId: number, postId: number, bodyText: string = ''): Promise<Shares> {
        await sql`
      CALL share_post(${userId}, ${postId})
    `.execute(this.db);

        // Additionally create a post record to show on timeline with the body text
        await this.create({
            user_id: userId,
            original_post_id: postId,
            type: 'share',
            body: bodyText,
            visibility: 'public'
        });

        const result = await sql<Shares>`
            SELECT * FROM shares WHERE user_id = ${userId} AND post_id = ${postId}
        `.execute(this.db);

        // Notify post owner
        const post = await this.findOne(postId);
        if (post && post.user_id !== userId) {
            const notif = await this.notificationService.create({
                user_id: post.user_id,
                message: 'shared your post.',
                type: 'post_share',
                ref_id: post.id,
                ref_type: 'post',
                actor_id: userId
            });
            this.notificationGateway.sendNotificationToUser(post.user_id, notif);
        }

        return result.rows[0];
    }

    // === LIKERS LIST ===

    async getPostLikers(postId: number): Promise<any[]> {
        const result = await sql<any>`
            SELECT u.id, u.username, u.full_name, u.profile_pic_id
            FROM likes_post lp
            JOIN users u ON lp.user_id = u.id
            WHERE lp.post_id = ${postId}
            ORDER BY lp.created_at DESC
        `.execute(this.db);
        return result.rows;
    }
}
