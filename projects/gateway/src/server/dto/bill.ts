import * as z from 'zod';
import { id } from './id.ts';
import { LineItemRead } from './lineItem.ts';

const nullToUndefined = <T>(val: T) => val ?? undefined;
const undefinedToNull = <T>(val: T) => val ?? null;

const ImageStatus = z.literal(['parsing', 'ready', 'error']);

export const BillCreate = z.object({
  businessLocation: z.string().optional(),
  businessName: z.string().optional(),
  gratuity: z.number().optional(),
  imagePath: z.string(),
  imageStatus: ImageStatus,
  name: z.string().optional(),
  tax: z.number().optional(),
});

const BillRead = BillCreate.extend({
  id,
  businessLocation: z.preprocess(
    nullToUndefined,
    BillCreate.shape.businessLocation,
  ),
  businessName: z.preprocess(nullToUndefined, BillCreate.shape.businessName),
  gratuity: z.preprocess(nullToUndefined, BillCreate.shape.gratuity),
  lineItems: z.preprocess(
    nullToUndefined,
    // billId is redundant here
    z
      .array(LineItemRead.omit({ billId: true }))
      .optional(),
  ),
  name: z.preprocess(nullToUndefined, BillCreate.shape.name),
  tax: z.preprocess(nullToUndefined, BillCreate.shape.tax),
});

const BillCreateStorage = BillCreate.omit({
  businessLocation: true,
  businessName: true,
  imagePath: true,
  imageStatus: true,
}).extend({
  business_location: z.preprocess(undefinedToNull, z.string().nullable()),
  business_name: z.preprocess(undefinedToNull, z.string().nullable()),
  image_path: z.string(),
  image_status: ImageStatus,
});

export const BillReadStorage = BillCreateStorage.extend({ id });

export type BillCreate = z.infer<typeof BillCreate>;
export type BillRead = z.infer<typeof BillRead>;
type BillCreateStorage = z.infer<typeof BillCreateStorage>;
type BillReadStorage = z.infer<typeof BillReadStorage>;

export const mapToBillCreateStorage = (bill: BillCreate): BillCreateStorage => {
  return BillCreateStorage.parse({
    ...bill,
    business_location: bill.businessLocation,
    business_name: bill.businessName,
    image_path: bill.imagePath,
    image_status: bill.imageStatus,
  });
};

export const mapToBillRead = (
  bill: BillReadStorage & Pick<BillRead, 'lineItems'>,
): BillRead =>
  BillRead.parse({
    ...bill,
    businessLocation: bill.business_location,
    businessName: bill.business_name,
    imagePath: bill.image_path,
    imageStatus: bill.image_status,
  });
