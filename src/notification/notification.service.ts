import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { Notification, NewNotification } from 'src/database/database.types';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { sql } from 'kysely';

@Injectable()
export class NotificationService {
    constructor(private readonly db: DatabaseService) { }

    async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
        const result = await sql<Notification>`
      INSERT INTO notification (user_id, message, type, ref_id, ref_type, actor_id)
      VALUES (
        ${createNotificationDto.user_id},
        ${createNotificationDto.message},
        ${createNotificationDto.type},
        ${createNotificationDto.ref_id || null},
        ${createNotificationDto.ref_type || null},
        ${createNotificationDto.actor_id || null}
      )
      RETURNING *
    `.execute(this.db);

        if (result.rows.length === 0) {
            throw new BadRequestException('Failed to create notification');
        }

        return result.rows[0];
    }

    async findAllByUser(userId: number): Promise<any[]> {
        const result = await sql<any>`
            SELECT 
                n.*,
                a.id as actor_id,
                a.full_name as actor_name,
                a.username as actor_username,
                a.profile_pic_id as actor_pfp_id
            FROM notification n
            LEFT JOIN users a ON n.actor_id = a.id
            WHERE n.user_id = ${userId}
            ORDER BY n.created_at DESC
        `.execute(this.db);
        return result.rows;
    }

    async markAsRead(id: number): Promise<Notification> {
        const result = await sql<Notification>`
      UPDATE notification SET is_read = TRUE WHERE id = ${id} RETURNING *
    `.execute(this.db);

        if (result.rows.length === 0) {
            throw new NotFoundException(`Notification with ID ${id} not found`);
        }

        return result.rows[0];
    }

    async remove(id: number): Promise<{ deleted: boolean }> {
        const result = await sql`
      DELETE FROM notification WHERE id = ${id}
    `.execute(this.db);

        if (result.numAffectedRows === undefined || result.numAffectedRows === BigInt(0)) {
            throw new NotFoundException(`Notification with ID ${id} not found`);
        }

        return { deleted: true };
    }
}
