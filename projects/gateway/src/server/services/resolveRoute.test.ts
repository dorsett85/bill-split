import { describe, expect, it } from 'vitest';
import { resolveRoute } from './resolveRoute.ts';
import { routes } from '../routes/routes.tsx';

// TODO test this against test data and not our route keys
const routeKeys = Object.keys(routes);

describe('resolveRoute', () => {
  it('finds base route', () => {
    const route = resolveRoute('/', routeKeys);
    expect(route).toBe('/');
  });

  it('finds non-dynamic route', () => {
    const route = resolveRoute('/bill', routeKeys);
    expect(route).toBe('/bill');
  });

  it('finds dynamic route', () => {
    const route = resolveRoute('/bill/12345', routeKeys);
    expect(route).toBe('/bill/[id]');
  });

  it.each(['/aill/12345', '/till/12345', '/not/a/route'])(
    'finds no route for path: %s',
    (path) => {
      const route = resolveRoute(path, routeKeys);
      expect(route).toBe('');
    },
  );
});
