import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

interface ErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * 统一错误响应：{ data: null, error: { code, message, details } }。
 * 支持业务方以 `new XxxException({ code, message, details })` 传自定义错误结构。
 */
const STATUS_CODE_MAP: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'VALIDATION_ERROR',
  429: 'TOO_MANY_REQUESTS',
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    const error: ErrorBody = { code: 'INTERNAL_ERROR', message: '服务器内部错误' };
    let status = HttpStatus.INTERNAL_SERVER_ERROR;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        error.code = status === HttpStatus.UNAUTHORIZED ? 'UNAUTHORIZED' : 'HTTP_ERROR';
        error.message = body;
      } else if (body && typeof body === 'object') {
        const b = body as Record<string, unknown>;
        if (typeof b.code === 'string') {
          error.code = b.code;
        } else {
          error.code = STATUS_CODE_MAP[status] ?? 'HTTP_ERROR';
        }
        if (typeof b.message === 'string') {
          error.message = b.message;
        } else if (Array.isArray(b.message)) {
          error.code = 'VALIDATION_ERROR';
          error.message = (b.message as string[])[0] ?? '请求参数不合法';
          error.details = b.message;
        }
        if (b.details !== undefined) error.details = b.details;
      }
    } else if (exception instanceof Error) {
      error.message = exception.message;
    }

    res.status(status).json({
      data: null,
      meta: { timestamp: new Date().toISOString() },
      error,
    });
  }
}
