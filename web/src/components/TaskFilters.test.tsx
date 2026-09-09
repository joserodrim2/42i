import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_FILTERS } from '../lib/taskFilters'
import { TaskFilters } from './TaskFilters'

describe('TaskFilters', () => {
  it('shows human labels, not raw enums, in the status filter', () => {
    render(
      <TaskFilters
        value={DEFAULT_FILTERS}
        onChange={vi.fn()}
        assignees={[]}
      />,
    )
    expect(screen.getByRole('option', { name: 'In progress' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'IN_PROGRESS' })).toBeNull()
  })

  it('emits a patch when a filter changes', () => {
    const onChange = vi.fn()
    render(
      <TaskFilters
        value={DEFAULT_FILTERS}
        onChange={onChange}
        assignees={['Ada', 'Grace']}
      />,
    )

    fireEvent.change(screen.getByLabelText('Priority'), {
      target: { value: 'URGENT' },
    })
    expect(onChange).toHaveBeenCalledWith({ priority: 'URGENT' })

    fireEvent.change(screen.getByLabelText('Assignee'), {
      target: { value: 'Grace' },
    })
    expect(onChange).toHaveBeenCalledWith({ assignee: 'Grace' })
  })

  it('lists the assignees it is given', () => {
    render(
      <TaskFilters
        value={DEFAULT_FILTERS}
        onChange={vi.fn()}
        assignees={['Ada', 'Grace']}
      />,
    )
    expect(screen.getByRole('option', { name: 'Ada' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Grace' })).toBeInTheDocument()
  })
})
