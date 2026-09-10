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
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
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

  it('stores a bare due date as end-of-day, returns it and clears it', async () => {
    const created = await api()
      .post('/api/tasks')
      .send({ title: 'Ship it', dueDate: '2026-10-15' })
      .expect(201);
    expect(created.body.dueDate).toBe('2026-10-15T23:59:59.999Z');

    const cleared = await api()
      .patch(`/api/tasks/${created.body.id}`)
      .send({ dueDate: null })
      .expect(200);
    expect(cleared.body.dueDate).toBeNull();
  });

  it('rejects a malformed or impossible due date with 400', async () => {
    await api()
      .post('/api/tasks')
      .send({ title: 'x', dueDate: 'not-a-date' })
      .expect(400);
    // Impossible calendar date — must not silently roll over to March.
    await api()
      .post('/api/tasks')
      .send({ title: 'y', dueDate: '2026-02-30' })
      .expect(400);
    await api()
      .post('/api/tasks')
      .send({ title: 'z', dueDate: '2026' })
      .expect(400);
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

  it('accepts any sane non-negative effort, rejects negative or absurd', async () => {
    await api().post('/api/tasks').send({ title: 'x', effort: -2 }).expect(400);
    await api().post('/api/tasks').send({ title: 'y', effort: 13 }).expect(201);
    await api()
      .post('/api/tasks')
      .send({ title: 'z', effort: 2.5 })
      .expect(201);
    // Sanity cap — keeps one fat-fingered value from poisoning the global stats.
    await api()
      .post('/api/tasks')
      .send({ title: 'w', effort: 1e12 })
      .expect(400);
  });

  it('rejects a blank title on create and on update', async () => {
    await api().post('/api/tasks').send({ title: '' }).expect(400);
    await api().post('/api/tasks').send({ title: '   ' }).expect(400);

    const { body } = await api().post('/api/tasks').send({ title: 'ok' });
    await api()
      .patch(`/api/tasks/${body.id}`)
      .send({ title: '  ' })
      .expect(400);
  });

  it('trims surrounding whitespace from text fields', async () => {
    const { body } = await api()
      .post('/api/tasks')
      .send({ title: '  Padded  ', assignee: '  Sam  ' })
      .expect(201);
    expect(body.title).toBe('Padded');
    expect(body.assignee).toBe('Sam');
  });

  it('rejects over-long fields with 400', async () => {
    await api()
      .post('/api/tasks')
      .send({ title: 'x'.repeat(201) })
      .expect(400);
    await api()
      .post('/api/tasks')
      .send({ title: 'x', description: 'd'.repeat(5001) })
      .expect(400);
    await api()
      .post('/api/tasks')
      .send({ title: 'x', assignee: 'a'.repeat(121) })
      .expect(400);
  });

  it('treats % and _ in search as literal characters', async () => {
    await api().post('/api/tasks').send({ title: 'plain task' });
    await api().post('/api/tasks').send({ title: '50% done' });

    const all = await api().get('/api/tasks?scope=all&search=%25').expect(200);
    expect(all.body.data).toHaveLength(1);
    expect(all.body.data[0].title).toBe('50% done');
  });

  it('caps the page parameter', async () => {
    await api().get('/api/tasks?page=999999999').expect(400);
  });

  it('rolls up effort over a multi-level hierarchy, counting only leaves', async () => {
    // Epic > Story(TODO) > [Design(TODO,3), Build(IN_PROGRESS,8)]; Epic > Docs(TODO,5)
    const epic = (
      await api()
        .post('/api/tasks')
        .send({ title: 'Epic', status: 'IN_PROGRESS' })
    ).body;
    const story = (
      await api()
        .post(`/api/tasks/${epic.id}/subtasks`)
        .send({ title: 'Story', status: 'TODO' })
    ).body;
    await api()
      .post(`/api/tasks/${story.id}/subtasks`)
      .send({ title: 'Design', status: 'TODO', effort: 3 })
      .expect(201);
    await api()
      .post(`/api/tasks/${story.id}/subtasks`)
      .send({ title: 'Build', status: 'IN_PROGRESS', effort: 8 });
    await api()
      .post(`/api/tasks/${epic.id}/subtasks`)
      .send({ title: 'Docs', status: 'TODO', effort: 5 });

    const detail = await api().get(`/api/tasks/${epic.id}`).expect(200);
    expect(detail.body.subtasks).toHaveLength(2);
    expect(detail.body.rollup).toMatchObject({
      notStarted: 8, // Design 3 + Docs 5
      inProgress: 8, // Build 8
      totalEstimated: 16,
      taskCount: 5,
      leafCount: 3, // Design, Build, Docs
    });
  });

  it('drops a task’s own estimate once it gains a subtask', async () => {
    const parent = (
      await api().post('/api/tasks').send({ title: 'Was a leaf', effort: 5 })
    ).body;
    expect(parent.effort).toBe(5);

    await api()
      .post(`/api/tasks/${parent.id}/subtasks`)
      .send({ title: 'child', effort: 2 })
      .expect(201);

    const reloaded = await api().get(`/api/tasks/${parent.id}`).expect(200);
    expect(reloaded.body.effort).toBeNull();
    expect(reloaded.body.rollup.totalEstimated).toBe(2);
  });

  it('rejects giving an own estimate to a task that has subtasks', async () => {
    const parent = (await api().post('/api/tasks').send({ title: 'P' })).body;
    await api().post(`/api/tasks/${parent.id}/subtasks`).send({ title: 'C' });

    await api()
      .patch(`/api/tasks/${parent.id}`)
      .send({ effort: 8 })
      .expect(400);
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

  it('exposes global effort stats over the full hierarchy (leaves only)', async () => {
    const root = (
      await api().post('/api/tasks').send({ title: 'R', status: 'TODO' })
    ).body;
    await api()
      .post(`/api/tasks/${root.id}/subtasks`)
      .send({ title: 'a', status: 'TODO', effort: 2 });
    await api()
      .post(`/api/tasks/${root.id}/subtasks`)
      .send({ title: 'b', status: 'DONE', effort: 10 });

    const { body } = await api().get('/api/tasks/stats').expect(200);
    expect(body.totalEstimated).toBe(12);
    expect(body.notStarted).toBe(2);
    expect(body.completed).toBe(10);
    expect(body.leafCount).toBe(2);
    expect(body.byStatus).toMatchObject({ TODO: 2, DONE: 1 });
  });

  it('lists distinct assignees in use and filters by assignee', async () => {
    await api().post('/api/tasks').send({ title: 'a', assignee: 'Ada' });
    await api().post('/api/tasks').send({ title: 'b', assignee: 'Ada' });
    await api().post('/api/tasks').send({ title: 'c', assignee: 'Grace' });
    await api().post('/api/tasks').send({ title: 'd' });

    const { body: names } = await api().get('/api/tasks/assignees').expect(200);
    expect(names).toEqual(['Ada', 'Grace']);

    const filtered = await api()
      .get('/api/tasks?scope=all&assignee=ada')
      .expect(200);
    expect(filtered.body.total).toBe(2);
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
