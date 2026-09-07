import { Link } from 'react-router-dom'
import type { TaskNode } from '../lib/types'
import { PriorityBadge, StatusBadge } from './Badges'

interface Props {
  nodes: TaskNode[]
  onAddSubtask: (parentId: string) => void
  onDelete: (task: TaskNode) => void
}

export function SubtaskTree({ nodes, onAddSubtask, onDelete }: Props) {
  if (nodes.length === 0) {
    return <p className="muted small">No subtasks yet.</p>
  }

  return (
    <div>
      {nodes.map((node) => (
        <div className="tree-node" key={node.id}>
          <div className="tree-row row spread">
            <div className="row" style={{ gap: '0.5rem' }}>
              <StatusBadge status={node.status} />
              <PriorityBadge priority={node.priority} />
              <Link to={`/tasks/${node.id}`}>{node.title}</Link>
              {node.effort !== null && (
                <span className="muted small">· {node.effort} pts</span>
              )}
              {node.assignee && (
                <span className="muted small">· {node.assignee}</span>
              )}
            </div>
            <div className="row" style={{ gap: '0.25rem' }}>
              <button className="ghost small" onClick={() => onAddSubtask(node.id)}>
                + Subtask
              </button>
              <button className="ghost small danger" onClick={() => onDelete(node)}>
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
