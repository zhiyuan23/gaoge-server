import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common'
import type { Observable } from 'rxjs'
import { Injectable } from '@nestjs/common'
import { map } from 'rxjs/operators'

export interface ApiResponseEnvelope<T> {
  code: number
  data: T
  errMsg: string
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponseEnvelope<unknown>> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponseEnvelope<unknown>> {
    return next.handle().pipe(
      map((data) => {
        if (isEnvelope(data)) {
          return data
        }

        return {
          code: 0,
          data,
          errMsg: '',
        }
      }),
    )
  }
}

function isEnvelope(value: unknown): value is ApiResponseEnvelope<unknown> {
  return typeof value === 'object'
    && value !== null
    && 'code' in value
    && 'data' in value
    && 'errMsg' in value
}
