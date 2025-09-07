import { describe, expect, it } from 'vitest';
import { resolveRouteParams } from './resolveRouteParams.ts';

describe('resolveRouteParams', () => {
  it('resolves one segment', () => {
    const { id } = resolveRouteParams('/12345', '/:id');
    expect(id).toBe('12345');
  });

  it('resolves multiple segments', () => {
    const { id, name } = resolveRouteParams('/12345/larry', '/:id/:name');
    expect(id).toBe('12345');
    expect(name).toBe('larry');
  });

  it('does not resolve unmatched segment identifier', () => {
    const { name } = resolveRouteParams('/12345', '/:id');
    expect(name).toBeUndefined();
  });

  it('does not resolve for empty route', () => {
    const params = resolveRouteParams('/12345', '');
    expect(Object.keys(params)).toHaveLength(0);
  });
});
