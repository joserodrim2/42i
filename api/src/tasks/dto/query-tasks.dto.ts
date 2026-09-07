import { TaskPriority, TaskStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

const toArray = ({ value }: { value: unknown }): unknown =>
  value === undefined || Array.isArray(value) ? value : String(value).split(',');

export const TASK_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'title',
  'priority',
  'status',
  'effort',
] as const;
export type TaskSortField = (typeof TASK_SORT_FIELDS)[number];

/** Query params for the main list view (filtering, sorting, pagination). */
export class QueryTasksDto {
  /** One or more statuses (repeat the param or comma-separate). */
  @IsOptional()
  @Transform(toArray)
  @IsEnum(TaskStatus, { each: true })
  status?: TaskStatus[];

  @IsOptional()
  @Transform(toArray)
  @IsEnum(TaskPriority, { each: true })
  priority?: TaskPriority[];

  @IsOptional()
  @IsString()
  assignee?: string;

  /** Case-insensitive match against title and description. */
  @IsOptional()
  @IsString()
  search?: string;

  /**
   * `roots` (default) returns only top-level tasks, each with its nested
   * subtasks. `all` returns every task as a flat list.
   */
  @IsOptional()
  @IsIn(['roots', 'all'])
  scope?: 'roots' | 'all' = 'roots';

  @IsOptional()
  @IsIn(TASK_SORT_FIELDS as unknown as string[])
  sortBy?: TaskSortField = 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDir?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;
}
