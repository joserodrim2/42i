import { useState, type FormEvent } from 'react'
import {
  ALLOWED_TRANSITIONS,
  EFFORT_MAX,
  EFFORT_MIN,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type Task,
  type TaskInput,
  type TaskStatus,
} from '../lib/types'

const EFFORT_POINTS = Array.from(
  { length: EFFORT_MAX - EFFORT_MIN + 1 },
  (_, i) => EFFORT_MIN + i,
)

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
    <form className="flex flex-col gap-3.5" onSubmit={handleSubmit}>
      <div>
        <label className="form-label" htmlFor="title">
          Title
        </label>
        <input
          id="title"
          className="field"
          required
          maxLength={200}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
      </div>

      <div>
        <label className="form-label" htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          className="field min-h-16 resize-y"
          maxLength={5000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="min-w-32 flex-1">
          <label className="form-label" htmlFor="status">
            Status
          </label>
          <select
            id="status"
            className="field"
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
        <div className="min-w-32 flex-1">
          <label className="form-label" htmlFor="priority">
            Priority
          </label>
          <select
            id="priority"
            className="field"
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

      <div className="flex flex-wrap gap-3">
        <div className="min-w-40 flex-1">
          <label className="form-label" htmlFor="effort">
            Estimate — effort points, 1–10 (optional)
          </label>
          <input
            id="effort"
            className="field"
            type="number"
            min={EFFORT_MIN}
            max={EFFORT_MAX}
            step="1"
            placeholder="1 = trivial · 10 = very large"
            value={hasSubtasks ? '' : effort}
            disabled={hasSubtasks}
            onChange={(e) => setEffort(e.target.value)}
          />
          {hasSubtasks ? (
            <p className="mt-1 text-xs text-slate-500">
              Derived from subtasks — estimate the subtasks instead.
            </p>
          ) : (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {EFFORT_POINTS.map((n) => (
                <button
                  type="button"
                  key={n}
                  className={`btn btn-sm min-w-9 justify-center ${
                    effort === String(n)
                      ? 'border-brand-500 bg-brand-50 text-brand-600'
                      : ''
                  }`}
                  aria-pressed={effort === String(n)}
                  onClick={() => setEffort(effort === String(n) ? '' : String(n))}
                >
                  {n}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="min-w-40 flex-1">
          <label className="form-label" htmlFor="assignee">
            Assignee (optional)
          </label>
          <input
            id="assignee"
            className="field"
            maxLength={120}
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting || !title.trim()}
        >
          {submitting ? 'Saving…' : mode === 'create' ? 'Create task' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}
