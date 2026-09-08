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
    ['Leaf tasks', `${stats.estimatedCount}/${stats.leafCount} estimated`],
  ]

  return (
    <section className="flex flex-col gap-3">
      {title && (
        <h3 className="text-sm font-medium text-slate-500">{title}</h3>
      )}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
        {cells.map(([label, value]) => (
          <div className="card px-3.5 py-3" key={label}>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
