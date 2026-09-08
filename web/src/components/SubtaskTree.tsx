import { Link } from 'react-router-dom'
import { rollupLeafEffort } from '../lib/effort'
import type { TaskNode } from '../lib/types'
import { PriorityBadge, StatusBadge } from './Badges'

interface Props {
  nodes: TaskNode[]
  onAddSubtask: (parentId: string) => void
  onDelete: (task: TaskNode) => void
}

export function SubtaskTree({ nodes, onAddSubtask, onDelete }: Props) {
  if (nodes.length === 0) {
    return <p className="text-sm text-slate-500">No subtasks yet.</p>
  }

  return (
    <div>
      {nodes.map((node) => (
        <div className="ml-2 border-l-2 border-slate-200 pl-3" key={node.id}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-slate-200 py-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={node.status} />
              <PriorityBadge priority={node.priority} />
              <Link to={`/tasks/${node.id}`} className="text-brand-600 hover:underline">
                {node.title}
              </Link>
              {node.subtasks.length > 0 ? (
                <span className="text-xs text-slate-500">
                  · Σ {rollupLeafEffort(node)} pts
                </span>
              ) : (
                node.effort !== null && (
                  <span className="text-xs text-slate-500">· {node.effort} pts</span>
                )
              )}
              {node.assignee && (
                <span className="text-xs text-slate-500">· {node.assignee}</span>
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
                className="btn btn-ghost btn-danger btn-sm"
                onClick={() => onDelete(node)}
              >
                Delete
              </button>
            </div>
          </div>
          {node.subtasks.length > 0 && (
            <SubtaskTree
              nodes={node.subtasks}
              onAddSubtask={onAddSubtask}
              onDelete={onDelete}
            />
          )}
        </div>
      ))}
    </div>
  )
}
