import { escapeLike } from './transforms';

describe('escapeLike', () => {
  it('escapes LIKE metacharacters so the term matches literally', () => {
    expect(escapeLike('100%')).toBe('100\\%');
    expect(escapeLike('a_b')).toBe('a\\_b');
    expect(escapeLike('c:\\path')).toBe('c:\\\\path');
  });

  it('leaves ordinary text untouched', () => {
    expect(escapeLike('deploy the API')).toBe('deploy the API');
  });
});
