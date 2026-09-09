/** Placeholder shapes shown while the first data load is in flight. */

function Bar({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-line ${className}`} />
}

export function EffortSummarySkeleton() {
  return (
    <section className="card p-4" aria-hidden="true">
      <Bar className="mb-3 h-4 w-40" />
      <Bar className="mb-3 h-2.5 w-full rounded-full" />
      <div className="flex flex-col gap-2">
        <Bar className="h-3.5 w-full" />
        <Bar className="h-3.5 w-full" />
        <Bar className="h-3.5 w-full" />
        <Bar className="h-3.5 w-2/3" />
      </div>
    </section>
  )
}

function TaskCardSkeleton() {
  return (
    <div className="card flex flex-col gap-2.5 border-x-4 border-x-line p-4">
      <div className="flex gap-1.5">
        <Bar className="h-5 w-16 rounded-full" />
        <Bar className="h-5 w-14 rounded-full" />
      </div>
      <Bar className="h-4 w-3/4" />
      <Bar className="h-4 w-1/2" />
      <Bar className="mt-2 h-3 w-2/3" />
    </div>
  )
}

export function TaskGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
      aria-hidden="true"
      aria-busy="true"
    >
      {Array.from({ length: count }, (_, i) => (
        <TaskCardSkeleton key={i} />
      ))}
    </div>
  )
}
