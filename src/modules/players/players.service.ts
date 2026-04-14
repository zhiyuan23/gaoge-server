import type { CreatePlayerDto } from './dto/create-player.dto'
import type { UpdatePlayerDto } from './dto/update-player.dto'
import type { PrismaService } from '@/common/prisma/prisma.service'
import { Injectable, NotFoundException } from '@nestjs/common'

@Injectable()
export class PlayersService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreatePlayerDto) {
    return this.prisma.player.create({ data: dto })
  }

  findAll() {
    return this.prisma.player.findMany({
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne(id: number) {
    const player = await this.prisma.player.findUnique({ where: { id } })
    if (!player) {
      throw new NotFoundException('Player not found')
    }
    return player
  }

  async update(id: number, dto: UpdatePlayerDto) {
    await this.findOne(id)
    return this.prisma.player.update({ where: { id }, data: dto })
  }

  async remove(id: number) {
    await this.findOne(id)
    return this.prisma.player.delete({ where: { id } })
  }
}
