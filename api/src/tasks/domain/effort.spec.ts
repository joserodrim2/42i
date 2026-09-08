import { computeEffortStats, EffortNode, normalizeEffort } from './effort';

const leaf = (
  id: string,
  status: EffortNode['status'],
  effort: number | null,
  parentId: string | null = null,
): EffortNode => ({ id, parentId, status, effort });

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
      leafCount: 0,
      estimatedCount: 0,
      unestimatedCount: 0,
    });
  });

  it('buckets leaf effort by status across the whole set', () => {
    const nodes: EffortNode[] = [
      leaf('a', 'BACKLOG', 5),
      leaf('b', 'TODO', 3),
      leaf('c', 'IN_PROGRESS', 8),
      leaf('d', 'IN_REVIEW', 2),
      leaf('e', 'BLOCKED', 1),
      leaf('f', 'DONE', 13),
    ];

    const stats = computeEffortStats(nodes);

    expect(stats.notStarted).toBe(8); // 5 + 3
    expect(stats.inProgress).toBe(10); // 8 + 2
    expect(stats.blocked).toBe(1);
    expect(stats.completed).toBe(13);
    expect(stats.remaining).toBe(19); // 8 + 10 + 1
    expect(stats.totalEstimated).toBe(32);
    expect(stats.leafCount).toBe(6);
  });

  it('ignores a parent task’s own estimate — only leaves count', () => {
    // parent(100) > childA(5, TODO) > grandchild(8, IN_PROGRESS); childB(3, TODO)
    const nodes: EffortNode[] = [
      { id: 'p', parentId: null, status: 'IN_PROGRESS', effort: 100 },
      { id: 'a', parentId: 'p', status: 'TODO', effort: 5 },
      { id: 'g', parentId: 'a', status: 'IN_PROGRESS', effort: 8 },
      { id: 'b', parentId: 'p', status: 'TODO', effort: 3 },
    ];

    const stats = computeEffortStats(nodes);

    expect(stats.taskCount).toBe(4);
    expect(stats.leafCount).toBe(2); // g and b (a and p have children)
    expect(stats.totalEstimated).toBe(11); // 8 + 3, the 100 and the 5 are ignored
    expect(stats.notStarted).toBe(3);
    expect(stats.inProgress).toBe(8);
  });

  it('counts leaves without an estimate separately (effort treated as 0)', () => {
    const stats = computeEffortStats([
      leaf('a', 'TODO', 4),
      leaf('b', 'TODO', null),
      { id: 'c', parentId: null, status: 'IN_PROGRESS' },
    ]);

    expect(stats.leafCount).toBe(3);
    expect(stats.estimatedCount).toBe(1);
    expect(stats.unestimatedCount).toBe(2);
    expect(stats.notStarted).toBe(4);
    expect(stats.totalEstimated).toBe(4);
  });

  it('sums fractional estimates without floating-point drift', () => {
    const stats = computeEffortStats([
      leaf('a', 'TODO', 0.1),
      leaf('b', 'TODO', 0.2),
    ]);
    expect(stats.notStarted).toBe(0.3);
    expect(stats.totalEstimated).toBe(0.3);
  });
});
