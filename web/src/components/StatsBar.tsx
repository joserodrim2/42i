import type { EffortStats } from '../lib/types'

interface Props {
  stats: EffortStats
  title?: string
}

/** Effort summary. `notStarted` / `inProgress` / `totalEstimated` are the
 *  figures the challenge asks for; the rest add useful context. */
export function StatsBar({ stats, title }: Props) {
  const cells: [string, number | string][] = [
    ['Not started', stats.notStarted],
    ['In progress', stats.inProgress],
    ['Blocked', stats.blocked],
    ['Completed', stats.completed],
    ['Total estimated', stats.totalEstimated],
    ['Tasks', `${stats.taskCount} (${stats.unestimatedCount} unestimated)`],
  ]

  return (
    <section className="stack">
      {title && <h3 className="small muted">{title}</h3>}
      <div className="stats-grid">
        {cells.map(([label, value]) => (
          <div className="card stat" key={label}>
            <p className="value">{value}</p>
            <p className="label muted">{label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
