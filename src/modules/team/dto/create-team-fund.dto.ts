import { Type } from 'class-transformer'
import { IsDate, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator'

export class CreateTeamFundDto {
  @IsIn(['income', 'expense'])
  type: 'income' | 'expense'

  @IsInt()
  @Min(1)
  amount: number

  @IsString()
  title: string

  @IsOptional()
  @IsString()
  description?: string

  @IsString()
  category: string // game_fee / equipment / venue / activity / sponsor / other

  @IsOptional()
  @IsIn(['pending', 'confirmed', 'cancelled'])
  status?: 'pending' | 'confirmed' | 'cancelled'

  @Type(() => Date)
  @IsDate()
  recordDate: Date
}

export class QueryTeamFundDto {
  @IsOptional()
  @IsIn(['income', 'expense'])
  type?: 'income' | 'expense'

  @IsOptional()
  @IsString()
  category?: string

  @IsOptional()
  @IsIn(['pending', 'confirmed', 'cancelled'])
  status?: 'pending' | 'confirmed' | 'cancelled'

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date
}

export class UpdateTeamFundDto {
  @IsOptional()
  @IsIn(['income', 'expense'])
  type?: 'income' | 'expense'

  @IsOptional()
  @IsInt()
  @Min(1)
  amount?: number

  @IsOptional()
  @IsString()
  title?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsString()
  category?: string

  @IsOptional()
  @IsIn(['pending', 'confirmed', 'cancelled'])
  status?: 'pending' | 'confirmed' | 'cancelled'

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  recordDate?: Date
}
