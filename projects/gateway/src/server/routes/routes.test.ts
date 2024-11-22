import { describe, test } from 'vitest';
import { routes } from './routes.tsx';

describe('routes', () => {
  test('keys must have valid segments', () => {
    Object.keys(routes).forEach((key) => {
      const segments = key.split('/');
      segments.forEach((segment) => {
        const startsWithBracket = segment.startsWith('[');
        const endWithBracket = segment.endsWith(']');

        if (startsWithBracket && !endWithBracket) {
          throw new Error(
            `Route "${key}" has a malformed segment: no closing bracket`,
          );
        }

        const bracketCount = segment.match(/\[|\]/g)?.length ?? 0;
        if (bracketCount > 2) {
          throw new Error(
            `Route "${key}" has a malformed segment: too many brackets`,
          );
        }
      });
    });
  });
});
