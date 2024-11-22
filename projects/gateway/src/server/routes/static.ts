import { RequestHandler } from '../types/requestHandler.ts';
import { writeToText } from '../services/responseHelpers.ts';

/**
 * Handler for all static file requests
 */
export const staticRouteHandler: RequestHandler = async (
  req,
  res,
  { staticFileService },
) => {
  const content = await staticFileService.getContent(req.url);
  return writeToText(content, req.url, res);
};
