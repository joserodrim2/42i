import { TaskPriority, TaskStatus } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { EFFORT_MAX } from '../domain/effort';

/**
 * All fields optional. `effort` and `parentId` accept an explicit `null`
 * to clear the estimate or move the task to the top level.
 * Status changes are additionally checked against the lifecycle in the service.
 */
export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
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
  @IsInt()
  @Min(0)
  @Max(EFFORT_MAX)
  effort?: number | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(120)
  assignee?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsUUID()
  parentId?: string | null;
}
