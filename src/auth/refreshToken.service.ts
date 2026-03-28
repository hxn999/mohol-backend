// src/auth/refresh-token.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { RefreshTokenTable } from 'src/database/database.types';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { sql } from 'kysely';

@Injectable()
export class RefreshTokenService {
  constructor(private readonly db: DatabaseService) {}

  async createToken(userId: number, expiresInDays = 30, expiresInMinutes?: number) {
    const rawToken = crypto.randomBytes(64).toString('hex');
    const tokenHash = await bcrypt.hash(rawToken, 10);
    const expiresAt = expiresInMinutes 
      ? new Date(Date.now() + expiresInMinutes * 60 * 1000)
      : new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    const result = await sql<RefreshTokenTable & { id: number }>`
      INSERT INTO refresh_token (user_id, token_hash, expires_at, revoked)
      VALUES (${userId}, ${tokenHash}, ${expiresAt}, FALSE)
      RETURNING id, user_id
    `.execute(this.db);

    if (result.rows.length === 0) {
      throw new Error('Failed to create refresh token');
    }

    const created = result.rows[0];
    // cookie value: "<id>.<raw>"
    const cookieValue = `${created.id}.${rawToken}`;
    return { cookieValue, expiresAt, userId: created.user_id };
  }

  async validateAndRotate(cookieValue: string) {
    const [idStr, raw] = cookieValue.split('.');
    if (!idStr || !raw) throw new UnauthorizedException('Malformed refresh token');
    
    const id = parseInt(idStr, 10);
    if (isNaN(id)) throw new UnauthorizedException('Malformed refresh token');

    const result = await sql<RefreshTokenTable>`
      SELECT * FROM refresh_token WHERE id = ${id}
    `.execute(this.db);

    if (result.rows.length === 0) {
      throw new UnauthorizedException('Token invalid');
    }

    const record = result.rows[0];
    
    if (record.revoked) {
      throw new UnauthorizedException('Token invalid');
    }
    
    if (new Date(record.expires_at) < new Date()) {
      throw new UnauthorizedException('Token expired');
    }

    const match = await bcrypt.compare(raw, record.token_hash);
    if (!match) {
      // Possible token reuse — revoke all for user
      await this.revokeAllForUser(record.user_id);
      throw new Error('Possible token reuse detected');
    }

    // rotate: delete old, issue new
    await sql`
      DELETE FROM refresh_token WHERE id = ${id}
    `.execute(this.db);
    
    return this.createToken(record.user_id);
  }

  async revoke(id: number | string) {
    await sql`
      UPDATE refresh_token SET revoked = TRUE WHERE id = ${id}
    `.execute(this.db);
  }

  async revokeAllForUser(userId: number) {
    await sql`
      UPDATE refresh_token SET revoked = TRUE WHERE user_id = ${userId}
    `.execute(this.db);
  }

  async validateOneTimeToken(cookieValue: string) {
    const [idStr, raw] = cookieValue.split('.');
    if (!idStr || !raw) throw new UnauthorizedException('Malformed token');

    const id = parseInt(idStr, 10);
    if (isNaN(id)) throw new UnauthorizedException('Malformed token');

    const result = await sql<RefreshTokenTable>`
      SELECT * FROM refresh_token WHERE id = ${id}
    `.execute(this.db);

    if (result.rows.length === 0) {
      throw new UnauthorizedException('Token invalid');
    }

    const record = result.rows[0];

    if (record.revoked) {
      throw new UnauthorizedException('Token invalid');
    }

    if (new Date(record.expires_at) < new Date()) {
      throw new UnauthorizedException('Token expired');
    }

    const match = await bcrypt.compare(raw, record.token_hash);
    if (!match) {
      throw new UnauthorizedException('Token invalid');
    }

    // Delete after one-time use
    await sql`
      DELETE FROM refresh_token WHERE id = ${id}
    `.execute(this.db);

    return { userId: record.user_id };
  }
}
