import { describe, expect, it } from 'vitest';
import { resolveRoute } from './resolveRoute.ts';

describe('resolveRoute', () => {
  it('matches wildcard route', () => {
    const url = '/static/something/something';
    const expectedRoute = '/static/**';

    const actualRoute = resolveRoute(url, [expectedRoute]);
    expect(actualRoute).toBe(expectedRoute);
  });

  it('matches dynamic segment route', () => {
    const url = '/bills/1234';
    const expectedRoute = '/bills/:id';

    const actualRoute = resolveRoute(url, [expectedRoute]);
    expect(actualRoute).toBe(expectedRoute);
  });

  it('matches dynamic nested segment route', () => {
    const url = '/bills/1234/name';
    const expectedRoute = '/bills/:id/name';

    const actualRoute = resolveRoute(url, [expectedRoute]);
    expect(actualRoute).toBe(expectedRoute);
  });

  it('matches exact route', () => {
    const url = '/api/bills';
    const expectedRoute = '/api/bills';

    const actualRoute = resolveRoute(url, [expectedRoute]);
    expect(actualRoute).toBe(expectedRoute);
  });

  it('returns null for unmatched URL', () => {
    const url = '/nonexistent';
    const expectedRoute = null;

    const actualRoute = resolveRoute(url, ['/api/nonexistent']);
    expect(actualRoute).toBe(expectedRoute);
  });

  it('figures out colons mid path', () => {
    const url = '/api/bills:check-access';
    const expectedRoute = '/api/bills:check-access';

    const actualRoute = resolveRoute(url, [expectedRoute]);
    expect(actualRoute).toBe(expectedRoute);
  });
});
