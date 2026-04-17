import { Injectable, UnauthorizedException } from '@nestjs/common'
// eslint-disable-next-line ts/consistent-type-imports
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
// eslint-disable-next-line ts/consistent-type-imports
import { PrismaService } from '../prisma/prisma.service'

export interface JwtPayload {
  sub: number;
  openid?: string | null;
  account?: string | null;
  phone?: string | null;
  role?: string;
  iat: number;
  exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'secret',
    })
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: Number(payload.sub) },
    })

    if (!user || user.deletedAt || user.status !== 'active') {
      throw new UnauthorizedException('用户不存在或已被禁用')
    }

    return {
      id: user.id,
      openid: user.openid,
      account: user.account,
      phone: user.phone,
      role: user.role,
      status: user.status,
    }
  }
}
