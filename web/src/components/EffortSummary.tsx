import type { EffortStats } from '../lib/types'

interface Props {
  stats: EffortStats
  title: string
  subtitle?: string
}

const BUCKETS = [
  { key: 'notStarted', label: 'Not started', color: 'bg-todo-fg' },
  { key: 'inProgress', label: 'In progress', color: 'bg-progress-fg' },
  { key: 'blocked', label: 'Blocked', color: 'bg-blocked-fg' },
  { key: 'completed', label: 'Done', color: 'bg-done-fg' },
] as const

/**
 * Effort roll-up as a readable list: a stacked bar shows where the work sits,
 * the rows break it down. All figures are story points over the full hierarchy.
 */
export function EffortSummary({ stats, title, subtitle }: Props) {
  const total = stats.totalEstimated
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0)

  return (
    <section className="card p-4">
      <header className="mb-3">
        <h3 className="font-semibold">{title}</h3>
        {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
      </header>

      <div className="mb-3 flex h-2.5 overflow-hidden rounded-full bg-line">
        {total > 0 &&
          BUCKETS.map((b) => (
            <div
              key={b.key}
              className={b.color}
              style={{ width: `${pct(stats[b.key])}%` }}
              title={`${b.label}: ${stats[b.key]} pts`}
            />
          ))}
      </div>

      <dl className="flex flex-col gap-1.5 text-sm">
        {BUCKETS.map((b) => (
          <div key={b.key} className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${b.color}`} />
            <dt className="text-muted">{b.label}</dt>
            <dd className="ml-auto font-medium tabular-nums">
              {stats[b.key]} pts
              {total > 0 && (
                <span className="ml-1.5 text-xs text-muted">{pct(stats[b.key])}%</span>
              )}
            </dd>
          </div>
        ))}

        <div className="my-1 border-t border-line" />

        <div className="flex items-center gap-2">
          <dt className="text-muted">Remaining (not done)</dt>
          <dd className="ml-auto font-semibold tabular-nums">{stats.remaining} pts</dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="text-muted">Total estimated</dt>
          <dd className="ml-auto font-semibold tabular-nums">
            {stats.totalEstimated} pts
          </dd>
        </div>
      </dl>

      {stats.unestimatedCount > 0 && (
        <p className="mt-2 rounded-md bg-prio-medium px-2 py-1 text-xs text-prio-medium-fg">
          {stats.unestimatedCount} of {stats.leafCount} leaf task
          {stats.leafCount === 1 ? '' : 's'} still need an estimate
        </p>
      )}
    </section>
  )
}
