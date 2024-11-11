import { RequestHandler } from '../types/requestHandler.ts';
import { writeToText } from '../services/responseHelpers.ts';

/**
 * Handler for all static file requests
 */
const staticRouteHandler: RequestHandler = async (
  req,
  res,
  { staticFileService },
) => {
  const content = await staticFileService.getContent(req.url);
  return writeToText(content, req.url, res);
};

/**
 * Static routes are dynamic so we'll build them based on a list of paths,
 * instead of hardcoding each route manually.
 */
export const createStaticRoutes = (paths: string[]) => {
  return paths.reduce<Record<string, RequestHandler>>((routes, path) => {
    return Object.assign(routes, { [path]: staticRouteHandler });
  }, {});
};
