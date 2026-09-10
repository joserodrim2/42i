import { describe, expect, it } from 'vitest'
import { makeNode } from '../test/factories'
import { effortText, progressPct, rollupLeafEffort } from './effort'

describe('rollupLeafEffort', () => {
  it('returns a leaf task’s own effort', () => {
    expect(rollupLeafEffort(makeNode({ effort: 5 }))).toBe(5)
    expect(rollupLeafEffort(makeNode({ effort: null }))).toBe(0)
  })

  it('sums leaves across a multi-level subtree and ignores parents’ own effort', () => {
    const tree = makeNode({
      effort: 99, // a parent's own effort must not count
      subtasks: [
        makeNode({ effort: 3 }),
        makeNode({
          effort: 99,
          subtasks: [makeNode({ effort: 2 }), makeNode({ effort: 4 })],
        }),
      ],
    })
    expect(rollupLeafEffort(tree)).toBe(9)
  })
})

describe('effortText', () => {
  it('reads "No estimate" for an unestimated leaf', () => {
    expect(effortText({ effort: null })).toBe('No estimate')
  })

  it('pluralises a leaf’s own points', () => {
    expect(effortText({ effort: 1 })).toBe('1 pt')
    expect(effortText({ effort: 8 })).toBe('8 pts')
  })

  it('shows the rolled-up total for a task with subtasks', () => {
    expect(
      effortText({ effort: null, subtaskCount: 3, rollup: { totalEstimated: 12 } }),
    ).toBe('12 pts')
  })
})

describe('progressPct', () => {
  it('is completed / total, rounded', () => {
    expect(progressPct({ completed: 7, totalEstimated: 10 })).toBe(70)
    expect(progressPct({ completed: 1, totalEstimated: 3 })).toBe(33)
  })

  it('is null when nothing is estimated', () => {
    expect(progressPct({ completed: 0, totalEstimated: 0 })).toBeNull()
  })
})
