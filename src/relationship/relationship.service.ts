import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { Block, Follow, Friend } from 'src/database/database.types';
import { sql } from 'kysely';

@Injectable()
export class RelationshipService {
    constructor(private readonly db: DatabaseService) { }

    // === BLOCK METHODS ===

    async blockUser(blockerId: string, blockedId: string): Promise<Block> {
        if (blockerId === blockedId) {
            throw new BadRequestException('You cannot block yourself');
        }

        const result = await sql<Block>`
      INSERT INTO block (blocker_id, blocked_id)
      VALUES (${blockerId}, ${blockedId})
      ON CONFLICT (blocker_id, blocked_id) DO NOTHING
      RETURNING *
    `.execute(this.db);

        if (result.rows.length === 0) {
            const existing = await sql<Block>`
        SELECT * FROM block WHERE blocker_id = ${blockerId} AND blocked_id = ${blockedId}
      `.execute(this.db);
            return existing.rows[0];
        }

        return result.rows[0];
    }

    async unblockUser(blockerId: string, blockedId: string): Promise<{ unblocked: boolean }> {
        const result = await sql`
      DELETE FROM block WHERE blocker_id = ${blockerId} AND blocked_id = ${blockedId}
    `.execute(this.db);

        return { unblocked: (result.numAffectedRows !== undefined && result.numAffectedRows > BigInt(0)) };
    }

    // === FOLLOW METHODS ===

    async followUser(followerId: string, followingId: string): Promise<Follow> {
        if (followerId === followingId) {
            throw new BadRequestException('You cannot follow yourself');
        }

        const result = await sql<Follow>`
      INSERT INTO follow (follower_id, following_id)
      VALUES (${followerId}, ${followingId})
      ON CONFLICT (follower_id, following_id) DO NOTHING
      RETURNING *
    `.execute(this.db);

        if (result.rows.length === 0) {
            const existing = await sql<Follow>`
        SELECT * FROM follow WHERE follower_id = ${followerId} AND following_id = ${followingId}
      `.execute(this.db);
            return existing.rows[0];
        }

        return result.rows[0];
    }

    async unfollowUser(followerId: string, followingId: string): Promise<{ unfollowed: boolean }> {
        const result = await sql`
      DELETE FROM follow WHERE follower_id = ${followerId} AND following_id = ${followingId}
    `.execute(this.db);

        return { unfollowed: (result.numAffectedRows !== undefined && result.numAffectedRows > BigInt(0)) };
    }

    // === FRIEND METHODS ===

    async sendFriendRequest(userId: string, friendId: string): Promise<Friend> {
        if (userId === friendId) {
            throw new BadRequestException('You cannot friend yourself');
        }

        const result = await sql<Friend>`
      INSERT INTO friend (user_id, friend_id, status)
      VALUES (${userId}, ${friendId}, 'pending')
      ON CONFLICT (user_id, friend_id) DO NOTHING
      RETURNING *
    `.execute(this.db);

        if (result.rows.length === 0) {
            const existing = await sql<Friend>`
        SELECT * FROM friend WHERE user_id = ${userId} AND friend_id = ${friendId}
      `.execute(this.db);
            return existing.rows[0];
        }

        return result.rows[0];
    }

    async updateFriendStatus(userId: string, friendId: string, status: 'accepted' | 'rejected'): Promise<Friend> {
        const result = await sql<Friend>`
      UPDATE friend 
      SET status = ${status}, updated_at = CURRENT_TIMESTAMP
      WHERE (user_id = ${userId} AND friend_id = ${friendId}) 
         OR (user_id = ${friendId} AND friend_id = ${userId})
      RETURNING *
    `.execute(this.db);

        if (result.rows.length === 0) {
            throw new NotFoundException('Friend relationship not found');
        }

        return result.rows[0];
    }

    async removeFriend(userId: string, friendId: string): Promise<{ removed: boolean }> {
        const result = await sql`
      DELETE FROM friend 
      WHERE (user_id = ${userId} AND friend_id = ${friendId}) 
         OR (user_id = ${friendId} AND friend_id = ${userId})
    `.execute(this.db);

        return { removed: (result.numAffectedRows !== undefined && result.numAffectedRows > BigInt(0)) };
    }
}
