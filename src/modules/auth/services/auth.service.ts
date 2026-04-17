import type { AdminLoginDto, PhoneLoginDto, WechatLoginDto } from '../dto/login.dto'
import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common'
// eslint-disable-next-line ts/consistent-type-imports
import { JwtService } from '@nestjs/jwt'
// eslint-disable-next-line ts/consistent-type-imports
import { PrismaService } from '../../../common/prisma/prisma.service'
// eslint-disable-next-line ts/consistent-type-imports
import { WechatService } from '../../../common/wechat/wechat.service'
import { hashPassword, verifyPassword } from '../../../common/auth/password.util'

export interface LoginResponse {
  user: any;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JwtPayload {
  sub: number;
  openid?: string | null;
  account?: string | null;
  phone?: string;
  role?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private readonly wechatService: WechatService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  hashAdminPassword = (password: string) => hashPassword(password)

  async adminLogin(loginDto: AdminLoginDto): Promise<LoginResponse> {
    const user = await this.prisma.user.findFirst({
      where: {
        account: loginDto.account,
      },
    })

    if (!user?.passwordHash) {
      throw new UnauthorizedException('账号或密码错误')
    }

    if (user.deletedAt || user.status !== 'active' || user.role !== 'admin') {
      throw new UnauthorizedException('当前账号无后台权限')
    }

    const isPasswordValid = await verifyPassword(loginDto.password, user.passwordHash)
    if (!isPasswordValid) {
      throw new UnauthorizedException('账号或密码错误')
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
      },
    })

    const tokens = await this.generateTokens(updatedUser)

    return {
      user: this.serializeUser(updatedUser),
      ...tokens,
    }
  }

  /**
   * 微信登录
   */
  async wechatLogin(loginDto: WechatLoginDto): Promise<LoginResponse> {
    try {
      // 1. 通过code获取openid和session_key
      const wechatSession = await this.wechatService.getSessionByCode(loginDto.code)

      // 2. 查找或创建用户
      let user = await this.prisma.user.findUnique({
        where: { openid: wechatSession.openid },
      })

      if (!user) {
        // 新用户注册
        user = await this.prisma.user.create({
          data: {
            openid: wechatSession.openid,
            unionid: wechatSession.unionid,
            nickname: loginDto.nickname,
            avatarUrl: loginDto.avatarUrl,
            lastLoginAt: new Date(),
          },
        })
      }
      else {
        // 更新最后登录时间
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            lastLoginAt: new Date(),
          },
        })
      }

      // 3. 生成token
      const tokens = await this.generateTokens(user)

      this.logger.log('微信登录成功', { userId: user.id, openid: user.openid })

      return {
        user: this.serializeUser(user),
        ...tokens,
      }
    }
    catch (error: any) {
      this.logger.error('微信登录失败', { error: error.message, code: loginDto.code })
      throw new UnauthorizedException('微信登录失败')
    }
  }

  /**
   * 手机号登录
   */
  async phoneLogin(loginDto: PhoneLoginDto): Promise<LoginResponse> {
    try {
      // 1. 通过code获取session_key
      const wechatSession = await this.wechatService.getSessionByCode(loginDto.code)

      // 2. 解密手机号
      const phoneInfo = this.wechatService.decryptPhoneInfo(
        loginDto.encryptedData,
        wechatSession.session_key,
        loginDto.iv,
      )

      // 3. 查找或创建用户
      let user = await this.prisma.user.findUnique({
        where: { openid: wechatSession.openid },
      })

      if (!user) {
        // 新用户注册
        user = await this.prisma.user.create({
          data: {
            openid: wechatSession.openid,
            unionid: wechatSession.unionid,
            phone: phoneInfo.phoneNumber,
            lastLoginAt: new Date(),
          },
        })
      }
      else {
        // 更新用户信息
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            phone: phoneInfo.phoneNumber,
            lastLoginAt: new Date(),
          },
        })
      }

      // 4. 生成token
      const tokens = await this.generateTokens(user)

      this.logger.log('手机号登录成功', { userId: user.id, phone: phoneInfo.phoneNumber })

      return {
        user: this.serializeUser(user),
        ...tokens,
      }
    }
    catch (error: any) {
      this.logger.error('手机号登录失败', { error: error.message, code: loginDto.code })
      throw new BadRequestException('手机号登录失败')
    }
  }

  /**
   * 生成 JWT token
   */
  private async generateTokens(user: any): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const payload: JwtPayload = {
      sub: user.id,
      openid: user.openid,
      account: user.account,
      phone: user.phone,
      role: user.role,
    }

    const accessToken = await this.jwtService.signAsync(payload)
    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id },
      { expiresIn: '7d' },
    )

    // 存储 refresh token
    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天
      },
    })

    return {
      accessToken,
      refreshToken,
      expiresIn: 2 * 60 * 60, // 2小时
    }
  }

  /**
   * 刷新token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // 1. 验证refresh token是否有效
      const tokenRecord = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      })

      if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
        throw new UnauthorizedException('刷新token无效或已过期')
      }

      // 2. 验证 JWT 是否有效
      try {
        await this.jwtService.verifyAsync(refreshToken)
      }
      catch {
        throw new UnauthorizedException('刷新token验证失败')
      }

      // 3. 获取用户信息
      const user = tokenRecord.user

      if (user.deletedAt) {
        throw new UnauthorizedException('用户已被删除')
      }

      // 4. 生成新的token
      const newTokens = await this.generateTokens(user)

      // 5. 删除旧的refresh token
      await this.prisma.refreshToken.delete({
        where: { id: tokenRecord.id },
      })

      return {
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
      }
    }
    catch (error: any) {
      this.logger.error('刷新token失败', { error: error.message })
      throw new UnauthorizedException('刷新token失败')
    }
  }

  /**
   * 退出登录
   */
  async logout(userId: number): Promise<{ message: string }> {
    try {
      // 1. 删除用户的所有refresh token
      await this.prisma.refreshToken.deleteMany({
        where: { userId },
      })

      this.logger.log('用户退出成功', { userId })

      return { message: '退出成功' }
    }
    catch (error: any) {
      this.logger.error('退出失败', { userId, error: error.message })
      throw new BadRequestException('退出失败')
    }
  }

  /**
   * 验证用户
   */
  async validateUser(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: Number(payload.sub) },
    })

    // 检查用户是否已删除
    if (!user || user.deletedAt) {
      return null
    }

    return user
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user || user.deletedAt || user.status !== 'active') {
      throw new UnauthorizedException('用户不存在或已被禁用')
    }

    return this.serializeUser(user)
  }

  async getPermission(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user || user.deletedAt || user.status !== 'active') {
      throw new UnauthorizedException('用户不存在或已被禁用')
    }

    return {
      permissions: this.buildPermissions(user.role),
      role: user.role,
    }
  }

  private buildPermissions(role: string) {
    if (role === 'admin') {
      return [
        'player:create',
        'player:update',
        'player:delete',
      ]
    }

    return []
  }

  private serializeUser(user: any) {
    return {
      id: user.id,
      account: user.account ?? '',
      openid: user.openid,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      role: user.role,
      status: user.status,
      lastLoginAt: user.lastLoginAt,
    }
  }
}
