import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

export class WechatLoginDto {
  @IsString()
  @IsNotEmpty()
  code: string

  @IsString()
  @IsOptional()
  nickname?: string

  @IsString()
  @IsOptional()
  avatarUrl?: string
}

export class WechatPhoneInfo {
  phoneNumber: string
  purePhoneNumber: string
  countryCode: string
}

export class PhoneLoginDto {
  @IsString()
  @IsNotEmpty()
  code: string

  @IsString()
  @IsNotEmpty()
  encryptedData: string

  @IsString()
  @IsNotEmpty()
  iv: string
}

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string
}
