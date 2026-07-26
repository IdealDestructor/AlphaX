import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface SuccessResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
  error: null;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, SuccessResponse<T>> {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<SuccessResponse<T>> {
    return next.handle().pipe(
      map((payload) => {
        if (payload === undefined || payload === null) {
          return { data: null, error: null };
        }
        if (payload.data !== undefined && payload.error === undefined) {
          return payload;
        }
        if (payload.data !== undefined && payload.meta !== undefined) {
          return payload;
        }
        return { data: payload, error: null };
      }),
    );
  }
}
