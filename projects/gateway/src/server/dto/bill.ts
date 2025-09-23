import * as z from 'zod';
import { type IdRecord, id } from './id.ts';
import type { LineItemRead } from './lineItem.ts';
import type { LineItemParticipantRead } from './lineItemParticipant.ts';
import type { ParticipantRead } from './participant.ts';

const ImageStatus = z.literal(['parsing', 'ready', 'error']);

export const BillCreate = z.object({
  businessLocation: z.string().nullish(),
  businessName: z.string().nullish(),
  gratuity: z.number().nullish(),
  tip: z.number().nullish(),
  imagePath: z.string(),
  imageStatus: ImageStatus,
  name: z.string().nullish(),
  tax: z.number().nullish(),
});

export const BillReadStorage = z
  .object({
    id,
    business_location: BillCreate.shape.businessLocation.nullable(),
    business_name: BillCreate.shape.businessName.nullable(),
    gratuity: BillCreate.shape.gratuity.nullable(),
    tip: BillCreate.shape.tip.nullable(),
    image_path: BillCreate.shape.imagePath,
    image_status: BillCreate.shape.imageStatus,
    name: BillCreate.shape.name.nullable(),
    tax: BillCreate.shape.tax.nullable(),
  })
  .strict();

export const BillUpdate = z.object({
  tip: z.number().nullable(),
});

export type BillCreate = z.infer<typeof BillCreate>;
export type BillRead = {
  [K in keyof BillCreate]: Exclude<BillCreate[K], null>;
} & IdRecord;
export type BillUpdate = z.infer<typeof BillUpdate>;
export type BillResponse = BillRead & {
  lineItems: Omit<LineItemRead, 'billId'>[];
  participants: (ParticipantRead & {
    lineItems: Omit<LineItemParticipantRead, 'participantId'>[];
  })[];
};

export const toBillStorage = (bill: BillCreate | BillUpdate) => ({
  business_location:
    'businessLocation' in bill ? bill.businessLocation : undefined,
  business_name: 'businessName' in bill ? bill.businessName : undefined,
  gratuity: 'gratuity' in bill ? bill.gratuity : undefined,
  tip: bill.tip,
  image_path: 'imagePath' in bill ? bill.imagePath : undefined,
  image_status: 'imageStatus' in bill ? bill.imageStatus : undefined,
  name: 'name' in bill ? bill.name : undefined,
  tax: 'tax' in bill ? bill.tax : undefined,
});

export const toBillRead = (
  bill: z.infer<typeof BillReadStorage>,
): BillRead => ({
  id: bill.id,
  businessLocation: bill.business_location ?? undefined,
  businessName: bill.business_name ?? undefined,
  gratuity: bill.gratuity ?? undefined,
  tip: bill.tip ?? undefined,
  imagePath: bill.image_path,
  imageStatus: bill.image_status,
  name: bill.name ?? undefined,
  tax: bill.tax ?? undefined,
});
