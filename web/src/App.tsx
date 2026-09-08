import { Link, Route, Routes } from 'react-router-dom'
import { TaskListPage } from './pages/TaskListPage'
import { TaskDetailPage } from './pages/TaskDetailPage'

export default function App() {
  return (
    <>
      <header className="border-b border-line bg-white px-5 py-3.5">
        <div className="mx-auto flex max-w-5xl flex-wrap items-baseline gap-2">
          <h1 className="text-lg font-semibold">
            <Link to="/" className="text-inherit no-underline">
              <img
                src="/favicon.svg"
                alt=""
                width="20"
                height="20"
                className="mr-1.5 inline-block align-[-3px]"
              />
              Task Handler
            </Link>
          </h1>
          <span className="text-sm text-muted">
            Track, prioritise and estimate the team&apos;s work
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-5">
        <Routes>
          <Route path="/" element={<TaskListPage />} />
          <Route path="/tasks/:id" element={<TaskDetailPage />} />
          <Route
            path="*"
            element={
              <p>
                Not found. <Link to="/" className="text-brand-600 underline">Go home</Link>
              </p>
            }
          />
        </Routes>
      </main>
    </>
  )
}
