import { writeToText } from '../services/responseHelpers.ts';
import { RequestHandler } from '../types/requestHandler.ts';

/**
 * Handler for all static file requests
 */
export const staticRouteHandler: RequestHandler = async (
  req,
  res,
  { staticFileService },
) => {
  if (!staticFileService.getStaticPaths().has(req.url)) {
    res.statusCode = 404;
    return res.end();
  }
  const content = await staticFileService.getContent(req.url);
  return writeToText(content, req.url, res);
};
