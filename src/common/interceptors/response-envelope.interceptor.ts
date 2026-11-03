import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { PageMeta, PaginatedResult } from '../pagination/paginated-result';

export type ApiResponse<T> = { data: T } | { data: T[]; meta: PageMeta };

/** Wraps every successful payload as { data } or { data, meta } for lists. */
@Injectable()
export class ResponseEnvelopeInterceptor<T> implements NestInterceptor<T, ApiResponse<T> | undefined> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponse<T> | undefined> {
    return next.handle().pipe(
      map((value) => {
        if (value === undefined) return undefined; // 204 No Content
        if (value instanceof PaginatedResult) {
          return { data: value.items as T[], meta: value.meta };
        }
        return { data: value };
      }),
    );
  }
}
