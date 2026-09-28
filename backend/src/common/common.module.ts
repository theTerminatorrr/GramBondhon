import { Module } from '@nestjs/common';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import { HealthController } from './health/health.controller';
import { S3Service } from './utils/s3.service';

@Module({
  imports: [],
  controllers: [HealthController],
  providers: [
    S3Service,
    HttpExceptionFilter,
    LoggingInterceptor,
    TransformInterceptor,
  ],
  exports: [
    S3Service,
    HttpExceptionFilter,
    LoggingInterceptor,
    TransformInterceptor,
  ],
})
export class CommonModule {}