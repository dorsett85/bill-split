import { describe, expect, it } from 'vitest';
import { resolveRouteSegments } from './resolveRouteSegments.ts';

describe('resolveRouteSegments', () => {
  it('resolves one segment', () => {
    const { id } = resolveRouteSegments('/12345', '/[id]');
    expect(id).toBe('12345');
  });

  it('resolves multiple segments', () => {
    const { id, name } = resolveRouteSegments('/12345/larry', '/[id]/[name]');
    expect(id).toBe('12345');
    expect(name).toBe('larry');
  });

  it('does not resolve unmatched segment identifier', () => {
    const { name } = resolveRouteSegments('/12345', '/[id]');
    expect(name).toBeUndefined();
  });
});
