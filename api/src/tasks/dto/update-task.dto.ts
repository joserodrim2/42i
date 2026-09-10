import { TaskPriority, TaskStatus } from '@prisma/client';
import {
  IsEnum,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { Trim } from '../../common/transforms';

/**
 * All fields optional. `effort` and `parentId` accept an explicit `null`
 * to clear the estimate or move the task to the top level.
 * Status changes are additionally checked against the lifecycle in the service.
 */
export class UpdateTaskDto {
  /** New title. Required to be 1–200 non-blank characters when present. */
  @IsOptional()
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsNumber()
  @Min(0)
  @Max(1_000_000)
  effort?: number | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Trim()
  @IsString()
  @MaxLength(120)
  assignee?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Matches(/^\d{4}-\d{2}-\d{2}/, {
    message: 'dueDate must be an ISO 8601 date (YYYY-MM-DD)',
  })
  @IsISO8601({ strict: true })
  dueDate?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  parentId?: string | null;
}
