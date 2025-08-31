/**
 * Given a url path and a dynamic route, return a record with dynamic segment
 * identifier keys, and their corresponding values from the url path.
 *
 * This function assumes that the dynamic route is already in a valid format.
 *
 * @example
 * const { id, name } = resolveRouteSegments('/bills/1/lunch', '/bills/:id/:name');
 * console.log(id, name) // "1, lunch"
 */
export const resolveRouteSegments = (
  path: string,
  route: string,
): Record<string, string> => {
  const segments: Record<string, string> = {};

  const pathSegments = path.split('/');
  const routeSegments = route.split('/');
  for (let i = 0; i < pathSegments.length; i++) {
    // Check if the route segment is dynamic
    if (routeSegments[i]?.[0] === ':') {
      const routeSegmentKey = routeSegments[i].replace(':', '');
      segments[routeSegmentKey] = pathSegments[i];
    }
  }
  return segments;
};
