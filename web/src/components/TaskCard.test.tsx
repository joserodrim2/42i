import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { makeListItem, makeStats } from '../test/factories'
import { TaskCard } from './TaskCard'

const renderCard = (task = makeListItem(), onDelete = vi.fn()) => {
  render(
    <MemoryRouter>
      <TaskCard task={task} onDelete={onDelete} />
    </MemoryRouter>,
  )
  return { onDelete }
}

describe('TaskCard', () => {
  it('links to the task detail page', () => {
    const task = makeListItem({ title: 'Write the README' })
    renderCard(task)
    expect(
      screen.getByRole('link', { name: /Write the README/ }),
    ).toHaveAttribute('href', `/tasks/${task.id}`)
  })

  it('shows "No estimate" for an unestimated leaf', () => {
    renderCard(makeListItem({ effort: null }))
    expect(screen.getByText('No estimate')).toBeInTheDocument()
  })

  it('shows the rolled-up total and subtask count for a parent', () => {
    renderCard(
      makeListItem({
        effort: null,
        subtaskCount: 2,
        rollup: makeStats({ totalEstimated: 7, remaining: 5 }),
      }),
    )
    expect(screen.getByText('7 pts')).toBeInTheDocument()
    expect(screen.getByText(/2 subtasks/)).toBeInTheDocument()
  })

  it('calls onDelete without navigating when the trash button is clicked', () => {
    const task = makeListItem({ title: 'Throwaway' })
    const { onDelete } = renderCard(task)
    fireEvent.click(screen.getByRole('button', { name: 'Delete Throwaway' }))
    expect(onDelete).toHaveBeenCalledWith(task)
  })

  it('shows a completion percentage from the rollup points', () => {
    renderCard(
      makeListItem({
        subtaskCount: 2,
        rollup: makeStats({ totalEstimated: 10, completed: 7, remaining: 3 }),
      }),
    )
    expect(screen.getByText('70%')).toBeInTheDocument()
  })

  it('shows a due-date countdown pill and the bold date', () => {
    renderCard(
      makeListItem({ status: 'TODO', dueDate: '2000-01-01T23:59:59.999Z' }),
    )
    expect(screen.getByText(/overdue/)).toBeInTheDocument()
    expect(screen.getByText(/^Due /)).toBeInTheDocument()
  })

  it('drops the countdown pill for a DONE task but keeps the date', () => {
    renderCard(
      makeListItem({ status: 'DONE', dueDate: '2000-01-01T23:59:59.999Z' }),
    )
    expect(screen.queryByText(/overdue/)).toBeNull()
    expect(screen.getByText(/^Due /)).toBeInTheDocument()
  })
})
