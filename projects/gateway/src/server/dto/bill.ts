import * as z from 'zod';
import { type IdRecord, id } from './id.ts';

const ImageStatus = z.literal(['parsing', 'ready', 'error']);

export const BillCreate = z.object({
  businessLocation: z.string().nullish(),
  businessName: z.string().nullish(),
  gratuity: z.number().nullish(),
  imagePath: z.string(),
  imageStatus: ImageStatus,
  name: z.string().nullish(),
  tax: z.number().nullish(),
  discount: z.number().nullish(),
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
    discount: BillCreate.shape.discount.nullable(),
    created_at: z.date(),
  })
  .strict();

/**
 * This zod object is for our "one big" calculate bill query
 */
export const BillReadDetailedStorage = BillReadStorage.extend({
  sub_total: z.number(),
  total: z.number(),
  line_items: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
        price: z.number(),
        participant_ids: z.array(z.number()),
      }),
    )
    .nullable()
    .transform((arg) => arg ?? []),
  participants: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
        participant_line_items: z.array(
          z.object({
            line_item_id: z.number(),
          }),
        ),
        owes: z.number(),
      }),
    )
    .nullable()
    .transform((arg) => arg ?? []),
});

// There's nothing to update at this point, but we'll keep this route and types
// anyway.
export const BillUpdate = z.object({});

export type BillCreate = z.infer<typeof BillCreate>;
export type BillRead = {
  [K in keyof BillCreate]: Exclude<BillCreate[K], null>;
} & IdRecord;
export type BillUpdate = z.infer<typeof BillUpdate>;

export const toBillStorage = (bill: BillCreate | BillUpdate) => ({
  business_location:
    'businessLocation' in bill ? bill.businessLocation : undefined,
  business_name: 'businessName' in bill ? bill.businessName : undefined,
  gratuity: 'gratuity' in bill ? bill.gratuity : undefined,
  image_path: 'imagePath' in bill ? bill.imagePath : undefined,
  image_status: 'imageStatus' in bill ? bill.imageStatus : undefined,
  name: 'name' in bill ? bill.name : undefined,
  tax: 'tax' in bill ? bill.tax : undefined,
  discount: 'discount' in bill ? bill.discount : undefined,
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
  discount: bill.discount ?? undefined,
});

export const toBillReadDetailed = (
  bill: z.infer<typeof BillReadDetailedStorage>,
) => ({
  ...toBillRead(bill),
  subTotal: bill.sub_total,
  total: bill.total,
  lineItems: bill.line_items.map((li) => ({
    id: li.id,
    name: li.name,
    price: li.price,
    participantIds: li.participant_ids,
  })),
  participants: bill.participants.map((p) => ({
    id: p.id,
    name: p.name,
    participantLineItems: p.participant_line_items.map((pli) => ({
      lineItemId: pli.line_item_id,
    })),
    owes: p.owes,
  })),
});

export type BillReadDetailed = ReturnType<typeof toBillReadDetailed>;
export type BillRecalculateResponse = {
  discount: BillReadDetailed['discount'];
  subTotal: BillReadDetailed['subTotal'];
  tax: BillReadDetailed['tax'];
  gratuity: BillReadDetailed['gratuity'];
  total: BillReadDetailed['total'];
  lineItems: BillReadDetailed['lineItems'];
  participants: BillReadDetailed['participants'];
};

/**
 * The object used to publish and subscribe to bill recalculation changes
 */
export type BillRecalculatePubSubPayload = {
  billId: number;
  sessionToken: string;
  recalculatedBill: BillRecalculateResponse;
};
