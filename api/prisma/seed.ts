import { PrismaClient, TaskPriority, TaskStatus } from '@prisma/client';

const prisma = new PrismaClient();

interface SeedTask {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  effort?: number;
  assignee?: string;
  subtasks?: SeedTask[];
}

const TASKS: SeedTask[] = [
  {
    title: 'Ship task management MVP',
    description: 'Deliver the first usable version to the team.',
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.HIGH,
    assignee: 'Jose',
    subtasks: [
      {
        title: 'Design the data model',
        description: 'Tasks, subtasks, status lifecycle and estimates.',
        status: TaskStatus.DONE,
        priority: TaskPriority.HIGH,
        effort: 3,
        assignee: 'Jose',
      },
      {
        title: 'Build the CRUD API',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        effort: 5,
        assignee: 'Jose',
        subtasks: [
          {
            title: 'Task endpoints',
            status: TaskStatus.DONE,
            priority: TaskPriority.MEDIUM,
            effort: 2,
          },
          {
            title: 'Effort aggregation endpoint',
            status: TaskStatus.IN_REVIEW,
            priority: TaskPriority.MEDIUM,
            effort: 2,
          },
          {
            title: 'Pagination, sorting and filtering',
            status: TaskStatus.TODO,
            priority: TaskPriority.LOW,
            effort: 3,
          },
        ],
      },
      {
        title: 'Build the web UI',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        effort: 8,
        subtasks: [
          {
            title: 'Task list view',
            status: TaskStatus.TODO,
            priority: TaskPriority.MEDIUM,
            effort: 3,
          },
          {
            title: 'Task detail view with subtask tree',
            status: TaskStatus.BACKLOG,
            priority: TaskPriority.MEDIUM,
            effort: 5,
          },
        ],
      },
      {
        title: 'Write the README and Docker setup',
        status: TaskStatus.BLOCKED,
        priority: TaskPriority.MEDIUM,
        effort: 2,
        assignee: 'Jose',
      },
    ],
  },
  {
    title: 'Set up CI pipeline',
    description: 'Run lint and tests on every push.',
    status: TaskStatus.BACKLOG,
    priority: TaskPriority.LOW,
    effort: 3,
  },
  {
    title: 'Fix flaky login test',
    description: 'Intermittent timeout in the auth suite.',
    status: TaskStatus.TODO,
    priority: TaskPriority.URGENT,
    effort: 1,
    assignee: 'Sam',
  },
];

async function createTree(node: SeedTask, parentId: string | null): Promise<void> {
  const created = await prisma.task.create({
    data: {
      title: node.title,
      description: node.description ?? '',
      status: node.status ?? TaskStatus.BACKLOG,
      priority: node.priority ?? TaskPriority.MEDIUM,
      effort: node.effort ?? null,
      assignee: node.assignee ?? null,
      parentId,
    },
  });
  for (const child of node.subtasks ?? []) await createTree(child, created.id);
}

async function main(): Promise<void> {
  await prisma.task.deleteMany();
  for (const root of TASKS) await createTree(root, null);
  const count = await prisma.task.count();
  console.log(`Seeded ${count} tasks.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
