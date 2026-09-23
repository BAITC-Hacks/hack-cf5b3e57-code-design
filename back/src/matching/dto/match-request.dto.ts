import {
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class MatchRequestDto {
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  city!: string;

  /** ISO date `YYYY-MM-DD`. */
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be YYYY-MM-DD' })
  date!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(64)
  eventType!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(64)
  category!: string;

  @IsInt()
  @IsPositive()
  budgetKzt!: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  durationHours?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(32)
  language?: string;
}
