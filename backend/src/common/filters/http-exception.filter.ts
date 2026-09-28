import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponseBody {
  success: boolean;
  message: string;
  errors?: unknown;
  path: string;
  method: string;
  timestamp: string;
  statusCode: number;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let errorResponse: ErrorResponseBody = {
      success: false,
      message: 'Internal server error',
      path: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
      statusCode: status,
    };

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      const message =
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as Record<string, unknown>).message;

      errorResponse = {
        ...errorResponse,
        message: Array.isArray(message) ? message.join(', ') : (message as string),
        errors: Array.isArray(message)
          ? message
          : (exceptionResponse as Record<string, unknown>).errors,
      };
    } else if (exception instanceof Error) {
      errorResponse = {
        ...errorResponse,
        message: exception.message,
      };
    }

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${errorResponse.message}`,
        exception instanceof Error ? exception.stack : '',
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} - ${status} ${errorResponse.message}`,
      );
    }

    response.status(status).json(errorResponse);
  }
}