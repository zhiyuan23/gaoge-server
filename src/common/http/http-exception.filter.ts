import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common'
import type { Response } from 'express'
import {
  Catch,
  HttpException,
  HttpStatus,
} from '@nestjs/common'

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR

    response.status(status).json({
      code: status,
      data: null,
      errMsg: this.getErrorMessage(exception, status),
    })
  }

  private getErrorMessage(exception: unknown, status: number): string {
    if (exception instanceof HttpException) {
      const payload = exception.getResponse()
      if (typeof payload === 'string' && payload) {
        return payload
      }

      if (typeof payload === 'object' && payload !== null) {
        const message = (payload as { message?: string | string[] }).message
        if (Array.isArray(message)) {
          return message.join('，')
        }
        if (typeof message === 'string' && message) {
          return message
        }
      }

      return exception.message || HttpStatus[status] || '请求失败'
    }

    if (exception instanceof Error && exception.message) {
      return exception.message
    }

    return '服务器内部错误'
  }
}
