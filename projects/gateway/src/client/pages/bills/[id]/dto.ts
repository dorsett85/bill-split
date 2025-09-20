import * as z from 'zod';

const ImageStatus = z.literal(['parsing', 'ready', 'error']);

const LineItemRead = z.object({
  id: z.number(),
  name: z.string(),
  price: z.number(),
});

const Participants = z.array(
  z.object({
    id: z.number(),
    name: z.string(),
  }),
);

export const BillData = z.object({
  id: z.number(),
  businessLocation: z.string().optional(),
  businessName: z.string().optional(),
  gratuity: z.number().optional(),
  imagePath: z.string(),
  imageStatus: ImageStatus,
  name: z.string().optional(),
  tax: z.number().optional(),
  lineItems: z.array(LineItemRead).optional(),
  participants: Participants,
});

export const BillResponse = z.object({
  data: BillData,
});

export const IdResponse = z.object({
  data: z.object({
    id: z.number(),
  }),
});

export type BillData = z.infer<typeof BillData>;
export type Participants = z.infer<typeof Participants>;
export type BillResponse = z.infer<typeof BillResponse>;
export type IdResponse = z.infer<typeof IdResponse>;
export type ImageStatus = z.infer<typeof ImageStatus>;
