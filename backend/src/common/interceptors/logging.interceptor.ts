import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() === 'http') {
      const request = context.switchToHttp().getRequest<Request>();
      const { method, originalUrl, ip } = request;
      const userAgent = request.get('user-agent') || '';
      const startTime = Date.now();

      this.logger.log(
        `--> ${method} ${originalUrl} ${ip} ${userAgent}`.trim(),
      );

      return next.handle().pipe(
        tap({
          next: () => {
            const response = context.switchToHttp().getResponse();
            const statusCode = response.statusCode;
            const duration = Date.now() - startTime;
            this.logger.log(
              `<-- ${method} ${originalUrl} ${statusCode} ${duration}ms`,
            );
          },
          error: (error: Error) => {
            const duration = Date.now() - startTime;
            this.logger.error(
              `<-- ${method} ${originalUrl} ${error.message} ${duration}ms`,
              error.stack,
            );
          },
        }),
      );
    }

    return next.handle();
  }
}