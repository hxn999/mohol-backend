import { Injectable } from '@nestjs/common';
import { DatabaseService, ConnectionStatus } from './database/database.service';
import { User } from './database/database.types';
import { sql } from 'kysely';

export interface UsersResponse {
  dbStatus: ConnectionStatus;
  users: User[];
  count: number;
}

@Injectable()
export class AppService {
  constructor(private readonly db: DatabaseService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getDbStatus(): Promise<ConnectionStatus> {
    return this.db.getConnectionStatus();
  }

  async getAllUsers(): Promise<UsersResponse> {
    const dbStatus = await this.db.getConnectionStatus();

    if (!dbStatus.connected) {
      return {
        dbStatus,
        users: [],
        count: 0,
      };
    }

    const result = await sql<User>`
      SELECT * FROM users
    `.execute(this.db);

    return {
      dbStatus,
      users: result.rows,
      count: result.rows.length,
    };
  }
}
