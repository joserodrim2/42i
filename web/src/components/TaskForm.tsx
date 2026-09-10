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

type FieldName = 'title' | 'description' | 'assignee' | 'effort'

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
  const [effort, setEffort] = useState(
    initial?.effort === null || initial?.effort === undefined
      ? ''
      : String(initial.effort),
  )
  const [assignee, setAssignee] = useState(initial?.assignee ?? '')
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
  if (effort !== '') {
    const n = Number(effort)
    if (!Number.isInteger(n) || n < EFFORT_MIN || n > EFFORT_MAX)
      errors.effort = `Estimate must be a whole number from ${EFFORT_MIN} to ${EFFORT_MAX}`
  }

  const show = (f: FieldName) => touched.has(f) && errors[f]

  function markTouched(f: FieldName) {
    setTouched((t) => new Set(t).add(f))
  }

  /** Keep only digits and cap at EFFORT_MAX so the field can't hold junk. */
  function onEffortChange(raw: string) {
    const digits = raw.replace(/\D/g, '')
    if (digits === '') return setEffort('')
    setEffort(String(Math.min(Number(digits), EFFORT_MAX)))
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setTouched(new Set<FieldName>(['title', 'description', 'assignee', 'effort']))
    if (Object.keys(errors).length > 0) return

    const trimmedAssignee = assignee.trim()
    const input: TaskInput = {
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      assignee: trimmedAssignee === '' ? null : trimmedAssignee,
    }
    // A task with subtasks has a derived estimate — never send `effort`.
    if (!hasSubtasks) {
      input.effort = effort === '' ? null : Number(effort)
    }
    onSubmit(input)
  }

  return (
    <form className="flex flex-col gap-3.5" onSubmit={handleSubmit} noValidate>
      <div>
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
        {show('title') && <p className="mt-1 text-xs text-blocked-fg">{errors.title}</p>}
      </div>

      <div>
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
        <div className="mt-1 flex justify-between text-xs text-backlog-fg">
          <span className="text-blocked-fg">{show('description') ? errors.description : ''}</span>
          {description.length > FIELD_LIMITS.description - 500 && (
            <span>
              {description.length}/{FIELD_LIMITS.description}
            </span>
          )}
        </div>
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
                {STATUS_STYLE[s].label}
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
                {PRIORITY_LABEL[p]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="min-w-40 flex-1">
          <label className="form-label" htmlFor="effort">
            Estimate — effort points, {EFFORT_MIN}–{EFFORT_MAX} (optional)
          </label>
          <input
            id="effort"
            className={inputCls(!!show('effort'))}
            type="text"
            inputMode="numeric"
            placeholder={`${EFFORT_MIN} = trivial · ${EFFORT_MAX} = very large`}
            value={hasSubtasks ? '' : effort}
            disabled={hasSubtasks}
            onChange={(e) => onEffortChange(e.target.value)}
            onBlur={() => {
              markTouched('effort')
              if (effort !== '' && Number(effort) < EFFORT_MIN)
                setEffort(String(EFFORT_MIN))
            }}
            aria-invalid={!!show('effort')}
          />
          {hasSubtasks ? (
            <p className="mt-1 text-xs text-muted">
              Derived from subtasks — estimate the subtasks instead.
            </p>
          ) : show('effort') ? (
            <p className="mt-1 text-xs text-blocked-fg">{errors.effort}</p>
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
            className={inputCls(!!show('assignee'))}
            maxLength={FIELD_LIMITS.assignee}
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            onBlur={() => markTouched('assignee')}
            aria-invalid={!!show('assignee')}
          />
          {show('assignee') && (
            <p className="mt-1 text-xs text-blocked-fg">{errors.assignee}</p>
          )}
        </div>
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
