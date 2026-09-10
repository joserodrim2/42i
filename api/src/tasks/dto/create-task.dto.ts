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
} from 'class-validator';
import { Trim } from '../../common/transforms';

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
   * Optional effort estimate — a non-negative number (`0`–`1_000_000`; the upper
   * bound is just a sanity guard). Only meaningful on leaf tasks — the API
   * rejects it on a task that has subtasks. `null` clears it. The web UI offers
   * a 1–10 scale by team convention.
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1_000_000)
  effort?: number | null;

  /** Free-text assignee (this system has no user accounts). Up to 120 chars. */
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(120)
  assignee?: string | null;

  /**
   * Target completion date — an ISO 8601 date, `YYYY-MM-DD` (e.g. `2026-10-15`).
   * Strict: impossible calendar dates like `2026-02-30` are rejected.
   * `null` clears it.
   */
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}/, {
    message: 'dueDate must be an ISO 8601 date (YYYY-MM-DD)',
  })
  @IsISO8601({ strict: true })
  dueDate?: string | null;

  /** Parent task id — set to nest this task as a subtask. */
  @IsOptional()
  @IsUUID()
  parentId?: string | null;
}
