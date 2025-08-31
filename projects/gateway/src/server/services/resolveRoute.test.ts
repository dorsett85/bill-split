import { describe, expect, it } from 'vitest';
import { routes } from '../routes/routes.tsx';
import { resolveRoute } from './resolveRoute.ts';

// TODO test this against test data and not our route keys
const routeKeys = Object.keys(routes);

describe('resolveRoute', () => {
  it('matches wildcard route', () => {
    const url = '/static/something/something';
    const expectedRoute = '/static/**';

    const actualRoute = resolveRoute(url, routeKeys);
    expect(actualRoute).toBe(expectedRoute);
  });

  it('matches dynamic segment route', () => {
    const url = '/bills/1234';
    const expectedRoute = '/bills/:id';

    const actualRoute = resolveRoute(url, routeKeys);
    expect(actualRoute).toBe(expectedRoute);
  });

  it('matches dynamic nested segment route', () => {
    const url = '/bills/1234/name';
    const expectedRoute = '/bills/:id/name';
    const withNestedRoute = routeKeys.concat(expectedRoute);

    const actualRoute = resolveRoute(url, withNestedRoute);
    expect(actualRoute).toBe(expectedRoute);
  });

  it('matches exact route', () => {
    const url = '/api/bills';
    const expectedRoute = '/api/bills';

    const actualRoute = resolveRoute(url, routeKeys);
    expect(actualRoute).toBe(expectedRoute);
  });

  it('returns null for unmatched URL', () => {
    const url = '/nonexistent';
    const expectedRoute = null;

    const actualRoute = resolveRoute(url, routeKeys);
    expect(actualRoute).toBe(expectedRoute);
  });
});
