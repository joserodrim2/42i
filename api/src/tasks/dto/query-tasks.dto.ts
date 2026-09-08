import { TaskPriority, TaskStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Trim } from '../../common/transforms';

/** Accepts `?status=A&status=B` (array) or `?status=A,B` (comma string). */
const toArray = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.split(',') : value;

const toInt = ({ value }: { value: unknown }): unknown =>
  value === undefined || value === '' ? undefined : Number(value);

export const TASK_SORT_FIELDS = [
  'createdAt',
  'updatedAt',
  'title',
  'priority',
  'status',
  'effort',
] as const;
export type TaskSortField = (typeof TASK_SORT_FIELDS)[number];

/** Hard cap on `page` — anything past the last page just returns no rows. */
export const MAX_PAGE = 100_000;

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
  @Trim()
  @IsString()
  @MaxLength(120)
  assignee?: string;

  /** Case-insensitive, literal match against title and description. */
  @IsOptional()
  @Trim()
  @IsString()
  @MaxLength(200)
  search?: string;

  /**
   * `roots` (default) returns only top-level tasks, each with its nested
   * subtasks. `all` returns every task as a flat list.
   */
  @IsOptional()
  @IsIn(['roots', 'all'])
  scope?: 'roots' | 'all' = 'roots';

  @IsOptional()
  @IsIn(TASK_SORT_FIELDS)
  sortBy?: TaskSortField = 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDir?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @Transform(toInt)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE)
  page?: number = 1;

  @IsOptional()
  @Transform(toInt)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 20;
}
