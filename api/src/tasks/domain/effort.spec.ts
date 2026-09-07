import { computeEffortStats, EffortNode, normalizeEffort } from './effort';

describe('normalizeEffort', () => {
  it('passes through null / undefined as null', () => {
    expect(normalizeEffort(null)).toBeNull();
    expect(normalizeEffort(undefined)).toBeNull();
  });

  it('accepts non-negative finite numbers, including 0 and fractions', () => {
    expect(normalizeEffort(0)).toBe(0);
    expect(normalizeEffort(3)).toBe(3);
    expect(normalizeEffort(2.5)).toBe(2.5);
  });

  it('rejects negative numbers', () => {
    expect(() => normalizeEffort(-1)).toThrow(RangeError);
  });

  it('rejects NaN, Infinity and non-numbers', () => {
    expect(() => normalizeEffort(NaN)).toThrow(TypeError);
    expect(() => normalizeEffort(Infinity)).toThrow(TypeError);
    expect(() => normalizeEffort('5')).toThrow(TypeError);
  });
});

describe('computeEffortStats', () => {
  it('returns all-zero stats for an empty set', () => {
    expect(computeEffortStats([])).toEqual({
      totalEstimated: 0,
      notStarted: 0,
      inProgress: 0,
      blocked: 0,
      completed: 0,
      remaining: 0,
      taskCount: 0,
      estimatedCount: 0,
      unestimatedCount: 0,
    });
  });

  it('buckets effort by status across the whole set', () => {
    const nodes: EffortNode[] = [
      { status: 'BACKLOG', effort: 5 },
      { status: 'TODO', effort: 3 },
      { status: 'IN_PROGRESS', effort: 8 },
      { status: 'IN_REVIEW', effort: 2 },
      { status: 'BLOCKED', effort: 1 },
      { status: 'DONE', effort: 13 },
    ];

    const stats = computeEffortStats(nodes);

    expect(stats.notStarted).toBe(8); // 5 + 3
    expect(stats.inProgress).toBe(10); // 8 + 2
    expect(stats.blocked).toBe(1);
    expect(stats.completed).toBe(13);
    expect(stats.remaining).toBe(19); // 8 + 10 + 1
    expect(stats.totalEstimated).toBe(32);
  });

  it('counts unestimated tasks separately and treats their effort as 0', () => {
    const stats = computeEffortStats([
      { status: 'TODO', effort: 4 },
      { status: 'TODO', effort: null },
      { status: 'IN_PROGRESS' },
    ]);

    expect(stats.taskCount).toBe(3);
    expect(stats.estimatedCount).toBe(1);
    expect(stats.unestimatedCount).toBe(2);
    expect(stats.notStarted).toBe(4);
    expect(stats.inProgress).toBe(0);
    expect(stats.totalEstimated).toBe(4);
  });

  it('sums fractional estimates without floating-point drift', () => {
    const stats = computeEffortStats([
      { status: 'TODO', effort: 0.1 },
      { status: 'TODO', effort: 0.2 },
    ]);
    expect(stats.notStarted).toBe(0.3);
    expect(stats.totalEstimated).toBe(0.3);
  });
});
