import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kysely, PostgresDialect, sql } from 'kysely';
import { Pool } from 'pg';
import { DB } from './database.types';

export interface ConnectionStatus {
  connected: boolean;
  database: string;
  host: string;
  port: number;
  poolSize: number;
  activeConnections: number;
  idleConnections: number;
  timestamp: Date;
  error?: string;
}

@Injectable()
export class DatabaseService extends Kysely<DB> implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;
  private readonly logger = new Logger(DatabaseService.name);
  private isConnected = false;
  private dbConfig: { host: string; port: number; database: string; poolMax: number };

  constructor(private configService: ConfigService) {
    const host = configService.get<string>('DB_HOST', 'localhost');
    const port = configService.get<number>('DB_PORT', 5432);
    const database = configService.get<string>('DB_NAME', 'mohol_db');
    const poolMax = configService.get<number>('DB_POOL_MAX', 10);

    const pool = new Pool({
      host,
      port,
      database,
      user: configService.get<string>('DB_USER', 'mohol'),
      password: configService.get<string>('DB_PASSWORD', 'mohol'),
      max: poolMax,
    });

    super({
      dialect: new PostgresDialect({
        pool,
      }),
    });

    this.pool = pool;
    this.dbConfig = { host, port, database, poolMax };
  }

  async onModuleInit() {
    // Test the connection
    try {
      await sql`SELECT 1`.execute(this);
      this.isConnected = true;
      this.logger.log(`✅ Database connection established successfully to ${this.dbConfig.database}@${this.dbConfig.host}:${this.dbConfig.port}`);
    } catch (error) {
      this.isConnected = false;
      this.logger.error('❌ Failed to connect to database:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
    this.isConnected = false;
  }

  async getConnectionStatus(): Promise<ConnectionStatus> {
    try {
      // Test the connection
      await sql`SELECT 1`.execute(this);
      this.isConnected = true;

      return {
        connected: true,
        database: this.dbConfig.database,
        host: this.dbConfig.host,
        port: this.dbConfig.port,
        poolSize: this.dbConfig.poolMax,
        activeConnections: this.pool.totalCount - this.pool.idleCount,
        idleConnections: this.pool.idleCount,
        timestamp: new Date(),
      };
    } catch (error) {
      this.isConnected = false;
      return {
        connected: false,
        database: this.dbConfig.database,
        host: this.dbConfig.host,
        port: this.dbConfig.port,
        poolSize: this.dbConfig.poolMax,
        activeConnections: 0,
        idleConnections: 0,
        timestamp: new Date(),
        error: error.message,
      };
    }
  }

  isConnectionActive(): boolean {
    return this.isConnected;
  }
}

