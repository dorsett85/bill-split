/**
 * Given an url path, try to match it against our route keys which support
 * dynamic paths
 *
 * @example
 * const route = resolveRoute('/bill/12345')
 * console.log(route) // '/bill/[id]'
 */
export const resolveRoute = (path: string, routes: string[]): string => {
  // Split the URL into segments
  const urlSegments = path.split('/');

  // Iterate through the routes and find a match
  for (const route of routes) {
    const routeSegments = route.split('/');

    // If the route has a dynamic segment (e.g., [id]), check if the URL segment matches the pattern
    if (routeSegments.length === urlSegments.length) {
      let isMatch = true;
      for (let i = 0; i < routeSegments.length; i++) {
        if (
          routeSegments[i] !== urlSegments[i] &&
          !routeSegments[i].startsWith('[')
        ) {
          isMatch = false;
          break;
        }
      }
      if (isMatch) {
        return route;
      }
    }
  }

  // No matching route found
  return '';
};
