import { describe, expect, it } from 'vitest'
import { dueCountdown, isOverdue } from './dueDate'

const NOW = new Date('2026-09-09T12:00:00.000Z').getTime()
// The API stores a due date as the end of that calendar day.
const endOfDay = (isoDate: string) => `${isoDate}T23:59:59.999Z`

describe('dueCountdown', () => {
  it('reads today / tomorrow / N days', () => {
    expect(dueCountdown(endOfDay('2026-09-09'), NOW)).toBe('due today')
    expect(dueCountdown(endOfDay('2026-09-10'), NOW)).toBe('due tomorrow')
    expect(dueCountdown(endOfDay('2026-09-14'), NOW)).toBe('due in 5d')
  })

  it('collapses far-out dates to weeks / months', () => {
    expect(dueCountdown(endOfDay('2026-10-07'), NOW)).toBe('due in 4w')
    expect(dueCountdown(endOfDay('2026-12-08'), NOW)).toBe('due in 3mo')
  })

  it('counts overdue days once the day has passed', () => {
    expect(dueCountdown(endOfDay('2026-09-08'), NOW)).toBe('1d overdue')
    expect(dueCountdown(endOfDay('2026-09-06'), NOW)).toBe('3d overdue')
  })
})

describe('isOverdue', () => {
  it('is false through the end of the due day, true after', () => {
    expect(isOverdue(endOfDay('2026-09-09'), NOW)).toBe(false)
    expect(isOverdue(endOfDay('2026-09-08'), NOW)).toBe(true)
  })
})
