import type { CreateTeamFundDto, QueryTeamFundDto, UpdateTeamFundDto } from './dto/create-team-fund.dto'
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
// eslint-disable-next-line ts/consistent-type-imports
import { TeamService } from './team.service'

@Controller('team')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  /**
   * 获取资金汇总
   */
  @Get('fund/summary')
  getSummary() {
    return this.teamService.getSummary()
  }

  /**
   * 获取资金记录列表
   */
  @Get('fund')
  findAll(@Query() query: QueryTeamFundDto) {
    return this.teamService.findAll(query)
  }

  /**
   * 获取单条记录
   */
  @Get('fund/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.teamService.findOne(id)
  }

  /**
   * 创建资金记录 (需要管理员权限)
   */
  @Post('fund')
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateTeamFundDto, @Req() req: any) {
    return this.teamService.create(dto, req.user.id)
  }

  /**
   * 更新资金记录 (需要管理员权限)
   */
  @Patch('fund/:id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTeamFundDto,
    @Req() req: any,
  ) {
    return this.teamService.update(id, dto, req.user.id, req.user.role)
  }

  /**
   * 删除资金记录 (需要管理员权限)
   */
  @Delete('fund/:id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.teamService.remove(id, req.user.id, req.user.role)
  }
}
