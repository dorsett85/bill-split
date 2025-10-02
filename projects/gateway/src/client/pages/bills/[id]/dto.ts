import * as z from 'zod';

const ImageStatus = z.literal(['parsing', 'ready', 'error']);

const LineItem = z.object({
  id: z.number(),
  name: z.string(),
  price: z.number(),
});

const Participant = z.object({
  id: z.number(),
  name: z.string(),
  lineItems: z.array(
    z.object({
      id: z.number(),
      lineItemId: z.number(),
      pctOwes: z.number(),
    }),
  ),
});

export const BillData = z.object({
  id: z.number(),
  businessLocation: z.string().optional(),
  businessName: z.string().optional(),
  gratuity: z.number().optional(),
  tip: z.number().optional(),
  imagePath: z.string(),
  imageStatus: ImageStatus,
  name: z.string().optional(),
  tax: z.number().optional(),
  lineItems: z.array(LineItem),
  participants: z.array(Participant),
});

export const BillResponse = z.object({
  data: BillData,
});

export const ParticipantResponse = z.object({
  data: z.array(Participant),
});

export type BillData = z.infer<typeof BillData>;
export type Participant = z.infer<typeof Participant>;
export type LineItems = z.infer<typeof LineItem>[];
export type BillResponse = z.infer<typeof BillResponse>;
export type ParticipantResponse = z.infer<typeof ParticipantResponse>;
export type ImageStatus = z.infer<typeof ImageStatus>;
