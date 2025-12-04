import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'pg';

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(private configService: ConfigService) {}

  async ensureDatabaseExists(): Promise<void> {
    const dbName = this.configService.get<string>('DB_NAME', 'edu_helper');
    const dbHost = this.configService.get<string>('DB_HOST', 'localhost');
    const dbPort = parseInt(this.configService.get<string>('DB_PORT', '5432'));
    const dbUsername = this.configService.get<string>('DB_USERNAME', 'postgres');
    const dbPassword = this.configService.get<string>('DB_PASSWORD', 'postgres');

    const adminClient = new Client({
      host: dbHost,
      port: dbPort,
      user: dbUsername,
      password: dbPassword,
      database: 'postgres', 
    });

    try {
      await adminClient.connect();
      this.logger.log('Connected to PostgreSQL server');

      const result = await adminClient.query(
        `SELECT 1 FROM pg_database WHERE datname = $1`,
        [dbName],
      );

      if (result.rows.length === 0) {
        await adminClient.query(`CREATE DATABASE "${dbName}"`);
        this.logger.log(`✅ Database "${dbName}" created successfully`);
      } else {
        this.logger.log(`✅ Database "${dbName}" already exists`);
      }
    } catch (error: any) {
      this.logger.error(`❌ Error ensuring database exists: ${error.message}`);
      throw error;
    } finally {
      await adminClient.end();
    }
  }
}

