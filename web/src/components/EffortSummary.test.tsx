import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { makeStats } from '../test/factories'
import { EffortSummary } from './EffortSummary'

describe('EffortSummary', () => {
  it('breaks the total down by bucket', () => {
    render(
      <EffortSummary
        title="Effort summary"
        stats={makeStats({
          totalEstimated: 10,
          notStarted: 4,
          inProgress: 6,
          remaining: 10,
          leafCount: 3,
          estimatedCount: 3,
        })}
      />,
    )

    expect(screen.getByText('Effort summary')).toBeInTheDocument()
    const notStarted = screen.getByText('Not started').closest('div')!
    expect(notStarted).toHaveTextContent('4 pts')
    expect(notStarted).toHaveTextContent('40%')
  })

  it('warns when some leaf tasks have no estimate', () => {
    render(
      <EffortSummary
        title="Effort summary"
        stats={makeStats({ leafCount: 5, unestimatedCount: 2 })}
      />,
    )
    expect(
      screen.getByText('2 of 5 leaf tasks still need an estimate'),
    ).toBeInTheDocument()
  })

  it('hides the warning when every leaf is estimated', () => {
    render(
      <EffortSummary
        title="Effort summary"
        stats={makeStats({ leafCount: 5, unestimatedCount: 0 })}
      />,
    )
    expect(screen.queryByText(/still need an estimate/)).not.toBeInTheDocument()
  })
})
