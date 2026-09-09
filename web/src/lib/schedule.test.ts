import { describe, expect, it } from 'vitest'
import { getSchedule, scheduleLabel } from './schedule'
import type { TaskStatus } from './types'

const NOW = new Date('2026-09-09T12:00:00.000Z').getTime()
const shift = (days: number) => new Date(NOW + days * 86_400_000).toISOString()

/** A task created `createdDaysAgo` before NOW, due `dueInDays` after NOW. */
const task = (createdDaysAgo: number, dueInDays: number, status: TaskStatus = 'TODO') => ({
  createdAt: shift(-createdDaysAgo),
  dueDate: shift(dueInDays),
  status,
})

describe('getSchedule', () => {
  it('is "none" with no due date', () => {
    expect(getSchedule({ ...task(10, 10), dueDate: null }, NOW).state).toBe('none')
  })

  it('walks early → mid → late across the created→due window', () => {
    // window 12 days; elapsed ≈ 0.17, 0.50, 0.83
    expect(getSchedule(task(2, 10), NOW).state).toBe('early')
    expect(getSchedule(task(6, 6), NOW).state).toBe('mid')
    expect(getSchedule(task(10, 2), NOW).state).toBe('late')
  })

  it('is "overdue" once the due date has passed', () => {
    expect(getSchedule(task(10, -1), NOW).state).toBe('overdue')
  })

  it('never flags a DONE task', () => {
    expect(getSchedule(task(10, -5, 'DONE'), NOW).state).toBe('none')
  })

  it('treats a due date at/before creation as overdue, not a divide-by-zero', () => {
    const created = shift(-3)
    expect(
      getSchedule({ createdAt: created, dueDate: created, status: 'TODO' }, NOW).state,
    ).toBe('overdue')
  })
})

describe('scheduleLabel', () => {
  it('counts down and counts overdue days', () => {
    expect(scheduleLabel(task(1, 5), NOW)).toBe('due in 5d')
    expect(scheduleLabel(task(1, 1), NOW)).toBe('due tomorrow')
    expect(scheduleLabel(task(10, -3), NOW)).toBe('3d overdue')
  })

  it('is empty with no due date', () => {
    expect(scheduleLabel({ ...task(1, 1), dueDate: null }, NOW)).toBe('')
  })
})
