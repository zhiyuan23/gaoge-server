import type { AppService } from './app.service'
import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'

@ApiTags('通用')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @ApiOperation({ summary: '测试接口', description: '测试服务是否正常运行' })
  @ApiResponse({ status: 200, description: '服务运行正常', type: String })
  @Get()
  getHello(): string {
    return this.appService.getHello()
  }
}
