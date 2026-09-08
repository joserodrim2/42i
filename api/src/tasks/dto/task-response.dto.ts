import { ApiProperty } from '@nestjs/swagger';
import { TaskPriority, TaskStatus } from '@prisma/client';

/** A task row as stored. */
export class TaskDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty({ enum: TaskStatus })
  status!: TaskStatus;

  @ApiProperty({ enum: TaskPriority })
  priority!: TaskPriority;

  @ApiProperty({ type: Number, nullable: true })
  effort!: number | null;

  @ApiProperty({ type: String, nullable: true })
  assignee!: string | null;

  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  parentId!: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;
}

/** Effort figures aggregated over a set of tasks (leaves only). */
export class EffortStatsDto {
  @ApiProperty() totalEstimated!: number;
  @ApiProperty() notStarted!: number;
  @ApiProperty() inProgress!: number;
  @ApiProperty() blocked!: number;
  @ApiProperty() completed!: number;
  @ApiProperty() remaining!: number;
  @ApiProperty() taskCount!: number;
  @ApiProperty() leafCount!: number;
  @ApiProperty() estimatedCount!: number;
  @ApiProperty() unestimatedCount!: number;
}

/** A task with its nested subtasks. */
export class TaskNodeDto extends TaskDto {
  @ApiProperty({ type: () => [TaskNodeDto] })
  subtasks!: TaskNodeDto[];
}

/** A row in the list view: task + nested subtasks + its subtree rollup. */
export class TaskListItemDto extends TaskNodeDto {
  @ApiProperty()
  subtaskCount!: number;

  @ApiProperty({ type: EffortStatsDto })
  rollup!: EffortStatsDto;
}

export class PaginatedTasksDto {
  @ApiProperty({ type: [TaskListItemDto] })
  data!: TaskListItemDto[];

  @ApiProperty() page!: number;
  @ApiProperty() pageSize!: number;
  @ApiProperty() total!: number;
  @ApiProperty() totalPages!: number;
}

/** The detail view: a task, its full subtree, rollup and ancestor chain. */
export class TaskDetailDto extends TaskNodeDto {
  @ApiProperty({ type: EffortStatsDto })
  rollup!: EffortStatsDto;

  @ApiProperty({ type: TaskDto, nullable: true })
  parent!: TaskDto | null;

  @ApiProperty({ type: [TaskDto] })
  ancestors!: TaskDto[];
}

export class GlobalStatsDto extends EffortStatsDto {
  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'integer' },
    example: {
      BACKLOG: 2,
      TODO: 4,
      IN_PROGRESS: 2,
      IN_REVIEW: 1,
      DONE: 2,
      BLOCKED: 1,
    },
  })
  byStatus!: Record<TaskStatus, number>;
}

export class DeleteResultDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({
    description: 'Number of tasks removed, including the subtree.',
  })
  deletedCount!: number;
}
