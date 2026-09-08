import type { TaskNode } from './types'

/**
 * Sum of leaf estimates in a subtree (mirrors the API's leaves-only model).
 * A node with subtasks contributes nothing itself; its leaves do.
 */
export function rollupLeafEffort(node: TaskNode): number {
  if (node.subtasks.length === 0) return node.effort ?? 0
  return node.subtasks.reduce((sum, child) => sum + rollupLeafEffort(child), 0)
}

/** How a task's effort should read in a list: own points, or a rolled-up sum. */
export function effortLabel(task: {
  effort: number | null
  subtaskCount?: number
  rollup?: { totalEstimated: number }
}): string {
  if (task.subtaskCount && task.rollup) return `Σ ${task.rollup.totalEstimated}`
  return task.effort === null ? '—' : String(task.effort)
}
