import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { TasksService } from './tasks.service';

/**
 * Service-level unit tests with a mocked PrismaService. These cover the
 * orchestration the pure domain tests can't: parent/child bookkeeping, the
 * mapping of domain errors to HTTP errors, and cycle checks against live data.
 */
function createPrismaMock() {
  const task = {
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
  };
  return {
    task,
    $queryRaw: jest.fn(),
    $transaction: jest.fn((cb: (tx: unknown) => unknown) => cb({ task })),
  };
}

describe('TasksService', () => {
  let service: TasksService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(async () => {
    prisma = createPrismaMock();
    const moduleRef = await Test.createTestingModule({
      providers: [TasksService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(TasksService);
  });

  describe('create', () => {
    it('trims text fields and does not touch a parent when top-level', async () => {
      prisma.task.create.mockResolvedValue({ id: '1' });

      await service.create({ title: '  Clean me  ', assignee: '   ' });

      expect(prisma.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'Clean me',
          description: '',
          assignee: null,
          parentId: null,
        }),
      });
      expect(prisma.task.updateMany).not.toHaveBeenCalled();
    });

    it('clears the parent’s own estimate when nesting a subtask under it', async () => {
      prisma.task.count.mockResolvedValue(1); // parent exists
      prisma.task.create.mockResolvedValue({ id: 'child' });

      await service.create({ title: 'Sub', parentId: 'parent-id' });

      expect(prisma.task.updateMany).toHaveBeenCalledWith({
        where: { id: 'parent-id', effort: { not: null } },
        data: { effort: null },
      });
    });

    it('rejects an unknown parentId', async () => {
      prisma.task.count.mockResolvedValue(0);

      await expect(
        service.create({ title: 'x', parentId: 'ghost' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('update', () => {
    it('throws NotFound for a missing task', async () => {
      prisma.task.findUnique.mockResolvedValue(null);

      await expect(
        service.update('missing', { title: 'x' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('maps an invalid status transition to 400', async () => {
      prisma.task.findUnique.mockResolvedValue({ id: 't', status: 'BACKLOG' });

      await expect(
        service.update('t', { status: 'DONE' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects an own estimate on a task that has subtasks', async () => {
      prisma.task.findUnique.mockResolvedValue({ id: 't', status: 'TODO' });
      prisma.task.count.mockResolvedValue(2); // has children

      await expect(service.update('t', { effort: 5 })).rejects.toThrow(
        /cannot have its own estimate/,
      );
    });

    it('rejects a re-parent that would create a cycle', async () => {
      prisma.task.findUnique.mockResolvedValue({ id: 'a', status: 'TODO' });
      prisma.task.count.mockResolvedValue(1); // new parent exists
      prisma.task.findMany.mockResolvedValue([
        { id: 'a', parentId: null },
        { id: 'b', parentId: 'a' },
      ]);

      await expect(
        service.update('a', { parentId: 'b' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('forwards only the provided fields to prisma', async () => {
      prisma.task.findUnique.mockResolvedValue({ id: 't', status: 'TODO' });
      prisma.task.update.mockResolvedValue({ id: 't' });

      await service.update('t', { title: '  New  ', status: 'IN_PROGRESS' });

      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: 't' },
        data: { title: 'New', status: 'IN_PROGRESS' },
      });
    });
  });

  describe('remove', () => {
    it('reports how many tasks the cascade removes', async () => {
      prisma.task.findUnique.mockResolvedValue({ id: 'a', parentId: null });
      prisma.task.findMany.mockResolvedValue([
        { id: 'a', parentId: null },
        { id: 'b', parentId: 'a' },
        { id: 'c', parentId: 'b' },
      ]);
      prisma.task.delete.mockResolvedValue({});

      await expect(service.remove('a')).resolves.toEqual({
        id: 'a',
        deletedCount: 3,
      });
    });
  });

  describe('findOne', () => {
    it('throws NotFound for a missing task', async () => {
      prisma.task.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('stats', () => {
    it('aggregates leaf effort and counts tasks by status', async () => {
      prisma.task.findMany.mockResolvedValue([
        { id: 'p', parentId: null, status: 'IN_PROGRESS', effort: null },
        { id: 'c', parentId: 'p', status: 'TODO', effort: 3 },
      ]);

      const res = await service.stats();

      expect(res.totalEstimated).toBe(3);
      expect(res.notStarted).toBe(3);
      expect(res.byStatus.TODO).toBe(1);
      expect(res.byStatus.IN_PROGRESS).toBe(1);
    });
  });
});
