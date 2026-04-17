import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import type { CreateBannerDto, UpdateBannerDto } from './dto/create-banner.dto'
// eslint-disable-next-line ts/consistent-type-imports
import { BannerService } from './banner.service'

@Controller('banner')
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}

  /**
   * 获取轮播图列表 (公开)
   */
  @Get()
  findAll() {
    return this.bannerService.findAll()
  }

  /**
   * 获取单条
   */
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bannerService.findOne(id)
  }

  /**
   * 创建轮播图 (管理员)
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateBannerDto) {
    return this.bannerService.create(dto)
  }

  /**
   * 更新轮播图 (管理员)
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBannerDto) {
    return this.bannerService.update(id, dto)
  }

  /**
   * 删除轮播图 (管理员)
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.bannerService.remove(id)
  }
}
