import {
  buildTree,
  collectSubtreeIds,
  isDescendantOf,
  TaskLike,
  wouldCreateCycle,
} from './tree';

// a ─┬─ b ─── d
//    └─ c
const FLAT: TaskLike[] = [
  { id: 'a', parentId: null },
  { id: 'b', parentId: 'a' },
  { id: 'c', parentId: 'a' },
  { id: 'd', parentId: 'b' },
];

describe('buildTree', () => {
  it('nests children under their parent and keeps input order', () => {
    const [root] = buildTree(FLAT);
    expect(root.id).toBe('a');
    expect(root.subtasks.map((t) => t.id)).toEqual(['b', 'c']);
    expect(root.subtasks[0].subtasks.map((t) => t.id)).toEqual(['d']);
  });

  it('treats nodes with a missing parent as roots (subtree slices work)', () => {
    const slice = FLAT.filter((t) => t.id === 'b' || t.id === 'd');
    const roots = buildTree(slice);
    expect(roots.map((r) => r.id)).toEqual(['b']);
    expect(roots[0].subtasks.map((t) => t.id)).toEqual(['d']);
  });

  it('supports multiple roots', () => {
    const roots = buildTree([
      { id: 'x', parentId: null },
      { id: 'y', parentId: null },
    ]);
    expect(roots.map((r) => r.id)).toEqual(['x', 'y']);
  });
});

describe('collectSubtreeIds', () => {
  it('includes the root and every descendant, multiple levels deep', () => {
    expect([...collectSubtreeIds(FLAT, 'a')].sort()).toEqual(['a', 'b', 'c', 'd']);
    expect([...collectSubtreeIds(FLAT, 'b')].sort()).toEqual(['b', 'd']);
    expect([...collectSubtreeIds(FLAT, 'd')].sort()).toEqual(['d']);
  });
});

describe('isDescendantOf', () => {
  it('detects transitive descendants', () => {
    expect(isDescendantOf(FLAT, 'd', 'a')).toBe(true);
    expect(isDescendantOf(FLAT, 'd', 'b')).toBe(true);
  });

  it('is false for self, ancestors and unrelated nodes', () => {
    expect(isDescendantOf(FLAT, 'a', 'a')).toBe(false);
    expect(isDescendantOf(FLAT, 'a', 'd')).toBe(false);
    expect(isDescendantOf(FLAT, 'b', 'c')).toBe(false);
  });
});

describe('wouldCreateCycle', () => {
  it('flags re-parenting a task under itself or a descendant', () => {
    expect(wouldCreateCycle(FLAT, 'a', 'a')).toBe(true);
    expect(wouldCreateCycle(FLAT, 'a', 'd')).toBe(true);
    expect(wouldCreateCycle(FLAT, 'b', 'd')).toBe(true);
  });

  it('allows moving to null (root) or to an unrelated / ancestor node', () => {
    expect(wouldCreateCycle(FLAT, 'b', null)).toBe(false);
    expect(wouldCreateCycle(FLAT, 'c', 'b')).toBe(false);
    expect(wouldCreateCycle(FLAT, 'd', 'c')).toBe(false);
  });
});
