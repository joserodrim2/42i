/**
 * Pure helpers for the task tree (adjacency list -> nested structure and back).
 * Kept framework-free so the hierarchy rules are unit-tested in isolation.
 */

export interface TaskLike {
  id: string;
  parentId: string | null;
}

export type TreeNode<T extends TaskLike> = T & { subtasks: TreeNode<T>[] };

/**
 * Builds nested trees from a flat list. Nodes whose parent is not present in
 * the list (or is null) become roots, so passing a subtree slice still works.
 * Sibling order follows input order.
 */
export function buildTree<T extends TaskLike>(
  tasks: readonly T[],
): TreeNode<T>[] {
  const byId = new Map<string, TreeNode<T>>();
  for (const task of tasks) byId.set(task.id, { ...task, subtasks: [] });

  const roots: TreeNode<T>[] = [];
  for (const task of tasks) {
    const node = byId.get(task.id)!;
    const parent = task.parentId ? byId.get(task.parentId) : undefined;
    if (parent) parent.subtasks.push(node);
    else roots.push(node);
  }
  return roots;
}

/** Ids of `rootId` and every descendant, using the flat list as the edge set. */
export function collectSubtreeIds(
  tasks: readonly TaskLike[],
  rootId: string,
): Set<string> {
  const childrenByParent = new Map<string, string[]>();
  for (const task of tasks) {
    if (!task.parentId) continue;
    const siblings = childrenByParent.get(task.parentId) ?? [];
    siblings.push(task.id);
    childrenByParent.set(task.parentId, siblings);
  }

  const result = new Set<string>();
  const stack = [rootId];
  while (stack.length > 0) {
    const current = stack.pop()!;
    if (result.has(current)) continue; // defensive: tolerate pre-existing cycles
    result.add(current);
    for (const child of childrenByParent.get(current) ?? []) stack.push(child);
  }
  return result;
}

export function isDescendantOf(
  tasks: readonly TaskLike[],
  nodeId: string,
  ancestorId: string,
): boolean {
  if (nodeId === ancestorId) return false;
  return collectSubtreeIds(tasks, ancestorId).has(nodeId);
}

/**
 * Whether re-parenting `taskId` under `newParentId` would create a cycle:
 * true when the new parent is the task itself or one of its descendants.
 */
export function wouldCreateCycle(
  tasks: readonly TaskLike[],
  taskId: string,
  newParentId: string | null,
): boolean {
  if (!newParentId) return false;
  if (newParentId === taskId) return true;
  return collectSubtreeIds(tasks, taskId).has(newParentId);
}
