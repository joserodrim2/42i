import { Link, Route, Routes } from 'react-router-dom'
import { TaskListPage } from './pages/TaskListPage'
import { TaskDetailPage } from './pages/TaskDetailPage'

export default function App() {
  return (
    <>
      <header className="app-header">
        <div className="inner">
          <h1>
            <Link to="/" style={{ color: 'inherit' }}>
              Task System
            </Link>
          </h1>
          <span className="tagline">Track, prioritise and estimate the team&apos;s work</span>
        </div>
      </header>
      <main className="container">
        <Routes>
          <Route path="/" element={<TaskListPage />} />
          <Route path="/tasks/:id" element={<TaskDetailPage />} />
          <Route path="*" element={<p>Not found. <Link to="/">Go home</Link></p>} />
        </Routes>
      </main>
    </>
  )
}
