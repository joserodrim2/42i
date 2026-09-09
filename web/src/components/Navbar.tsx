import { Link } from 'react-router-dom'

export function Navbar() {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3">
        <Link to="/" className="flex items-center gap-2.5 no-underline">
          <img src="/favicon.svg" alt="" width="32" height="32" className="shrink-0" />
          <span className="text-lg font-semibold text-ink">Task Handler</span>
        </Link>
        <span className="hidden text-sm text-muted sm:block">
          Track, prioritise and estimate the team&apos;s work
        </span>
      </div>
    </header>
  )
}
