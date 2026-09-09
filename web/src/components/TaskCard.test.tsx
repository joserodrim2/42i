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
})
