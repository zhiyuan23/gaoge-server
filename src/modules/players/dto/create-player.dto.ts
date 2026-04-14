import { Type } from 'class-transformer'
import {
  IsBoolean,
  IsDate,
  IsOptional,
  IsString,
} from 'class-validator'

export class CreatePlayerDto {
  @IsString()
  openid: string

  @IsString()
  nickname: string

  @IsOptional()
  @IsString()
  realName?: string

  @IsOptional()
  @IsString()
  avatarUrl?: string

  @IsOptional()
  @IsString()
  subTeam?: string // real/inter/united，多选用逗号分隔

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  birthDate?: Date

  @IsOptional()
  @IsBoolean()
  isAdmin?: boolean

  @IsOptional()
  @IsString()
  position?: string

  @IsOptional()
  @IsString()
  jerseySize?: string

  @IsOptional()
  @IsString()
  status?: string

  @IsOptional()
  @IsString()
  remark?: string
}
