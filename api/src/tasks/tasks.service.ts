import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Task, TaskStatus } from '@prisma/client';
import { escapeLike } from '../common/transforms';
import { PrismaService } from '../prisma/prisma.service';
import {
  computeEffortStats,
  EffortStats,
  normalizeEffort,
} from './domain/effort';
import { assertTransition, InvalidTransitionError } from './domain/task-status';
import {
  buildTree,
  collectSubtreeIds,
  TaskLike,
  TreeNode,
  wouldCreateCycle,
} from './domain/tree';
import { CreateTaskDto } from './dto/create-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

export type TaskWithSubtasks = TreeNode<Task> & { rollup: EffortStats };

export interface PaginatedTasks {
  data: (Task & {
    rollup: EffortStats;
    subtaskCount: number;
    subtasks: TreeNode<Task>[];
  })[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  // --- Commands -----------------------------------------------------------

  async create(dto: CreateTaskDto): Promise<Task> {
    if (dto.parentId) await this.assertExists(dto.parentId);

    return this.prisma.$transaction(async (tx) => {
      const task = await tx.task.create({
        data: {
          title: dto.title.trim(),
          description: dto.description ?? '',
          status: dto.status ?? undefined,
          priority: dto.priority ?? undefined,
          effort: normalizeEffort(dto.effort ?? null),
          assignee: dto.assignee?.trim() || null,
          parentId: dto.parentId ?? null,
        },
      });

      // The parent is no longer a leaf: its own estimate becomes derived from
      // the subtree, so drop it (see the leaves-only model in domain/effort.ts).
      if (dto.parentId) {
        await tx.task.updateMany({
          where: { id: dto.parentId, effort: { not: null } },
          data: { effort: null },
        });
      }

      return task;
    });
  }

  async update(id: string, dto: UpdateTaskDto): Promise<Task> {
    const current = await this.getOrThrow(id);

    if (dto.status && dto.status !== current.status) {
      try {
        assertTransition(current.status, dto.status);
      } catch (err) {
        if (err instanceof InvalidTransitionError) {
          throw new BadRequestException(err.message);
        }
        throw err;
      }
    }

    if (dto.parentId !== undefined) {
      await this.assertReparentAllowed(id, dto.parentId);
    }

    if (dto.effort !== undefined && dto.effort !== null) {
      const childCount = await this.prisma.task.count({
        where: { parentId: id },
      });
      if (childCount > 0) {
        throw new BadRequestException(
          'A task with subtasks cannot have its own estimate — estimate the subtasks instead',
        );
      }
    }

    const data: Prisma.TaskUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title.trim();
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.priority !== undefined) data.priority = dto.priority;
    if (dto.effort !== undefined) data.effort = normalizeEffort(dto.effort);
    if (dto.assignee !== undefined)
      data.assignee = dto.assignee?.trim() || null;
    if (dto.parentId !== undefined) {
      data.parent = dto.parentId
        ? { connect: { id: dto.parentId } }
        : { disconnect: true };
    }

    return this.prisma.task.update({ where: { id }, data });
  }

  /** Deletes the task and, by cascade, its entire subtree. */
  async remove(id: string): Promise<{ id: string; deletedCount: number }> {
    await this.getOrThrow(id);
    const edges = await this.allEdges();
    const deletedCount = collectSubtreeIds(edges, id).size;
    await this.prisma.task.delete({ where: { id } });
    return { id, deletedCount };
  }

  // --- Queries ----------------------------------------------------------------

  async findOne(
    id: string,
  ): Promise<TaskWithSubtasks & { parent: Task | null; ancestors: Task[] }> {
    const task = await this.getOrThrow(id);
    const subtree = await this.subtreeRows(id);
    const [tree] = buildTree(subtree);

    const parent = task.parentId
      ? await this.prisma.task.findUnique({ where: { id: task.parentId } })
      : null;

    return {
      ...tree,
      rollup: computeEffortStats(subtree),
      parent,
      ancestors: await this.ancestors(task),
    };
  }

  async list(query: QueryTasksDto): Promise<PaginatedTasks> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const scope = query.scope ?? 'roots';

