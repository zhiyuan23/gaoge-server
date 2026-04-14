#!/usr/bin/env ts-node
/**
 * 种子数据脚本 - 用于初始化测试数据
 *
 * 使用方法:
 * pnpm ts-node prisma/seed.ts
 */

import type { Prisma } from '@prisma/client'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// 示例测试数据（可根据需要添加）
const players: Prisma.PlayerCreateInput[] = [
  // {
  //   openid: 'test_openid_1',
  //   nickname: '梅西',
  //   realName: '里奥·梅西',
  //   avatarUrl: 'https://example.com/avatar/messi.jpg',
  //   subTeam: 'inter',
  //   birthDate: new Date('1987-06-24'),
  //   isAdmin: true,
  //   position: '前锋',
  //   jerseySize: 'L',
  // },
]

async function main() {
  console.log('🌱 开始播种数据...')

  // 清空现有数据
  await prisma.player.deleteMany({})
  console.log('🗑️  已清空现有球员数据')

  // 插入新数据
  for (const playerData of players) {
    const player = await prisma.player.create({
      data: playerData,
    })
    console.log(`✅ 创建球员：${player.nickname}`)
  }

  const count = await prisma.player.count()
  console.log(`\n✨ 完成！共创建 ${count} 名球员`)
}

main()
  .catch((e) => {
    console.error('❌ 错误:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
