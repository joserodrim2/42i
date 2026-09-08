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
} from 'class-validator';
import { EFFORT_MAX } from '../domain/effort';

export class CreateTaskDto {
  @IsString()
  @MaxLength(200)
  title!: string;

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

  /** Optional effort estimate on the 0–10 point scale (UI presents 1–10). */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(EFFORT_MAX)
  effort?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  assignee?: string | null;

  /** Parent task id — set to nest this task as a subtask. */
  @IsOptional()
  @IsUUID()
  parentId?: string | null;
}