    const where: Prisma.TaskWhereInput = {};
    if (query.status?.length) where.status = { in: query.status };
    if (query.priority?.length) where.priority = { in: query.priority };
    if (query.assignee)
      where.assignee = { equals: query.assignee, mode: 'insensitive' };
    if (query.search) {
      const term = escapeLike(query.search);
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
      ];
    }
    if (scope === 'roots') where.parentId = null;

    const orderBy: Prisma.TaskOrderByWithRelationInput = {
      [query.sortBy ?? 'createdAt']: query.sortDir ?? 'desc',
    };

    const [total, rows, edges] = await Promise.all([
      this.prisma.task.count({ where }),
      this.prisma.task.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.allEdges(),
    ]);

    // Full rows for every task in the subtrees shown on this page (one query).
    const subtreeIdsByRoot = new Map(
      rows.map((row) => [row.id, collectSubtreeIds(edges, row.id)] as const),
    );
    const allSubtreeIds = new Set<string>();
    for (const ids of subtreeIdsByRoot.values()) {
      for (const id of ids) allSubtreeIds.add(id);
    }
    const subtreeRows = await this.prisma.task.findMany({
      where: { id: { in: [...allSubtreeIds] } },
    });

    const data = rows.map((row) => {
      const subtreeIds = subtreeIdsByRoot.get(row.id)!;
      const nodes = subtreeRows.filter((r) => subtreeIds.has(r.id));
      const [tree] = buildTree(nodes);
      return {
        ...row,
        subtasks: tree?.subtasks ?? [],
        subtaskCount: subtreeIds.size - 1,
        rollup: computeEffortStats(nodes),
      };
    });

    return {
      data,
      page,
      pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  /** Distinct assignee names currently in use, sorted — powers the list filter. */
  async assignees(): Promise<string[]> {
    const rows = await this.prisma.task.findMany({
      where: { assignee: { not: null } },
      select: { assignee: true },
      distinct: ['assignee'],
      orderBy: { assignee: 'asc' },
    });
    return rows
      .map((r) => r.assignee)
      .filter((a): a is string => a !== null && a !== '');
  }

  /** Global effort figures across the full task hierarchy. */
  async stats(): Promise<
    EffortStats & { byStatus: Record<TaskStatus, number> }
  > {
    const all = await this.prisma.task.findMany({
      select: { id: true, parentId: true, status: true, effort: true },
    });
    const byStatus = Object.fromEntries(
      (Object.keys(TaskStatus) as TaskStatus[]).map((s) => [s, 0]),
    ) as Record<TaskStatus, number>;
    for (const t of all) byStatus[t.status] += 1;

    return { ...computeEffortStats(all), byStatus };
  }

  // --- Internals ------------------------------------------------------------

  private async getOrThrow(id: string): Promise<Task> {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundException(`Task ${id} not found`);
    return task;
  }

  private async assertExists(id: string): Promise<void> {
    const count = await this.prisma.task.count({ where: { id } });
    if (count === 0)
      throw new BadRequestException(`Parent task ${id} does not exist`);
  }

  private async assertReparentAllowed(
    id: string,
    newParentId: string | null,
  ): Promise<void> {
    if (newParentId) await this.assertExists(newParentId);
    const edges = await this.allEdges();
    if (wouldCreateCycle(edges, id, newParentId)) {
      throw new BadRequestException(
        'Cannot move a task under itself or one of its own subtasks',
      );
    }
  }

  private async allEdges(): Promise<TaskLike[]> {
    return this.prisma.task.findMany({ select: { id: true, parentId: true } });
  }

  private async ancestors(task: Task): Promise<Task[]> {
    const chain: Task[] = [];
    let currentParentId = task.parentId;
    while (currentParentId) {
      const parent: Task | null = await this.prisma.task.findUnique({
        where: { id: currentParentId },
      });
      if (!parent) break;
      chain.unshift(parent);
      currentParentId = parent.parentId;
    }
    return chain;
  }

  /**
   * All rows in the subtree rooted at `id`, fetched in a single query with a
   * recursive CTE (efficient regardless of nesting depth).
   */
  private async subtreeRows(id: string): Promise<Task[]> {
    return this.prisma.$queryRaw<Task[]>`
      WITH RECURSIVE subtree AS (
        SELECT * FROM "Task" WHERE id = ${id}
        UNION ALL
        SELECT t.* FROM "Task" t
        JOIN subtree s ON t."parentId" = s.id
      )
      SELECT * FROM subtree
    `;
  }
}
