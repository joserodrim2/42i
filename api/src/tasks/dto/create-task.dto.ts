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
  /** Short summary of the task. */
  @IsString()
  @MaxLength(200)
  title!: string;

  /** Longer description. Defaults to an empty string. */
  @IsOptional()
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
   * Effort estimate in points (0–10). Only meaningful on leaf tasks — the API
   * rejects it on a task that has subtasks. `null` clears it.
   */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(EFFORT_MAX)
  effort?: number | null;

  /** Free-text assignee (this system has no user accounts). */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  assignee?: string | null;

  /** Parent task id — set to nest this task as a subtask. */
  @IsOptional()
  @IsUUID()
  parentId?: string | null;
}
