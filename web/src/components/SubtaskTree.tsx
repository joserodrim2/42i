import { useState } from 'react'
import { Link } from 'react-router-dom'
import { rollupLeafEffort } from '../lib/effort'
import type { TaskNode } from '../lib/types'
import { PriorityBadge, StatusBadge } from './Badges'
import { ChevronRightIcon } from './icons'

interface TreeActions {
  onAddSubtask: (parentId: string) => void
  onDelete: (task: TaskNode) => void
}

interface Props extends TreeActions {
  nodes: TaskNode[]
}

/** Total tasks nested under this node, any depth. */
function countDescendants(node: TaskNode): number {
  return node.subtasks.reduce((n, child) => n + 1 + countDescendants(child), 0)
}

function TreeNode({
  node,
  onAddSubtask,
  onDelete,
}: TreeActions & { node: TaskNode }) {
  const hasChildren = node.subtasks.length > 0
  const [open, setOpen] = useState(true)

  return (
    <div className="ml-2 border-l-2 border-line pl-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-line py-1.5">
        <div className="flex flex-wrap items-center gap-2">
          {hasChildren ? (
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-label={open ? 'Collapse subtasks' : 'Expand subtasks'}
              className="rounded p-0.5 text-muted hover:bg-page hover:text-ink"
            >
              <ChevronRightIcon
                size={14}
                className={`transition-transform ${open ? 'rotate-90' : ''}`}
              />
            </button>
          ) : (
            <span className="w-[22px]" aria-hidden="true" />
          )}
          <StatusBadge status={node.status} />
          <PriorityBadge priority={node.priority} />
          <Link
            to={`/tasks/${node.id}`}
            className="text-brand-600 hover:underline"
          >
            {node.title}
          </Link>
          {hasChildren ? (
            <span className="text-xs text-muted">
              · Σ {rollupLeafEffort(node)} pts
            </span>
          ) : (
            node.effort !== null && (
              <span className="text-xs text-muted">· {node.effort} pts</span>
            )
          )}
          {hasChildren && !open && (
            <span className="text-xs text-muted">
              · {countDescendants(node)} hidden
            </span>
          )}
          {node.assignee && (
            <span className="text-xs text-muted">· {node.assignee}</span>
          )}
        </div>
        <div className="flex gap-1">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => onAddSubtask(node.id)}
          >
            + Subtask
          </button>
          <button
            className="btn btn-danger-subtle btn-sm"
            onClick={() => onDelete(node)}
          >
            Delete
          </button>
        </div>
      </div>
      {hasChildren && open && (
        <div>
          {node.subtasks.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              onAddSubtask={onAddSubtask}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function SubtaskTree({ nodes, onAddSubtask, onDelete }: Props) {
  if (nodes.length === 0) {
    return <p className="text-sm text-muted">No subtasks yet.</p>
  }

  return (
    <div>
      {nodes.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          onAddSubtask={onAddSubtask}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
