import type { PhoneLoginDto, RefreshTokenDto, WechatLoginDto } from '../dto/login.dto'
import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../guards/jwt-auth.guard'
import { AuthService } from '../services/auth.service'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('wechat-login')
  @HttpCode(HttpStatus.OK)
  async wechatLogin(@Body() loginDto: WechatLoginDto) {
    return await this.authService.wechatLogin(loginDto)
  }

  @Post('phone-login')
  @HttpCode(HttpStatus.OK)
  async phoneLogin(@Body() loginDto: PhoneLoginDto) {
    return await this.authService.phoneLogin(loginDto)
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() refreshDto: RefreshTokenDto) {
    return await this.authService.refreshToken(refreshDto.refreshToken)
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Body() body: { userId: number }) {
    return await this.authService.logout(body.userId)
  }
}
