import { UnauthorizedException } from '@nestjs/common'
import type { JwtService } from '@nestjs/jwt'
import { AuthService } from './auth.service'

describe('authService', () => {
  const createService = () => {
    const prisma = {
      user: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      refreshToken: {
        create: jest.fn(),
      },
    }
    const jwtService = {
      signAsync: jest.fn()
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token'),
    }
    const service = new AuthService(
      {} as any,
      prisma as any,
      jwtService as unknown as JwtService,
    )

    return {
      prisma,
      jwtService,
      service,
    }
  }

  it('logs in admin users with account and password', async () => {
    const { prisma, service } = createService()
    prisma.user.findFirst.mockResolvedValue({
      id: 1,
      account: 'admin',
      passwordHash: await service.hashAdminPassword('Admin@123456'),
      role: 'admin',
      status: 'active',
      nickname: '管理员',
      avatarUrl: null,
      phone: null,
      openid: null,
      deletedAt: null,
      lastLoginAt: null,
    })
    prisma.user.update.mockResolvedValue({
      id: 1,
      account: 'admin',
      role: 'admin',
      nickname: '管理员',
      avatarUrl: null,
      phone: null,
      openid: null,
      lastLoginAt: new Date('2026-04-17T00:00:00.000Z'),
    })

    const result = await service.adminLogin({
      account: 'admin',
      password: 'Admin@123456',
    })

    expect(result.accessToken).toBe('access-token')
    expect(result.refreshToken).toBe('refresh-token')
    expect(result.user.account).toBe('admin')
    expect(result.user.role).toBe('admin')
  })

  it('rejects non-admin users during admin login', async () => {
    const { prisma, service } = createService()
    prisma.user.findFirst.mockResolvedValue({
      id: 2,
      account: 'editor',
      passwordHash: await service.hashAdminPassword('Admin@123456'),
      role: 'user',
      status: 'active',
      deletedAt: null,
    })

    await expect(service.adminLogin({
      account: 'editor',
      password: 'Admin@123456',
    })).rejects.toBeInstanceOf(UnauthorizedException)
  })
})
