import { z } from 'zod';

export const id = z.number();

export const IdRecord = z.object({
  id,
});

export type IdRecord = z.infer<typeof IdRecord>;

/**
 * Take an initial string and transform it into an int. Useful for validating
 * request params.
 */
export const intId = z.preprocess(
  (val) => (typeof val === 'string' ? +val : val),
  z.int(),
);
