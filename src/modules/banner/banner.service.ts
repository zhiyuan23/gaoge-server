import { Injectable, NotFoundException } from '@nestjs/common'
// eslint-disable-next-line ts/consistent-type-imports
import { PrismaService } from '@/common/prisma/prisma.service'
import type { CreateBannerDto, UpdateBannerDto } from './dto/create-banner.dto'

@Injectable()
export class BannerService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 获取轮播图列表 (只返回 active 的)
   */
  async findAll() {
    return this.prisma.banner.findMany({
      where: { status: 'active' },
      orderBy: { sort: 'desc' },
    })
  }

  /**
   * 获取所有轮播图 (管理员)
   */
  async findAllAdmin() {
    return this.prisma.banner.findMany({
      orderBy: { sort: 'desc' },
    })
  }

  /**
   * 获取单条
   */
  async findOne(id: number) {
    const banner = await this.prisma.banner.findUnique({ where: { id } })
    if (!banner) {
      throw new NotFoundException('轮播图不存在')
    }
    return banner
  }

  /**
   * 创建轮播图 (管理员)
   */
  async create(dto: CreateBannerDto) {
    return this.prisma.banner.create({
      data: {
        title: dto.title,
        imageUrl: dto.imageUrl,
        linkUrl: dto.linkUrl,
        sort: dto.sort || 0,
        status: dto.status || 'active',
      },
    })
  }

  /**
   * 更新轮播图 (管理员)
   */
  async update(id: number, dto: UpdateBannerDto) {
    await this.findOne(id)
    return this.prisma.banner.update({
      where: { id },
      data: dto,
    })
  }

  /**
   * 删除轮播图 (管理员)
   */
  async remove(id: number) {
    await this.findOne(id)
    return this.prisma.banner.delete({ where: { id } })
  }
}
