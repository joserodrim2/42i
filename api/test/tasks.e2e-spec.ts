import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * End-to-end tests. Require a running Postgres reachable via DATABASE_URL
 * with migrations applied. The compose db works:
 *   docker compose up -d db
 *   cd api && npx prisma migrate deploy && npm run test:e2e
 */
describe('Tasks API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();

    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.task.deleteMany();
  });

  afterAll(async () => {
    await prisma.task.deleteMany();
    await app.close();
  });

  const api = () => request(app.getHttpServer());

  it('creates, reads, updates and deletes a task', async () => {
    const created = await api()
      .post('/api/tasks')
      .send({ title: 'Write docs', priority: 'HIGH', effort: 3 })
      .expect(201);

    expect(created.body).toMatchObject({
      title: 'Write docs',
      status: 'BACKLOG',
      priority: 'HIGH',
      effort: 3,
    });

    const id = created.body.id;

    await api().get(`/api/tasks/${id}`).expect(200);

    await api().patch(`/api/tasks/${id}`).send({ status: 'TODO' }).expect(200);
    await api()
      .patch(`/api/tasks/${id}`)
      .send({ status: 'IN_PROGRESS' })
      .expect(200);

    const del = await api().delete(`/api/tasks/${id}`).expect(200);
    expect(del.body).toEqual({ id, deletedCount: 1 });
    await api().get(`/api/tasks/${id}`).expect(404);
  });

  it('rejects an invalid status transition with 400', async () => {
    const { body } = await api()
      .post('/api/tasks')
      .send({ title: 'Task', status: 'BACKLOG' });

    await api()
      .patch(`/api/tasks/${body.id}`)
      .send({ status: 'DONE' })
      .expect(400);
  });

  it('rejects a negative effort with 400', async () => {
    await api().post('/api/tasks').send({ title: 'x', effort: -2 }).expect(400);
  });

  it('supports a multi-level subtask hierarchy and rolls up effort', async () => {
    const root = (
      await api().post('/api/tasks').send({ title: 'Epic', status: 'IN_PROGRESS' })
    ).body;
    const child = (
      await api()
        .post(`/api/tasks/${root.id}/subtasks`)
        .send({ title: 'Story', status: 'TODO', effort: 5 })
    ).body;
    await api()
      .post(`/api/tasks/${child.id}/subtasks`)
      .send({ title: 'Sub-sub', status: 'IN_PROGRESS', effort: 8 })
      .expect(201);

    const detail = await api().get(`/api/tasks/${root.id}`).expect(200);
    expect(detail.body.subtasks).toHaveLength(1);
    expect(detail.body.subtasks[0].subtasks).toHaveLength(1);
    expect(detail.body.rollup).toMatchObject({
      notStarted: 5,
      inProgress: 8,
      totalEstimated: 13,
      taskCount: 3,
    });
  });

  it('prevents creating a cycle when re-parenting', async () => {
    const a = (await api().post('/api/tasks').send({ title: 'A' })).body;
    const b = (
      await api().post(`/api/tasks/${a.id}/subtasks`).send({ title: 'B' })
    ).body;

    await api()
      .patch(`/api/tasks/${a.id}`)
      .send({ parentId: b.id })
      .expect(400);
  });

  it('cascades deletes to the whole subtree', async () => {
    const a = (await api().post('/api/tasks').send({ title: 'A' })).body;
    const b = (
      await api().post(`/api/tasks/${a.id}/subtasks`).send({ title: 'B' })
    ).body;
    await api().post(`/api/tasks/${b.id}/subtasks`).send({ title: 'C' });

    const del = await api().delete(`/api/tasks/${a.id}`).expect(200);
    expect(del.body.deletedCount).toBe(3);
    expect(await prisma.task.count()).toBe(0);
  });

  it('exposes global effort stats over the full hierarchy', async () => {
    const root = (
      await api().post('/api/tasks').send({ title: 'R', status: 'TODO', effort: 2 })
    ).body;
    await api()
      .post(`/api/tasks/${root.id}/subtasks`)
      .send({ title: 'child', status: 'DONE', effort: 10 });

    const { body } = await api().get('/api/tasks/stats').expect(200);
    expect(body.totalEstimated).toBe(12);
    expect(body.notStarted).toBe(2);
    expect(body.completed).toBe(10);
    expect(body.byStatus).toMatchObject({ TODO: 1, DONE: 1 });
  });

  it('filters, sorts and paginates the list view', async () => {
    for (let i = 0; i < 5; i++) {
      await api()
        .post('/api/tasks')
        .send({ title: `T${i}`, priority: i === 0 ? 'URGENT' : 'LOW' });
    }

    const page = await api()
      .get('/api/tasks?scope=all&priority=URGENT')
      .expect(200);
    expect(page.body.total).toBe(1);
    expect(page.body.data[0].priority).toBe('URGENT');

    const paged = await api()
      .get('/api/tasks?scope=all&pageSize=2&page=1')
      .expect(200);
    expect(paged.body.data).toHaveLength(2);
    expect(paged.body.totalPages).toBe(3);
  });
});
