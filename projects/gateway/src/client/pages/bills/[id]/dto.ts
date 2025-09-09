import * as z from 'zod';

const ImageStatus = z.literal(['parsing', 'ready', 'error']);

const LineItemRead = z.object({
  billId: z.number(),
  name: z.string(),
  price: z.number(),
});

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
});

export const BillResponse = z.object({
  data: BillData,
});

export type BillData = z.infer<typeof BillData>;
export type ImageStatus = z.infer<typeof ImageStatus>;
