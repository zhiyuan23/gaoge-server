import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator'

export class CreateBannerDto {
  @IsString()
  title: string

  @IsString()
  imageUrl: string

  @IsOptional()
  @IsString()
  linkUrl?: string

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(999)
  sort?: number

  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: 'active' | 'inactive'
}

export class UpdateBannerDto {
  @IsOptional()
  @IsString()
  title?: string

  @IsOptional()
  @IsString()
  imageUrl?: string

  @IsOptional()
  @IsString()
  linkUrl?: string

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(999)
  sort?: number

  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: 'active' | 'inactive'
}
