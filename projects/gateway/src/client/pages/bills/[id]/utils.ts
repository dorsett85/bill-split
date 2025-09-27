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
  subTotal: number;
  total: number;
} => {
  const gratuity = bill.gratuity ?? 0;
  const tax = bill.tax ?? 0;
  const tip = bill.tip ?? 0;
  const subTotal = bill.lineItems.reduce(
    (total, item) => item.price + total,
    0,
  );
  const total = gratuity + tax + subTotal;

  return {
    gratuity,
    tax,
    tip,
    subTotal,
    total,
  };
};
