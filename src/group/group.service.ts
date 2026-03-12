import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { Group, NewGroup, GroupUpdate, Membership, NewMembership } from 'src/database/database.types';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { sql } from 'kysely';

@Injectable()
export class GroupService {
    
    constructor(private readonly db: DatabaseService) { }
                                                                                                                          
    async create(createGroupDto: CreateGroupDto): Promise<Group> {
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

        return result.rows[0];
    }

    async findAll(): Promise<Group[]> {
        const result = await sql<Group>`
      SELECT * FROM groups ORDER BY created_at DESC
    `.execute(this.db);
        return result.rows;
    }

    async findOne(id: string): Promise<Group> {
        const result = await sql<Group>`
      SELECT * FROM groups WHERE id = ${id}
    `.execute(this.db);

        if (result.rows.length === 0) {
            throw new NotFoundException(`Group with ID ${id} not found`);
        }

        return result.rows[0];
    }

    async update(id: string, updateGroupDto: UpdateGroupDto): Promise<Group> {
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

    async remove(id: string): Promise<{ deleted: boolean }> {
        const result = await sql`
      DELETE FROM groups WHERE id = ${id}
    `.execute(this.db);

        if (result.numAffectedRows === undefined || result.numAffectedRows === BigInt(0)) {
            throw new NotFoundException(`Group with ID ${id} not found`);
        }

        return { deleted: true };
    }

    // === MEMBERSHIP METHODS ===

    async addMember(groupId: string, addMemberDto: AddMemberDto): Promise<Membership> {
        const result = await sql<Membership>`
      INSERT INTO membership (group_id, user_id, role)
      VALUES (${groupId}, ${addMemberDto.user_id}, ${addMemberDto.role || 'member'})
      ON CONFLICT (group_id, user_id) DO NOTHING
      RETURNING *
    `.execute(this.db);

        if (result.rows.length === 0) {
            const existing = await sql<Membership>`
        SELECT * FROM membership WHERE group_id = ${groupId} AND user_id = ${addMemberDto.user_id}
      `.execute(this.db);
            return existing.rows[0];
        }

        return result.rows[0];
    }

    async removeMember(groupId: string, userId: string): Promise<{ removed: boolean }> {
        const result = await sql`
      DELETE FROM membership WHERE group_id = ${groupId} AND user_id = ${userId}
    `.execute(this.db);

        return { removed: (result.numAffectedRows !== undefined && result.numAffectedRows > BigInt(0)) };
    }

    async findMembers(groupId: string): Promise<Membership[]> {
        const result = await sql<Membership>`
      SELECT * FROM membership WHERE group_id = ${groupId}
    `.execute(this.db);
        return result.rows;
    }
}
