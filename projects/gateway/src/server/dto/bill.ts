import * as z from 'zod';
import { type IdRecord, id } from './id.ts';
import type { LineItemRead } from './lineItem.ts';
import type { ParticipantRead } from './participant.ts';

const ImageStatus = z.literal(['parsing', 'ready', 'error']);

export const BillCreate = z.object({
  businessLocation: z.string().nullish(),
  businessName: z.string().nullish(),
  gratuity: z.number().nullish(),
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
    image_path: BillCreate.shape.imagePath,
    image_status: BillCreate.shape.imageStatus,
    name: BillCreate.shape.name.nullable(),
    tax: BillCreate.shape.tax.nullable(),
  })
  .strict();

export const BillUpdate = BillCreate.omit({
  imagePath: true,
  imageStatus: true,
});

export type BillCreate = z.infer<typeof BillCreate>;
export type BillRead = {
  [K in keyof BillCreate]: Exclude<BillCreate[K], null>;
} & IdRecord;
export type BillUpdate = z.infer<typeof BillUpdate>;
export type BillResponse = BillRead & {
  lineItems: Omit<LineItemRead, 'billId'>[];
  participants: ParticipantRead[];
};

export const toBillStorage = (bill: BillCreate | BillUpdate) => ({
  business_location: bill.businessLocation,
  business_name: bill.businessName,
  gratuity: bill.gratuity,
  image_path: 'imagePath' in bill ? bill.imagePath : undefined,
  image_status: 'imageStatus' in bill ? bill.imageStatus : undefined,
  name: bill.name,
  tax: bill.tax,
});

export const toBillRead = (
  bill: z.infer<typeof BillReadStorage>,
): BillRead => ({
  id: bill.id,
  businessLocation: bill.business_location ?? undefined,
  businessName: bill.business_name ?? undefined,
  gratuity: bill.gratuity ?? undefined,
  imagePath: bill.image_path,
  imageStatus: bill.image_status,
  name: bill.name ?? undefined,
  tax: bill.tax ?? undefined,
});
