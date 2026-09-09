import type { ReactNode } from 'react'
import { SORT_OPTIONS, type TaskFilterValue } from '../lib/taskFilters'
import {
  FIELD_LIMITS,
  TASK_PRIORITIES,
  TASK_STATUSES,
  type TaskPriority,
  type TaskStatus,
} from '../lib/types'

interface Props {
  value: TaskFilterValue
  onChange: (patch: Partial<TaskFilterValue>) => void
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-1 flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </span>
      {children}
    </label>
  )
}

export function TaskFilters({ value, onChange }: Props) {
  return (
    <div className="card flex flex-wrap items-end gap-3 p-3.5">
      <div className="min-w-[200px] flex-[2]">
        <Field label="Search">
          <input
            className="field"
            placeholder="Title or description…"
            maxLength={FIELD_LIMITS.search}
            value={value.search}
            onChange={(e) => onChange({ search: e.target.value })}
          />
        </Field>
      </div>

      <div className="min-w-[120px] flex-1">
        <Field label="Status">
          <select
            className="field"
            value={value.status}
            onChange={(e) => onChange({ status: e.target.value as TaskStatus | '' })}
          >
            <option value="">All</option>
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="min-w-[120px] flex-1">
        <Field label="Priority">
          <select
            className="field"
            value={value.priority}
            onChange={(e) =>
              onChange({ priority: e.target.value as TaskPriority | '' })
            }
          >
            <option value="">All</option>
            {TASK_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="min-w-[130px] flex-1">
        <Field label="Show">
          <select
            className="field"
            value={value.scope}
            onChange={(e) => onChange({ scope: e.target.value as 'roots' | 'all' })}
          >
            <option value="roots">Top-level</option>
            <option value="all">All (flat)</option>
          </select>
        </Field>
      </div>

      <div className="min-w-[160px] flex-1">
        <Field label="Sort by">
          <select
            className="field"
            value={value.sort}
            onChange={(e) => onChange({ sort: e.target.value })}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </div>
  )
}
