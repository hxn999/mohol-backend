import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { Group, NewGroup, GroupUpdate, Membership, NewMembership } from 'src/database/database.types';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { sql } from 'kysely';
import { NotificationService } from 'src/notification/notification.service';
import { NotificationGateway } from 'src/notification/notification.gateway';

@Injectable()
export class GroupService {
    
    constructor(
        private readonly db: DatabaseService,
        private readonly notificationService: NotificationService,
        private readonly notificationGateway: NotificationGateway
    ) { }
                                                                                                                          
    async create(createGroupDto: CreateGroupDto & { creator_id: number }): Promise<Group> {
        const result = await sql<Group>`
      INSERT INTO groups (title, description, cover_img_id, visibility)
      VALUES (
        ${createGroupDto.title},
        ${createGroupDto.description || null},
        ${createGroupDto.cover_img_id || null},
        ${createGroupDto.visibility || 'public'}
      )
      RETURNING *
    `.execute(this.db);

        if (result.rows.length === 0) {
            throw new BadRequestException('Failed to create group');
        }

        const group = result.rows[0];

        // Automatically add creator as owner
        await sql`
            INSERT INTO membership (user_id, group_id, role)
            VALUES (${createGroupDto.creator_id}, ${group.id}, 'owner')
        `.execute(this.db);

        return group;
    }

    async findUserGroups(userId: number): Promise<Group[]> {
        const result = await sql<Group>`
            SELECT g.* FROM groups g
            JOIN membership m ON g.id = m.group_id
            WHERE m.user_id = ${userId}
            ORDER BY m.created_at DESC
        `.execute(this.db);
        return result.rows;
    }

    async findAll(): Promise<Group[]> {
        const result = await sql<Group>`
            SELECT * FROM groups ORDER BY created_at DESC
        `.execute(this.db);
        return result.rows;
    }

    async findOne(id: number): Promise<Group> {
        const result = await sql<Group>`
      SELECT * FROM groups WHERE id = ${id}
    `.execute(this.db);

        if (result.rows.length === 0) {
            throw new NotFoundException(`Group with ID ${id} not found`);
        }

        return result.rows[0];
    }

    async update(id: number, updateGroupDto: UpdateGroupDto): Promise<Group> {
        let updateQuery = sql`UPDATE groups SET updated_at = CURRENT_TIMESTAMP`;

        if (updateGroupDto.title !== undefined) {
            updateQuery = sql`${updateQuery}, title = ${updateGroupDto.title}`;
        }
        if (updateGroupDto.description !== undefined) {
            updateQuery = sql`${updateQuery}, description = ${updateGroupDto.description}`;
        }
        if (updateGroupDto.cover_img_id !== undefined) {
            updateQuery = sql`${updateQuery}, cover_img_id = ${updateGroupDto.cover_img_id}`;
        }
        if (updateGroupDto.visibility !== undefined) {
            updateQuery = sql`${updateQuery}, visibility = ${updateGroupDto.visibility}`;
        }

        const result = await sql<Group>`
      ${updateQuery}
      WHERE id = ${id}
      RETURNING *
    `.execute(this.db);

        if (result.rows.length === 0) {
            throw new NotFoundException(`Group with ID ${id} not found`);
        }

        return result.rows[0];
    }

    async remove(id: number): Promise<{ deleted: boolean }> {
        const result = await sql`
      DELETE FROM groups WHERE id = ${id}
    `.execute(this.db);

        if (result.numAffectedRows === undefined || result.numAffectedRows === BigInt(0)) {
            throw new NotFoundException(`Group with ID ${id} not found`);
        }

        return { deleted: true };
    }

    // === MEMBERSHIP METHODS ===

    async addMember(groupId: number, addMemberDto: AddMemberDto): Promise<Membership> {
        await sql`
      CALL join_group(${addMemberDto.user_id}, ${groupId})
    `.execute(this.db);

        const result = await sql<Membership>`
            SELECT * FROM membership WHERE group_id = ${groupId} AND user_id = ${addMemberDto.user_id}
        `.execute(this.db);

        return result.rows[0];
    }

    async updateMemberRole(groupId: number, targetUserId: number, requesterUserId: number, role: string): Promise<Membership> {
        // Check requester permission (must be owner or admin)
        const requester = await this.getMembership(groupId, requesterUserId);
        if (!requester || (requester.role !== 'owner' && requester.role !== 'admin')) {
            throw new BadRequestException('Only admins or owners can update roles');
        }

        const result = await sql<Membership>`
            UPDATE membership 
            SET role = ${role}, updated_at = CURRENT_TIMESTAMP
            WHERE group_id = ${groupId} AND user_id = ${targetUserId}
            RETURNING *
        `.execute(this.db);

        if (result.rows.length === 0) {
            throw new NotFoundException('Member not found');
        }

        return result.rows[0];
    }

    async inviteMember(groupId: number, targetUserId: number, requesterUserId: number): Promise<Membership> {
        // Only members can invite
        const requester = await this.getMembership(groupId, requesterUserId);
        if (!requester) {
            throw new BadRequestException('Only members can invite others to the group');
        }

        // For now, direct add (similar to join, but initiated by another)
        const membership = await this.addMember(groupId, { user_id: targetUserId });

        const notif = await this.notificationService.create({
            user_id: targetUserId,
            message: 'added you to a group.',
            type: 'group_invite',
            ref_id: groupId,
            ref_type: 'group',
            actor_id: requesterUserId
        });
        this.notificationGateway.sendNotificationToUser(targetUserId, notif);

        return membership;
    }

    async removeMember(groupId: number, targetUserId: number, requesterUserId: number): Promise<{ removed: boolean }> {
        // If not leaving voluntarily (requester !== target), check permissions
        if (targetUserId !== requesterUserId) {
            const requester = await this.getMembership(groupId, requesterUserId);
            if (!requester || (requester.role !== 'owner' && requester.role !== 'admin')) {
                throw new BadRequestException('Only admins or owners can remove members');
            }
        }

        const result = await sql`
            DELETE FROM membership WHERE group_id = ${groupId} AND user_id = ${targetUserId}
        `.execute(this.db);

        return { removed: (result.numAffectedRows !== undefined && result.numAffectedRows > BigInt(0)) };
    }

    async getMembership(groupId: number, userId: number): Promise<Membership | null> {
        const result = await sql<Membership>`
            SELECT * FROM membership WHERE group_id = ${groupId} AND user_id = ${userId}
        `.execute(this.db);
        return result.rows[0] || null;
    }

    async findMembers(groupId: number): Promise<any[]> {
        const result = await sql<any>`
      SELECT 
        m.*,
        u.username,
        u.full_name,
        u.profile_pic_id
      FROM membership m
      JOIN users u ON m.user_id = u.id
      WHERE m.group_id = ${groupId}
    `.execute(this.db);
        return result.rows;
    }
}
