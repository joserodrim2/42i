import { TaskPriority, TaskStatus } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Trim } from '../../common/transforms';
import { EFFORT_MAX } from '../domain/effort';

export class CreateTaskDto {
  /** Short summary of the task. Required, 1–200 characters after trimming. */
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  /** Longer description. Optional, up to 5000 characters. Defaults to `""`. */
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(5000)
  description?: string;

  /** Initial lifecycle state. Defaults to `BACKLOG`. */
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  /** Urgency. Defaults to `MEDIUM`. */
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  /**
   * Effort estimate in points (0–{@link EFFORT_MAX}), whole numbers only. Only
   * meaningful on leaf tasks — the API rejects it on a task that has subtasks.
   * `null` clears it.
   */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(EFFORT_MAX)
  effort?: number | null;

  /** Free-text assignee (this system has no user accounts). Up to 120 chars. */
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(120)
  assignee?: string | null;

  /** Optional target completion date (ISO 8601, e.g. `2026-10-15`). `null` clears it. */
  @IsOptional()
  @IsDateString()
  dueDate?: string | null;

  /** Parent task id — set to nest this task as a subtask. */
  @IsOptional()
  @IsUUID()
  parentId?: string | null;
}
