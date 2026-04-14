import type { CreateTeamFundDto, QueryTeamFundDto, UpdateTeamFundDto } from './dto/create-team-fund.dto'
import type { PrismaService } from '@/common/prisma/prisma.service'
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'

export interface FundSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

@Injectable()
export class TeamService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 创建资金记录 (仅管理员)
   */
  async create(dto: CreateTeamFundDto, creatorId: number) {
    return this.prisma.teamFund.create({
      data: {
        type: dto.type,
        amount: dto.amount,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        status: dto.status || 'pending',
        recordDate: dto.recordDate,
        creatorId,
      },
    })
  }

  /**
   * 获取资金记录列表
   */
  async findAll(query: QueryTeamFundDto) {
    const where: any = {}

    if (query.type) where.type = query.type
    if (query.category) where.category = query.category
    if (query.status) where.status = query.status

    if (query.startDate || query.endDate) {
      where.recordDate = {}
      if (query.startDate) where.recordDate.gte = query.startDate
      if (query.endDate) where.recordDate.lte = query.endDate
    }

    return this.prisma.teamFund.findMany({
      where,
      orderBy: { recordDate: 'desc' },
    })
  }

  /**
   * 获取资金汇总
   */
  async getSummary(): Promise<FundSummary> {
    await this.prisma.teamFund.aggregate({
      _sum: { amount: true },
    })

    const income = await this.prisma.teamFund.aggregate({
      where: { type: 'income', status: 'confirmed' },
      _sum: { amount: true },
    })

    const expense = await this.prisma.teamFund.aggregate({
      where: { type: 'expense', status: 'confirmed' },
      _sum: { amount: true },
    })

    return {
      totalIncome: income._sum.amount || 0,
      totalExpense: expense._sum.amount || 0,
      balance: (income._sum.amount || 0) - (expense._sum.amount || 0),
    }
  }

  /**
   * 获取单条记录
   */
  async findOne(id: number) {
    const fund = await this.prisma.teamFund.findUnique({ where: { id } })
    if (!fund) {
      throw new NotFoundException('资金记录不存在')
    }
    return fund
  }

  /**
   * 更新资金记录 (仅管理员)
   */
  async update(id: number, dto: UpdateTeamFundDto, userId: number, userRole: string) {
    await this.findOne(id)

    // 检查权限
    if (userRole !== 'admin') {
      throw new ForbiddenException('只有管理员可以修改资金记录')
    }

    return this.prisma.teamFund.update({
      where: { id },
      data: dto,
    })
  }

  /**
   * 删除资金记录 (仅管理员)
   */
  async remove(id: number, userId: number, userRole: string) {
    await this.findOne(id)

    if (userRole !== 'admin') {
      throw new ForbiddenException('只有管理员可以删除资金记录')
    }

    return this.prisma.teamFund.delete({ where: { id } })
  }
}
