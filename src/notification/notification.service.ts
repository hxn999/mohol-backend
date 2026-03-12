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
      INSERT INTO notification (user_id, message, type, ref_id, ref_type)
      VALUES (
        ${createNotificationDto.user_id},
        ${createNotificationDto.message},
        ${createNotificationDto.type},
        ${createNotificationDto.ref_id || null},
        ${createNotificationDto.ref_type || null}
      )
      RETURNING *
    `.execute(this.db);

        if (result.rows.length === 0) {
            throw new BadRequestException('Failed to create notification');
        }

        return result.rows[0];
    }

    async findAllByUser(userId: string): Promise<Notification[]> {
        const result = await sql<Notification>`
      SELECT * FROM notification WHERE user_id = ${userId} ORDER BY created_at DESC
    `.execute(this.db);
        return result.rows;
    }

    async markAsRead(id: string): Promise<Notification> {
        const result = await sql<Notification>`
      UPDATE notification SET is_read = TRUE WHERE id = ${id} RETURNING *
    `.execute(this.db);

        if (result.rows.length === 0) {
            throw new NotFoundException(`Notification with ID ${id} not found`);
        }

        return result.rows[0];
    }

    async remove(id: string): Promise<{ deleted: boolean }> {
        const result = await sql`
      DELETE FROM notification WHERE id = ${id}
    `.execute(this.db);

        if (result.numAffectedRows === undefined || result.numAffectedRows === BigInt(0)) {
            throw new NotFoundException(`Notification with ID ${id} not found`);
        }

        return { deleted: true };
    }
}
