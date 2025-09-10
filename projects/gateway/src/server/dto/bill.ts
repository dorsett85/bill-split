import * as z from 'zod';
import { id } from './id.ts';
import type { LineItemReadStorage } from './lineItem.ts';

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

export const BillUpdate = BillCreate.omit({
  imagePath: true,
  imageStatus: true,
});

export const BillCreateStorage = BillCreate.transform((bill) => ({
  business_location: bill.businessLocation,
  business_name: bill.businessName,
  gratuity: bill.gratuity,
  image_path: bill.imagePath,
  image_status: bill.imageStatus,
  name: bill.name,
  tax: bill.tax,
}));

export const BillUpdateStorage = BillUpdate.transform((bill) => ({
  business_location: bill.businessLocation,
  business_name: bill.businessName,
  gratuity: bill.gratuity,
  name: bill.name,
  tax: bill.tax,
}));

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

export const toBillRead = (
  bill: z.infer<typeof BillReadStorage>,
  lineItems: LineItemReadStorage[],
) => ({
  id: bill.id,
  businessLocation: bill.business_location ?? undefined,
  businessName: bill.business_name ?? undefined,
  gratuity: bill.gratuity ?? undefined,
  imagePath: bill.image_path,
  imageStatus: bill.image_status,
  lineItems: lineItems?.map((item) => ({
    billId: item.bill_id,
    name: item.name,
    price: item.price,
  })),
  name: bill.name ?? undefined,
  tax: bill.tax ?? undefined,
});

export type BillCreate = z.infer<typeof BillCreate>;
export type BillUpdate = z.infer<typeof BillUpdate>;
export type BillRead = ReturnType<typeof toBillRead>;
