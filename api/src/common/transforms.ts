import { Transform } from 'class-transformer';

/** Trims surrounding whitespace from a string value (leaves non-strings alone). */
export const Trim = () =>
  Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  );

/**
 * Escapes the characters that Postgres `LIKE` / `ILIKE` treats as special so a
 * user's search term is matched literally (backslash is the default escape).
 */
export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}
