import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { Block, Follow, Friend } from 'src/database/database.types';
import { sql } from 'kysely';
import { NotificationService } from 'src/notification/notification.service';
import { NotificationGateway } from 'src/notification/notification.gateway';

@Injectable()
export class RelationshipService {
    constructor(
        private readonly db: DatabaseService,
        private readonly notificationService: NotificationService,
        private readonly notificationGateway: NotificationGateway
    ) { }

    // === BLOCK METHODS ===

    async blockUser(blockerId: number, blockedId: number): Promise<Block> {
        if (blockerId === blockedId) {
            throw new BadRequestException('You cannot block yourself');
        }

        await sql`
      CALL block_user(${blockerId}, ${blockedId})
    `.execute(this.db);

        const result = await sql<Block>`
            SELECT * FROM block WHERE blocker_id = ${blockerId} AND blocked_id = ${blockedId}
        `.execute(this.db);

        return result.rows[0];
    }

    async unblockUser(blockerId: number, blockedId: number): Promise<{ unblocked: boolean }> {
        const result = await sql`
      DELETE FROM block WHERE blocker_id = ${blockerId} AND blocked_id = ${blockedId}
    `.execute(this.db);

        return { unblocked: (result.numAffectedRows !== undefined && result.numAffectedRows > BigInt(0)) };
    }

    // === FOLLOW METHODS ===

    async followUser(followerId: number, followingId: number): Promise<Follow> {
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

        const notif = await this.notificationService.create({
            user_id: followingId,
            message: 'started following you.',
            type: 'follow',
            ref_id: followerId,
            ref_type: 'user',
            actor_id: followerId
        });
        this.notificationGateway.sendNotificationToUser(followingId, notif);

        return result.rows[0];
    }

    async unfollowUser(followerId: number, followingId: number): Promise<{ unfollowed: boolean }> {
        const result = await sql`
      DELETE FROM follow WHERE follower_id = ${followerId} AND following_id = ${followingId}
    `.execute(this.db);

        return { unfollowed: (result.numAffectedRows !== undefined && result.numAffectedRows > BigInt(0)) };
    }

    // === FRIEND METHODS ===

    async sendFriendRequest(userId: number, friendId: number): Promise<Friend> {
        if (userId === friendId) {
            throw new BadRequestException('You cannot friend yourself');
        }

        await sql`
      CALL send_friend_request(${userId}, ${friendId})
    `.execute(this.db);

        const result = await sql<Friend>`
            SELECT * FROM friend WHERE user_id = ${userId} AND friend_id = ${friendId}
        `.execute(this.db);

        const notif = await this.notificationService.create({
            user_id: friendId,
            message: 'sent you a friend request.',
            type: 'friend_request',
            ref_id: userId,
            ref_type: 'user',
            actor_id: userId
        });
        this.notificationGateway.sendNotificationToUser(friendId, notif);

        return result.rows[0];
    }

    async updateFriendStatus(userId: number, friendId: number, status: 'accepted' | 'rejected'): Promise<Friend> {
        if (status === 'accepted') {
            await sql`
                UPDATE friend 
                SET status = 'accepted', updated_at = CURRENT_TIMESTAMP
                WHERE (user_id = ${userId} AND friend_id = ${friendId}) 
                   OR (user_id = ${friendId} AND friend_id = ${userId})
            `.execute(this.db);
        } else {
            await sql`
                DELETE FROM friend 
                WHERE (user_id = ${userId} AND friend_id = ${friendId}) 
                   OR (user_id = ${friendId} AND friend_id = ${userId})
            `.execute(this.db);
            return null as any; 
        }

        const result = await sql<Friend>`
            SELECT * FROM friend 
            WHERE (user_id = ${userId} AND friend_id = ${friendId}) 
               OR (user_id = ${friendId} AND friend_id = ${userId})
        `.execute(this.db);

        return result.rows[0];
    }

    async removeFriend(userId: number, friendId: number): Promise<{ removed: boolean }> {
        const result = await sql`
      DELETE FROM friend 
      WHERE (user_id = ${userId} AND friend_id = ${friendId}) 
         OR (user_id = ${friendId} AND friend_id = ${userId})
    `.execute(this.db);

        return { removed: (result.numAffectedRows !== undefined && result.numAffectedRows > BigInt(0)) };
    }

    async getFriends(userId: number): Promise<any[]> {
        const result = await sql<any>`
            SELECT 
                u.id, u.username, u.full_name, u.profile_pic_id,
                f.status, f.created_at
            FROM friend f
            JOIN users u ON (f.user_id = u.id OR f.friend_id = u.id)
            WHERE (f.user_id = ${userId} OR f.friend_id = ${userId})
              AND u.id != ${userId}
              AND f.status = 'accepted'
        `.execute(this.db);
        return result.rows;
    }

    async getPendingRequests(userId: number): Promise<any[]> {
        const result = await sql<any>`
            SELECT 
                u.id, u.username, u.full_name, u.profile_pic_id,
                f.status, f.created_at
            FROM friend f
            JOIN users u ON f.user_id = u.id
            WHERE f.friend_id = ${userId}
              AND f.status = 'pending'
        `.execute(this.db);
        return result.rows;
    }

    async getBlockedUserIds(userId: number): Promise<number[]> {
        const result = await sql<{ uid: number }>`
            SELECT blocker_id AS uid FROM block WHERE blocked_id = ${userId}
            UNION
            SELECT blocked_id AS uid FROM block WHERE blocker_id = ${userId}
        `.execute(this.db);
        return result.rows.map(r => r.uid);
    }

    async isBlocked(user1Id: number, user2Id: number): Promise<boolean> {
        const result = await sql`
            SELECT 1 FROM block
            WHERE (blocker_id = ${user1Id} AND blocked_id = ${user2Id})
               OR (blocker_id = ${user2Id} AND blocked_id = ${user1Id})
        `.execute(this.db);
        return result.rows.length > 0;
    }

    async getStatus(user1Id: number, user2Id: number): Promise<{ friend_status: string | null; is_following: boolean; is_blocked: boolean; is_blocked_by_me: boolean; action_required_by: number | null }> {
        // Friend status
        const friendQuery = await sql`
            SELECT status, user_id, friend_id FROM friend 
            WHERE (user_id = ${user1Id} AND friend_id = ${user2Id}) 
               OR (user_id = ${user2Id} AND friend_id = ${user1Id})
        `.execute(this.db);
        const friendRow: any = friendQuery.rows[0];
        const friend_status = friendRow ? friendRow.status : null;
        // If pending, action_required_by is the one who didn't send the request
        const action_required_by = (friend_status === 'pending') ? friendRow.friend_id : null;

        // Follow status (is user1 following user2)
        const followQuery = await sql`
            SELECT 1 FROM follow WHERE follower_id = ${user1Id} AND following_id = ${user2Id}
        `.execute(this.db);
        const is_following = followQuery.rows.length > 0;

        // Block status (is user1 blocked by user2 OR user1 blocked user2)
        const blockQuery = await sql<{ blocker_id: number }>`
            SELECT blocker_id FROM block WHERE (blocker_id = ${user1Id} AND blocked_id = ${user2Id}) OR (blocker_id = ${user2Id} AND blocked_id = ${user1Id})
        `.execute(this.db);
        const is_blocked = blockQuery.rows.length > 0;
        const is_blocked_by_me = blockQuery.rows.length > 0 && blockQuery.rows[0].blocker_id === user1Id;

        return { friend_status, is_following, is_blocked, is_blocked_by_me, action_required_by };
    }
}
