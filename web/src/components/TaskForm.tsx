import { useState, type FormEvent } from 'react'
import { PRIORITY_LABEL, STATUS_STYLE } from '../lib/taskStyles'
import {
  ALLOWED_TRANSITIONS,
  EFFORT_MAX,
  EFFORT_MIN,
  FIELD_LIMITS,
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

type FieldName = 'title' | 'description' | 'assignee'

const inputCls = (invalid: boolean) =>
  `field${invalid ? ' border-blocked-fg focus:border-blocked-fg focus:ring-blocked/40' : ''}`

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
  const [effort, setEffort] = useState<number | null>(
    typeof initial?.effort === 'number' ? initial.effort : null,
  )
  const [assignee, setAssignee] = useState(initial?.assignee ?? '')
  // <input type="date"> wants a bare YYYY-MM-DD; the API sends a full ISO string.
  const [dueDate, setDueDate] = useState(initial?.dueDate?.slice(0, 10) ?? '')
  const [touched, setTouched] = useState<Set<FieldName>>(new Set())

  const statusOptions =
    mode === 'edit' && initial?.status
      ? [initial.status, ...ALLOWED_TRANSITIONS[initial.status]]
      : TASK_STATUSES

  const errors: Partial<Record<FieldName, string>> = {}
  if (title.trim().length === 0) errors.title = 'Title is required'
  else if (title.trim().length > FIELD_LIMITS.title)
    errors.title = `Title must be ${FIELD_LIMITS.title} characters or fewer`
  if (description.length > FIELD_LIMITS.description)
    errors.description = `Description must be ${FIELD_LIMITS.description} characters or fewer`
  if (assignee.trim().length > FIELD_LIMITS.assignee)
    errors.assignee = `Assignee must be ${FIELD_LIMITS.assignee} characters or fewer`

  const show = (f: FieldName) => touched.has(f) && errors[f]
  const markTouched = (f: FieldName) =>
    setTouched((t) => new Set(t).add(f))

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setTouched(new Set<FieldName>(['title', 'description', 'assignee']))
    if (Object.keys(errors).length > 0) return

    const trimmedAssignee = assignee.trim()
    const input: TaskInput = {
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      assignee: trimmedAssignee === '' ? null : trimmedAssignee,
      dueDate: dueDate === '' ? null : dueDate,
    }
    // A task with subtasks has a derived estimate — never send `effort`.
    if (!hasSubtasks) input.effort = effort
    onSubmit(input)
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col gap-1">
        <label className="form-label" htmlFor="title">
          Title <span className="text-blocked-fg">*</span>
        </label>
        <input
          id="title"
          className={inputCls(!!show('title'))}
          required
          maxLength={FIELD_LIMITS.title}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => markTouched('title')}
          aria-invalid={!!show('title')}
          autoFocus
        />
        {show('title') && (
          <p className="text-xs text-blocked-fg">{errors.title}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label className="form-label" htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          className={`${inputCls(!!show('description'))} min-h-16 resize-y`}
          maxLength={FIELD_LIMITS.description}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => markTouched('description')}
        />
        {(show('description') ||
          description.length > FIELD_LIMITS.description - 500) && (
          <div className="flex justify-between text-xs">
            <span className="text-blocked-fg">
              {show('description') ? errors.description : ''}
            </span>
            <span className="text-muted">
              {description.length}/{FIELD_LIMITS.description}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
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
                {STATUS_STYLE[s].label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
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
                {PRIORITY_LABEL[p]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label className="form-label" htmlFor="dueDate">
            Due date
          </label>
          <input
            id="dueDate"
            type="date"
            className="field"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="form-label" htmlFor="assignee">
            Assignee
          </label>
          <input
            id="assignee"
            className={inputCls(!!show('assignee'))}
            maxLength={FIELD_LIMITS.assignee}
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            onBlur={() => markTouched('assignee')}
            aria-invalid={!!show('assignee')}
          />
          {show('assignee') && (
            <p className="text-xs text-blocked-fg">{errors.assignee}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="form-label">Estimate</label>
        {hasSubtasks ? (
          <p className="text-xs text-muted">
            Derived from subtasks — estimate the subtasks instead.
          </p>
        ) : (
          <>
            <p className="text-xs text-muted">
              Points · {EFFORT_MIN} = trivial, {EFFORT_MAX} = very large
            </p>
            <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-10">
              {EFFORT_POINTS.map((n) => (
                <button
                  type="button"
                  key={n}
                  className={`flex h-9 items-center justify-center rounded-md border text-sm font-medium transition-colors ${
                    effort === n
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-line bg-surface text-ink hover:bg-page'
                  }`}
                  aria-pressed={effort === n}
                  onClick={() => setEffort(effort === n ? null : n)}
                >
                  {n}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {error && (
        <p className="rounded-lg border border-blocked bg-blocked px-3 py-2 text-sm text-blocked-fg">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : mode === 'create' ? 'Create task' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}
