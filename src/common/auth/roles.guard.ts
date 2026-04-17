import type { CanActivate, ExecutionContext } from '@nestjs/common'
import { ForbiddenException, Injectable } from '@nestjs/common'
// eslint-disable-next-line ts/consistent-type-imports
import { Reflector } from '@nestjs/core'
import { ROLES_KEY } from './roles.decorator'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate = (context: ExecutionContext) => {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (!requiredRoles?.length) {
      return true
    }

    const request = context.switchToHttp().getRequest()
    const user = request.user as { role?: string } | undefined

    if (!user?.role || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('暂无权限执行此操作')
    }

    return true
  }
}
