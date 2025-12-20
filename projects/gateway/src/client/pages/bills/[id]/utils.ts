import type { BillData } from './dto.ts';

/**
 * Calculate and set defaults for the bill totals
 */
export const calculateTotals = (
  bill: BillData,
): {
  gratuity: number;
  tax: number;
  tip: number;
  discount: number;
  /** Percent decrease of the total of all the line items minus the discount,
   * expressed as a decimal */
  discountPct: number;
  subTotal: number;
  total: number;
  totalWithTip: number;
} => {
  const gratuity = bill.gratuity ?? 0;
  const tax = bill.tax ?? 0;
  const tip = bill.tip ?? 0;
  const discount = bill.discount ?? 0;
  const subTotal =
    bill.lineItems.reduce((total, item) => item.price + total, 0) - discount;
  const total = gratuity + tax + subTotal;

  const totalWithTip = total * (tip / 100) + total;

  return {
    gratuity,
    tax,
    tip,
    discount,
    discountPct: discount / (discount + subTotal),
    subTotal,
    total,
    totalWithTip,
  };
};
