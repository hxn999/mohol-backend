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
    const databaseUrl = configService.get<string>('DATABASE_URL');
    const poolMax = configService.get<number>('DB_POOL_MAX', 10);

    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not defined');
    }

    const pool = new Pool({
      connectionString: databaseUrl,
      max: poolMax,
      ssl: {
        rejectUnauthorized: false, // important for Neon
      },
    });

    super({
      dialect: new PostgresDialect({
        pool,
      }),
    });

    this.pool = pool;

    this.dbConfig = {
      host: 'neon',
      port: 5432,
      database: 'neondb',
      poolMax,
    };
  }

  async onModuleInit() {
    try {
      await sql`SELECT 1`.execute(this);
      this.isConnected = true;
      this.logger.log(`✅ Database connection established successfully`);
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
    } catch (error: any) {
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