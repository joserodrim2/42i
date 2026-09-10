import { TaskStatus } from './task-status';

/**
 * Effort aggregation over a set of tasks.
 *
 * Estimation model: **only leaf tasks carry an estimate.** A task that has
 * subtasks is estimated implicitly by the sum of its subtree, so this function
 * ignores the `effort` of any node that is a parent within the given set.
 * Callers pass a flat list of nodes (a task plus every descendant, or every
 * task in the system for the global figures); leaf-ness is derived from that
 * list. Pure, so the rules below are covered directly by unit tests.
 *
 * An estimate is any non-negative number. The web UI presents a 1-10 scale by
 * team convention, but nothing here (or in the API) enforces that.
 *
 * Status -> bucket mapping (leaf tasks only):
 *   notStarted : BACKLOG, TODO            (work the team has not begun)
 *   inProgress : IN_PROGRESS, IN_REVIEW   (work actively moving)
 *   blocked    : BLOCKED                  (started but stalled; reported apart)
 *   completed  : DONE
 *
 * `totalEstimated` is the sum of every leaf estimate regardless of status.
 * `remaining` is everything not yet DONE (notStarted + inProgress + blocked).
 */

export interface EffortNode {
  id: string;
  parentId: string | null;
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
  leafCount: number;
  /** Leaf tasks that have an estimate. */
  estimatedCount: number;
  /** Leaf tasks still missing an estimate. */
  unestimatedCount: number;
}

const NOT_STARTED: ReadonlySet<TaskStatus> = new Set<TaskStatus>([
  'BACKLOG',
  'TODO',
]);
const IN_PROGRESS: ReadonlySet<TaskStatus> = new Set<TaskStatus>([
  'IN_PROGRESS',
  'IN_REVIEW',
]);

/** Normalises a raw estimate to a finite, non-negative number (or null). */
export function normalizeEffort(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(
      `Effort must be a finite number, received: ${JSON.stringify(value)}`,
    );
  }
  if (value < 0) {
    throw new RangeError(`Effort must be non-negative, received: ${value}`);
  }
  return value;
}

export function computeEffortStats(nodes: readonly EffortNode[]): EffortStats {
  const parentIds = new Set<string>();
  for (const node of nodes) {
    if (node.parentId) parentIds.add(node.parentId);
  }
  const isLeaf = (node: EffortNode): boolean => !parentIds.has(node.id);

  const stats: EffortStats = {
    totalEstimated: 0,
    notStarted: 0,
    inProgress: 0,
    blocked: 0,
    completed: 0,
    remaining: 0,
    taskCount: nodes.length,
    leafCount: 0,
    estimatedCount: 0,
    unestimatedCount: 0,
  };

  for (const node of nodes) {
    if (!isLeaf(node)) continue; // parents are estimated by their subtree
    stats.leafCount += 1;

    const effort = node.effort ?? null;
    if (effort === null) {
      stats.unestimatedCount += 1;
      continue;
    }
    stats.estimatedCount += 1;
    stats.totalEstimated += effort;

    if (NOT_STARTED.has(node.status)) stats.notStarted += effort;
    else if (IN_PROGRESS.has(node.status)) stats.inProgress += effort;
    else if (node.status === 'BLOCKED') stats.blocked += effort;
    else if (node.status === 'DONE') stats.completed += effort;
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
