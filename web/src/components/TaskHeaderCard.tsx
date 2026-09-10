import type { ReactNode } from 'react'
import { dueDateLabel } from '../lib/dueDate'
import { effortText, progressPct } from '../lib/effort'
import { PRIORITY_ACCENT, STATUS_STYLE } from '../lib/taskStyles'
import { ALLOWED_TRANSITIONS, type TaskDetail, type TaskStatus } from '../lib/types'
import { DueBadge, PriorityBadge, StatusBadge } from './Badges'
import { ArrowRightIcon, PencilIcon, TrashIcon } from './icons'

interface Props {
  task: TaskDetail
  busy: boolean
  onEdit: () => void
  onDelete: () => void
  onChangeStatus: (next: TaskStatus) => void
}

const dateTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

function MetaRow({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <>
      <dt className="text-muted">{label}</dt>
      <dd className="text-ink">{children}</dd>
    </>
  )
}

export function TaskHeaderCard({ task, busy, onEdit, onDelete, onChangeStatus }: Props) {
  const hasSubtasks = task.subtasks.length > 0
  const estimate =
    effortText({
      effort: task.effort,
      subtaskCount: task.subtasks.length,
      rollup: task.rollup,
    }) + (hasSubtasks ? ' (rolled up)' : '')
  const pct = progressPct(task.rollup)

  return (
    <div className={`card border-x-4 p-4 ${PRIORITY_ACCENT[task.priority]}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
          {task.dueDate && task.status !== 'DONE' && (
            <DueBadge dueDate={task.dueDate} />
          )}
        </div>
        <div className="flex gap-1.5">
          <button className="btn btn-sm" onClick={onEdit} disabled={busy}>
            <PencilIcon size={14} />
            Edit
          </button>
          <button
            className="btn btn-sm btn-danger"
            onClick={onDelete}
            disabled={busy}
          >
            <TrashIcon size={14} />
            Delete
          </button>
        </div>
      </div>

      <h2 className="mb-1 mt-3 text-xl font-semibold">{task.title}</h2>
      <p className="mt-0 whitespace-pre-wrap text-sm">
        {task.description || <span className="text-muted">No description.</span>}
      </p>

      {pct !== null && (
        <div className="mt-3 flex items-center gap-2 text-xs text-muted">
          <span className="h-1.5 w-40 overflow-hidden rounded-full bg-line">
            <span
              className="block h-full rounded-full bg-done-fg"
              style={{ width: `${pct}%` }}
            />
          </span>
          <span className="font-medium tabular-nums text-ink">{pct}% done</span>
          <span>
            ({task.rollup.completed}/{task.rollup.totalEstimated} pts)
          </span>
        </div>
      )}

      <dl className="mt-4 grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
        <MetaRow label="Estimate">{estimate}</MetaRow>
        <MetaRow label="Assignee">{task.assignee ?? '—'}</MetaRow>
        <MetaRow label="Due">
          {task.dueDate ? (
            <span className="font-semibold">{dueDateLabel(task.dueDate)}</span>
          ) : (
            '—'
          )}
        </MetaRow>
        <MetaRow label="Created">{dateTime(task.createdAt)}</MetaRow>
        <MetaRow label="Updated">{dateTime(task.updatedAt)}</MetaRow>
      </dl>

      <div className="mt-4 border-t border-line pt-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            Move to
          </span>
          {ALLOWED_TRANSITIONS[task.status].map((next) => (
            <button
              key={next}
              type="button"
              disabled={busy}
              onClick={() => onChangeStatus(next)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ring-current/20 transition hover:ring-current/50 disabled:opacity-50 ${STATUS_STYLE[next].cls}`}
            >
              <ArrowRightIcon size={13} />
              {STATUS_STYLE[next].label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
