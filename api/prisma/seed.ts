import { PrismaClient, TaskPriority, TaskStatus } from '@prisma/client';

const prisma = new PrismaClient();

interface SeedTask {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  /** Only meaningful on leaves (tasks without subtasks); ignored otherwise. */
  effort?: number;
  assignee?: string;
  /** Days before "now" the task was created — spread so date filters/sorting are testable. */
  createdDaysAgo?: number;
  /** Days before "now" the task was last touched (defaults to createdDaysAgo). */
  updatedDaysAgo?: number;
  /** Days from "now" the task is due (negative = already overdue). Omit for no due date. */
  dueInDays?: number;
  subtasks?: SeedTask[];
}

const TASKS: SeedTask[] = [
  {
    title: 'Ship task management MVP',
    description: 'Deliver the first usable version to the team.',
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.HIGH,
    assignee: 'Jose',
    createdDaysAgo: 30,
    updatedDaysAgo: 1,
    dueInDays: 10, // 30/40 elapsed → last third (red)
    subtasks: [
      {
        title: 'Design the data model',
        description: 'Tasks, subtasks, status lifecycle and estimates.',
        status: TaskStatus.DONE,
        priority: TaskPriority.HIGH,
        effort: 3,
        assignee: 'Jose',
        createdDaysAgo: 30,
        updatedDaysAgo: 24,
        dueInDays: -6, // past its date but DONE → stays neutral
      },
      {
        title: 'Build the CRUD API',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        assignee: 'Jose',
        createdDaysAgo: 26,
        updatedDaysAgo: 2,
        dueInDays: 40, // 26/66 elapsed → middle third (orange)
        subtasks: [
          {
            title: 'Task endpoints',
            status: TaskStatus.DONE,
            priority: TaskPriority.MEDIUM,
            effort: 2,
            createdDaysAgo: 26,
            updatedDaysAgo: 18,
          },
          {
            title: 'Effort aggregation endpoint',
            status: TaskStatus.IN_REVIEW,
            priority: TaskPriority.MEDIUM,
            effort: 2,
            createdDaysAgo: 20,
            updatedDaysAgo: 3,
          },
          {
            title: 'Pagination, sorting and filtering',
            status: TaskStatus.TODO,
            priority: TaskPriority.LOW,
            effort: 3,
            createdDaysAgo: 12,
            updatedDaysAgo: 12,
          },
        ],
      },
      {
        title: 'Build the web UI',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        createdDaysAgo: 14,
        updatedDaysAgo: 5,
        dueInDays: 42, // 14/56 elapsed → first third (green)
        subtasks: [
          {
            title: 'Task list view',
            status: TaskStatus.TODO,
            priority: TaskPriority.MEDIUM,
            effort: 3,
            createdDaysAgo: 10,
            updatedDaysAgo: 4,
            dueInDays: 30,
          },
          {
            title: 'Task detail view with subtask tree',
            status: TaskStatus.BACKLOG,
            priority: TaskPriority.MEDIUM,
            effort: 5,
            createdDaysAgo: 7,
            updatedDaysAgo: 7,
          },
        ],
      },
      {
        title: 'Write the README and Docker setup',
        status: TaskStatus.BLOCKED,
        priority: TaskPriority.MEDIUM,
        effort: 2,
        assignee: 'Jose',
        createdDaysAgo: 9,
        updatedDaysAgo: 2,
        dueInDays: -3, // overdue (purple)
      },
    ],
  },
  {
    title: 'Set up CI pipeline',
    description: 'Run lint and tests on every push.',
    status: TaskStatus.BACKLOG,
    priority: TaskPriority.LOW,
    effort: 3,
    createdDaysAgo: 18,
    updatedDaysAgo: 18,
  },
  {
    title: 'Fix flaky login test',
    description: 'Intermittent timeout in the auth suite.',
    status: TaskStatus.TODO,
    priority: TaskPriority.URGENT,
    effort: 1,
    assignee: 'Sam',
    createdDaysAgo: 3,
    updatedDaysAgo: 0,
    dueInDays: 1, // 3/4 elapsed → last third (red)
  },
];

const daysAgo = (n: number): Date =>
  new Date(Date.now() - n * 24 * 60 * 60 * 1000);

/** [taskId, updatedAt] pairs applied after creation (Prisma manages @updatedAt). */
const touchups: { id: string; updatedAt: Date }[] = [];

async function createTree(
  node: SeedTask,
  parentId: string | null,
): Promise<void> {
  const isLeaf = !node.subtasks || node.subtasks.length === 0;
  const createdDaysAgo = node.createdDaysAgo ?? 0;
  const created = await prisma.task.create({
    data: {
      title: node.title,
      description: node.description ?? '',
      status: node.status ?? TaskStatus.BACKLOG,
      priority: node.priority ?? TaskPriority.MEDIUM,
      effort: isLeaf ? (node.effort ?? null) : null,
      assignee: node.assignee ?? null,
      dueDate:
        node.dueInDays === undefined ? null : daysAgo(-node.dueInDays),
      parentId,
      createdAt: daysAgo(createdDaysAgo),
    },
  });
  touchups.push({
    id: created.id,
    updatedAt: daysAgo(node.updatedDaysAgo ?? createdDaysAgo),
  });
  for (const child of node.subtasks ?? []) await createTree(child, created.id);
}

async function main(): Promise<void> {
  await prisma.task.deleteMany();
  touchups.length = 0;
  for (const root of TASKS) await createTree(root, null);
  for (const { id, updatedAt } of touchups) {
    await prisma.$executeRaw`UPDATE "Task" SET "updatedAt" = ${updatedAt} WHERE id = ${id}`;
  }
  const count = await prisma.task.count();
  console.log(`Seeded ${count} tasks with spread-out dates.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
