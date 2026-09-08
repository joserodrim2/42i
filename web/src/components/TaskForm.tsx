import { useState, type FormEvent } from 'react'
import {
  ALLOWED_TRANSITIONS,
  EFFORT_SCALE,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type Task,
  type TaskInput,
  type TaskStatus,
} from '../lib/types'

interface Props {
  mode: 'create' | 'edit'
  initial?: Partial<Task>
  /** When editing a task that has subtasks, its estimate is derived — lock the field. */
  hasSubtasks?: boolean
  submitting?: boolean
  error?: string | null
  onSubmit: (input: TaskInput) => void
  onCancel?: () => void
}

export function TaskForm({
  mode,
  initial,
  hasSubtasks = false,
  submitting,
  error,
  onSubmit,
  onCancel,
}: Props) {
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
    const input: TaskInput = {
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      assignee: assignee.trim() === '' ? null : assignee.trim(),
    }
    // A task with subtasks has a derived estimate — never send `effort`.
    if (!hasSubtasks) {
      input.effort = trimmedEffort === '' ? null : Number(trimmedEffort)
    }
    onSubmit(input)
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
          <label htmlFor="effort">Estimate — story points (optional)</label>
          <input
            id="effort"
            type="number"
            min={0}
            step="1"
            placeholder="e.g. 3"
            value={hasSubtasks ? '' : effort}
            disabled={hasSubtasks}
            onChange={(e) => setEffort(e.target.value)}
          />
          {hasSubtasks ? (
            <p className="small muted" style={{ margin: '0.3rem 0 0' }}>
              Derived from subtasks — estimate the subtasks instead.
            </p>
          ) : (
            <div className="row" style={{ gap: '0.3rem', marginTop: '0.35rem' }}>
              {EFFORT_SCALE.map((n) => (
                <button
                  type="button"
                  key={n}
                  className="small ghost"
                  aria-pressed={effort === String(n)}
                  style={
                    effort === String(n)
                      ? { borderColor: 'var(--primary)', color: 'var(--primary)' }
                      : undefined
                  }
                  onClick={() => setEffort(effort === String(n) ? '' : String(n))}
                >
                  {n}
                </button>
              ))}
            </div>
          )}
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
