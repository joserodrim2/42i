import { Link, Route, Routes } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { TaskListPage } from './pages/TaskListPage'
import { TaskDetailPage } from './pages/TaskDetailPage'

export default function App() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl p-5">
        <Routes>
          <Route path="/" element={<TaskListPage />} />
          <Route path="/tasks/:id" element={<TaskDetailPage />} />
          <Route
            path="*"
            element={
              <p>
                Not found.{' '}
                <Link to="/" className="text-brand-600 underline">
                  Go home
                </Link>
              </p>
            }
          />
        </Routes>
      </main>
    </>
  )
}
