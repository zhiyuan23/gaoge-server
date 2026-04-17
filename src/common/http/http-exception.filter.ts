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
    // 处理Prisma数据库错误
    if (exception instanceof Error && 'code' in exception) {
      const prismaError = exception as { code: string; meta?: { target?: string[] } }

      // 唯一约束冲突
      if (prismaError.code === 'P2002') {
        const fields = prismaError.meta?.target?.join('、') || ''
        if (fields.includes('openid')) {
          return '该微信用户已经存在，请勿重复创建'
        }
        if (fields) {
          return `${fields} 已存在，请勿重复提交`
        }
        return '数据已存在，请勿重复提交'
      }

      // 记录不存在
      if (prismaError.code === 'P2025') {
        return '要操作的记录不存在或已被删除'
      }

      // 外键约束错误
      if (prismaError.code === 'P2003') {
        return '关联数据不存在，请检查输入'
      }

      // 字段值超出范围
      if (prismaError.code === 'P2000') {
        return '输入内容过长，请减少内容后重试'
      }
    }

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
      // 隐藏敏感的错误详情
      if (status === 500) {
        return '服务器内部错误，请稍后重试'
      }
      return exception.message
    }

    return '请求失败，请稍后重试'
  }
}
