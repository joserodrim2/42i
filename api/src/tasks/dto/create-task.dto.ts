import { TaskPriority, TaskStatus } from '@prisma/client';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

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

  /** Optional effort estimate; must be a non-negative number when provided. */
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
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
