import {
  allowedTransitions,
  assertTransition,
  canTransition,
  InvalidTransitionError,
  isTaskStatus,
  TASK_STATUSES,
  TaskStatus,
} from './task-status';

describe('task-status', () => {
  describe('isTaskStatus', () => {
    it('accepts every known status', () => {
      for (const status of TASK_STATUSES) expect(isTaskStatus(status)).toBe(true);
    });

    it('rejects unknown or non-string values', () => {
      expect(isTaskStatus('done')).toBe(false); // case sensitive
      expect(isTaskStatus('ARCHIVED')).toBe(false);
      expect(isTaskStatus(1)).toBe(false);
      expect(isTaskStatus(null)).toBe(false);
    });
  });

  describe('canTransition', () => {
    it('allows staying in the same state (idempotent update)', () => {
      for (const status of TASK_STATUSES) expect(canTransition(status, status)).toBe(true);
    });

    it.each<[TaskStatus, TaskStatus]>([
      ['BACKLOG', 'TODO'],
      ['TODO', 'IN_PROGRESS'],
      ['IN_PROGRESS', 'IN_REVIEW'],
      ['IN_REVIEW', 'DONE'],
      ['IN_PROGRESS', 'DONE'],
      ['DONE', 'IN_PROGRESS'],
      ['BLOCKED', 'TODO'],
      ['TODO', 'BLOCKED'],
    ])('allows %s -> %s', (from, to) => {
      expect(canTransition(from, to)).toBe(true);
    });

    it.each<[TaskStatus, TaskStatus]>([
      ['BACKLOG', 'IN_PROGRESS'],
      ['BACKLOG', 'DONE'],
      ['TODO', 'DONE'],
      ['TODO', 'IN_REVIEW'],
      ['DONE', 'BACKLOG'],
      ['DONE', 'BLOCKED'],
      ['IN_REVIEW', 'TODO'],
    ])('forbids %s -> %s', (from, to) => {
      expect(canTransition(from, to)).toBe(false);
    });

    it('never lists the source state among its own transitions', () => {
      for (const status of TASK_STATUSES) {
        expect(allowedTransitions(status)).not.toContain(status);
      }
    });
  });

  describe('assertTransition', () => {
    it('does not throw for a valid transition', () => {
      expect(() => assertTransition('TODO', 'IN_PROGRESS')).not.toThrow();
    });

    it('throws InvalidTransitionError with a helpful message for an invalid one', () => {
      expect(() => assertTransition('BACKLOG', 'DONE')).toThrow(InvalidTransitionError);
      try {
        assertTransition('BACKLOG', 'DONE');
      } catch (err) {
        expect((err as InvalidTransitionError).from).toBe('BACKLOG');
        expect((err as InvalidTransitionError).to).toBe('DONE');
        expect((err as Error).message).toContain('Allowed from BACKLOG');
      }
    });
  });
});
