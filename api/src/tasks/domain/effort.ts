import { TaskStatus } from './task-status';

/**
 * Effort aggregation over a set of tasks.
 *
 * Callers pass a flat list of nodes (a task plus every descendant, or every
 * task in the system for the global figures). This function is pure so the
 * business rules below are covered directly by unit tests.
 *
 * Status -> bucket mapping:
 *   notStarted : BACKLOG, TODO            (work the team has not begun)
 *   inProgress : IN_PROGRESS, IN_REVIEW   (work actively moving)
 *   blocked    : BLOCKED                  (started but stalled; reported apart)
 *   completed  : DONE
 *
 * `totalEstimated` is the sum of every estimate regardless of status.
 * `remaining` is everything not yet DONE (notStarted + inProgress + blocked).
 * Tasks without an estimate contribute 0 and are counted in `unestimatedCount`.
 */

export interface EffortNode {
  status: TaskStatus;
  effort?: number | null;
}

export interface EffortStats {
  totalEstimated: number;
  notStarted: number;
  inProgress: number;
  blocked: number;
  completed: number;
  remaining: number;
  taskCount: number;
  estimatedCount: number;
  unestimatedCount: number;
}

const NOT_STARTED: ReadonlySet<TaskStatus> = new Set<TaskStatus>(['BACKLOG', 'TODO']);
const IN_PROGRESS: ReadonlySet<TaskStatus> = new Set<TaskStatus>([
  'IN_PROGRESS',
  'IN_REVIEW',
]);

/** Normalises a raw estimate to a finite, non-negative number (or null). */
export function normalizeEffort(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`Effort must be a finite number, received: ${String(value)}`);
  }
  if (value < 0) {
    throw new RangeError(`Effort must be non-negative, received: ${value}`);
  }
  return value;
}

export function computeEffortStats(nodes: readonly EffortNode[]): EffortStats {
  const stats: EffortStats = {
    totalEstimated: 0,
    notStarted: 0,
    inProgress: 0,
    blocked: 0,
    completed: 0,
    remaining: 0,
    taskCount: nodes.length,
    estimatedCount: 0,
    unestimatedCount: 0,
  };

  for (const node of nodes) {
    const effort = node.effort ?? null;
    if (effort === null) {
      stats.unestimatedCount += 1;
    } else {
      stats.estimatedCount += 1;
      stats.totalEstimated += effort;

      if (NOT_STARTED.has(node.status)) stats.notStarted += effort;
      else if (IN_PROGRESS.has(node.status)) stats.inProgress += effort;
      else if (node.status === 'BLOCKED') stats.blocked += effort;
      else if (node.status === 'DONE') stats.completed += effort;
    }
  }

  stats.remaining = round(stats.notStarted + stats.inProgress + stats.blocked);
  stats.totalEstimated = round(stats.totalEstimated);
  stats.notStarted = round(stats.notStarted);
  stats.inProgress = round(stats.inProgress);
  stats.blocked = round(stats.blocked);
  stats.completed = round(stats.completed);
  return stats;
}

/** Guards against floating-point drift when summing fractional estimates. */
function round(n: number): number {
  return Math.round((n + Number.EPSILON) * 1e6) / 1e6;
}
