import type { ServerRequest } from '../types/serverRequest.ts';

/**
 * Parse the body of a request object into a json object
 */
export const parseJsonBody = async (
  req: ServerRequest,
): Promise<Record<string, unknown>> => {
  const chunks: number[] = [];
  for await (const chunk of req.read()) {
    chunks.push(chunk);
  }
  const text = Buffer.from(new Uint16Array(chunks)).toString();
  return JSON.parse(text);
};
