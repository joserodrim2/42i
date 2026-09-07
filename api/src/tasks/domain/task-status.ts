/**
 * Task lifecycle and the transitions allowed between states.
 *
 * The graph reflects how work moves through a small dev team:
 *
 *   BACKLOG ─▶ TODO ─▶ IN_PROGRESS ─▶ IN_REVIEW ─▶ DONE
 *      ▲        │           │             │          │
 *      └────────┴─────< back steps >──────┘          │
 *                                   ▲                │
 *                                   └── reopen ──────┘
 *
 * Any active state can move to BLOCKED, and BLOCKED can move back to any
 * non-terminal state (you resume roughly where you left off).
 */

export const TASK_STATUSES = [
  'BACKLOG',
  'TODO',
  'IN_PROGRESS',
  'IN_REVIEW',
  'DONE',
  'BLOCKED',
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

const TRANSITIONS: Record<TaskStatus, readonly TaskStatus[]> = {
  BACKLOG: ['TODO', 'BLOCKED'],
  TODO: ['IN_PROGRESS', 'BACKLOG', 'BLOCKED'],
  IN_PROGRESS: ['IN_REVIEW', 'DONE', 'TODO', 'BLOCKED'],
  IN_REVIEW: ['DONE', 'IN_PROGRESS', 'BLOCKED'],
  DONE: ['IN_PROGRESS'], // reopen
  BLOCKED: ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW'],
};

export function isTaskStatus(value: unknown): value is TaskStatus {
  return (
    typeof value === 'string' &&
    (TASK_STATUSES as readonly string[]).includes(value)
  );
}

/** Allowed next states from `from` (excludes `from` itself). */
export function allowedTransitions(from: TaskStatus): readonly TaskStatus[] {
  return TRANSITIONS[from];
}

/**
 * Whether a task may move from `from` to `to`.
 * Staying in the same state is always allowed (a no-op update).
 */
export function canTransition(from: TaskStatus, to: TaskStatus): boolean {
  if (from === to) return true;
  return TRANSITIONS[from].includes(to);
}

export class InvalidTransitionError extends Error {
  constructor(
    readonly from: TaskStatus,
    readonly to: TaskStatus,
  ) {
    super(
      `Invalid status transition: ${from} -> ${to}. ` +
        `Allowed from ${from}: ${allowedTransitions(from).join(', ')}.`,
    );
    this.name = 'InvalidTransitionError';
  }
}

/** Throws {@link InvalidTransitionError} when the transition is not allowed. */
export function assertTransition(from: TaskStatus, to: TaskStatus): void {
  if (!canTransition(from, to)) throw new InvalidTransitionError(from, to);
}
