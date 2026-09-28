import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'error' },
        { emit: 'stdout', level: 'warn' },
      ],
    });
  }

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  async connect(): Promise<void> {
    try {
      const connectPromise = this.$connect();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database connection timed out')), 2000),
      );
      await Promise.race([connectPromise, timeoutPromise]);
      this.logger.log('Database connected successfully');
    } catch (error) {
      this.logger.warn('Database connection unavailable or timed out, continuing in development mode.');
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.$disconnect();
      this.logger.log('Database disconnected');
    } catch (error) {
      this.logger.error('Failed to disconnect from database', error instanceof Error ? error.stack : error);
    }
  }

  async enableShutdownHooks(): Promise<void> {
    process.on('beforeExit', async () => {
      await this.disconnect();
    });
  }

  async cleanDatabase(): Promise<void> {
    if (process.env.NODE_ENV === 'test') {
      const keys = Object.keys(this).filter(
        (key) =>
          key[0] === key[0].toLowerCase() &&
          typeof (this as Record<string, unknown>)[key] === 'object' &&
          this.hasOwnProperty(key),
      );

      for (const key of keys) {
        try {
          const model = (this as Record<string, any>)[key];
          if (model && typeof model.deleteMany === 'function') {
            await model.deleteMany();
          }
        } catch (error) {
          // Skip models that aren't accessible
          this.logger.debug(`Failed to clean model: ${key}`, (error as Error)?.message);
        }
      }
    }
  }
}