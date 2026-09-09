import type { TaskNode } from './types'

/**
 * Sum of leaf estimates in a subtree (mirrors the API's leaves-only model).
 * A node with subtasks contributes nothing itself; its leaves do.
 */
export function rollupLeafEffort(node: TaskNode): number {
  if (node.subtasks.length === 0) return node.effort ?? 0
  return node.subtasks.reduce((sum, child) => sum + rollupLeafEffort(child), 0)
}

/**
 * How a task's effort reads across the UI — identical wording in the list card
 * and the detail header. A task with subtasks shows its rolled-up subtree sum;
 * a leaf shows its own points, or "No estimate".
 */
export function effortText(task: {
  effort: number | null
  subtaskCount?: number
  rollup?: { totalEstimated: number }
}): string {
  if (task.subtaskCount && task.rollup) {
    return `${task.rollup.totalEstimated} pts`
  }
  if (task.effort === null) return 'No estimate'
  return `${task.effort} pt${task.effort === 1 ? '' : 's'}`
}
