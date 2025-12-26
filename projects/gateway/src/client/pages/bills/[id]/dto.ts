import * as z from 'zod';
import { createApiResponse, IdRecord } from '../../../api/dto.ts';

const ImageStatus = z.literal(['parsing', 'ready', 'error']);

const LineItem = IdRecord.extend({
  name: z.string(),
  price: z.number(),
  participantIds: z.array(z.number()),
});

const Participant = IdRecord.extend({
  name: z.string(),
  lineItemParticipants: z.array(
    z.object({
      id: z.number(),
      lineItemId: z.number(),
    }),
  ),
  owes: z.number(),
});

export const BillData = IdRecord.extend({
  businessLocation: z.string().optional(),
  businessName: z.string().optional(),
  gratuity: z.number().optional(),
  discount: z.number().optional(),
  imagePath: z.string(),
  imageStatus: ImageStatus,
  name: z.string().optional(),
  tax: z.number().optional(),
  lineItems: z.array(LineItem),
  participants: z.array(Participant),
  subTotal: z.number().optional(),
  total: z.number().optional(),
});

export const BillRecalculateData = BillData.pick({
  discount: true,
  subTotal: true,
  tax: true,
  gratuity: true,
  total: true,
  lineItems: true,
  participants: true,
});

export const BillResponse = createApiResponse(BillData);
export const BillRecalculateResponse = createApiResponse(BillRecalculateData);

export type BillData = z.infer<typeof BillData>;
export type Participant = z.infer<typeof Participant>;
export type LineItems = z.infer<typeof LineItem>[];
export type BillRecalculateData = z.infer<typeof BillRecalculateData>;
export type BillResponse = z.infer<typeof BillResponse>;
export type BillRecalculateResponse = z.infer<typeof BillRecalculateResponse>;
export type ImageStatus = z.infer<typeof ImageStatus>;
