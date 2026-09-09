import {
  SORT_OPTIONS,
  type TaskFilterValue,
} from '../lib/taskFilters'
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

export function TaskFilters({ value, onChange }: Props) {
  return (
    <div className="card flex flex-wrap gap-2 p-3.5">
      <input
        className="field min-w-[200px] flex-[2]"
        placeholder="Search title or description…"
        maxLength={FIELD_LIMITS.search}
        value={value.search}
        onChange={(e) => onChange({ search: e.target.value })}
      />
      <select
        className="field min-w-[120px] flex-1"
        value={value.status}
        onChange={(e) => onChange({ status: e.target.value as TaskStatus | '' })}
      >
        <option value="">All statuses</option>
        {TASK_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <select
        className="field min-w-[120px] flex-1"
        value={value.priority}
        onChange={(e) => onChange({ priority: e.target.value as TaskPriority | '' })}
      >
        <option value="">All priorities</option>
        {TASK_PRIORITIES.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
      <select
        className="field min-w-[120px] flex-1"
        value={value.scope}
        onChange={(e) => onChange({ scope: e.target.value as 'roots' | 'all' })}
      >
        <option value="roots">Top-level tasks</option>
        <option value="all">All tasks (flat)</option>
      </select>
      <select
        className="field min-w-[150px] flex-1"
        value={value.sort}
        onChange={(e) => onChange({ sort: e.target.value })}
        aria-label="Sort tasks"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            Sort: {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}
