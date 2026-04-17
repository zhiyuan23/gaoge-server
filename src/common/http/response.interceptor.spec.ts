import type { CallHandler, ExecutionContext } from '@nestjs/common'
import { of } from 'rxjs'
import { ResponseInterceptor } from './response.interceptor'

describe('ResponseInterceptor', () => {
  it('wraps successful responses with the common envelope', (done) => {
    const interceptor = new ResponseInterceptor()
    const next: CallHandler = {
      handle: () => of(['player-1']),
    }

    interceptor.intercept({} as ExecutionContext, next).subscribe({
      next: (value) => {
        expect(value).toEqual({
          code: 0,
          data: ['player-1'],
          errMsg: '',
        })
      },
      complete: done,
    })
  })
})
