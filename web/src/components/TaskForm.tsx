import { useState, type FormEvent } from 'react'
import {
  ALLOWED_TRANSITIONS,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type Task,
  type TaskInput,
  type TaskStatus,
} from '../lib/types'

interface Props {
  mode: 'create' | 'edit'
  initial?: Partial<Task>
  submitting?: boolean
  error?: string | null
  onSubmit: (input: TaskInput) => void
  onCancel?: () => void
}

export function TaskForm({ mode, initial, submitting, error, onSubmit, onCancel }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [status, setStatus] = useState<TaskStatus>(initial?.status ?? 'BACKLOG')
  const [priority, setPriority] = useState(initial?.priority ?? 'MEDIUM')
  const [effort, setEffort] = useState(
    initial?.effort === null || initial?.effort === undefined
      ? ''
      : String(initial.effort),
  )
  const [assignee, setAssignee] = useState(initial?.assignee ?? '')

  const statusOptions =
    mode === 'edit' && initial?.status
      ? [initial.status, ...ALLOWED_TRANSITIONS[initial.status]]
      : TASK_STATUSES

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmedEffort = effort.trim()
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      effort: trimmedEffort === '' ? null : Number(trimmedEffort),
      assignee: assignee.trim() === '' ? null : assignee.trim(),
    })
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="title">Title</label>
        <input
          id="title"
          required
          maxLength={200}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
      </div>

      <div>
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          maxLength={5000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="row">
        <div style={{ flex: 1 }}>
          <label htmlFor="status">Status</label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="priority">Priority</label>
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Task['priority'])}
          >
            {TASK_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="row">
        <div style={{ flex: 1 }}>
          <label htmlFor="effort">Effort estimate (optional)</label>
          <input
            id="effort"
            type="number"
            min={0}
            step="0.5"
            placeholder="e.g. 3"
            value={effort}
            onChange={(e) => setEffort(e.target.value)}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label htmlFor="assignee">Assignee (optional)</label>
          <input
            id="assignee"
            maxLength={120}
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
          />
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="row" style={{ justifyContent: 'flex-end' }}>
        {onCancel && (
          <button type="button" className="ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="primary" disabled={submitting || !title.trim()}>
          {submitting ? 'Saving…' : mode === 'create' ? 'Create task' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}
