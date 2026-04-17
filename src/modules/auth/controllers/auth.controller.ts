import type { AdminLoginDto, PhoneLoginDto, RefreshTokenDto, WechatLoginDto } from '../dto/login.dto'
import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common'
import { Roles } from '@/common/auth/roles.decorator'
import { RolesGuard } from '@/common/auth/roles.guard'
import { JwtAuthGuard } from '../guards/jwt-auth.guard'
import type { AuthService } from '../services/auth.service'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('admin-login')
  @HttpCode(HttpStatus.OK)
  adminLogin(@Body() loginDto: AdminLoginDto) {
    return this.authService.adminLogin(loginDto)
  }

  @Post('wechat-login')
  @HttpCode(HttpStatus.OK)
  wechatLogin(@Body() loginDto: WechatLoginDto) {
    return this.authService.wechatLogin(loginDto)
  }

  @Post('phone-login')
  @HttpCode(HttpStatus.OK)
  phoneLogin(@Body() loginDto: PhoneLoginDto) {
    return this.authService.phoneLogin(loginDto)
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  refreshToken(@Body() refreshDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshDto.refreshToken)
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  logout(@Req() request: { user: { id: number } }) {
    return this.authService.logout(request.user.id)
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  profile(@Req() request: { user: { id: number } }) {
    return this.authService.getProfile(request.user.id)
  }

  @Get('permission')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  permission(@Req() request: { user: { id: number } }) {
    return this.authService.getPermission(request.user.id)
  }
}
