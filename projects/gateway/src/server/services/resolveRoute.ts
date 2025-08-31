/**
 * Given a url path, try to match it against our route keys which support
 * dynamic paths.
 *
 * @example
 * const route = resolveRoute('/bills/12345')
 * console.log(route) // '/bills/:id'
 */
export const resolveRoute = (url: string, routes: string[]): string | null => {
  const urlSegments = url.split('/');

  for (const route of routes) {
    const routeSegments = route.split('/');

    let i = 0;
    let j = 0;

    while (i < urlSegments.length && j < routeSegments.length) {
      const urlSegment = urlSegments[i];
      const routeSegment = routeSegments[j];

      if (routeSegment === '**') {
        // Match remaining URL segments
        return route;
      } else if (routeSegment.startsWith(':')) {
        // Dynamic segment
        if (i < urlSegments.length) {
          i++;
        }
        j++;
      } else if (urlSegment !== routeSegment) {
        break;
      } else {
        i++;
        j++;
      }
    }

    if (i === urlSegments.length && j === routeSegments.length) {
      return route;
    }
  }

  return null;
};
