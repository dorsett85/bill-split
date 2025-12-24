import type { AnalyzeExpenseCommandOutput } from '@aws-sdk/client-textract';
import type {
  ProcessedExpense,
  ProcessedExpenseItem,
} from '../types/processedExpense.ts';
import { getDb } from './getDb.ts';

/**
 * Parse monetary amounts from text. Removes all characters except for the
 * decimal.
 */
const parseAmount = (amountText: string): number => {
  const parsed = Number(amountText.replace(/[^0-9.-]+/g, ''));
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Remove line feeds and carriage returns from a string
 */
const stripNewLines = (str: string): string => str.replace(/[\r\n]+/gm, ' ');

/**
 * Transforms AWS Textract AnalyzeExpenseCommandOutput into ProcessedBill format
 */
export const transformTextractToProcessedBill = (
  response: AnalyzeExpenseCommandOutput,
): ProcessedExpense => {
  const processedExpense: ProcessedExpense = {
    items: [],
  };

  // Process each expense document (usually just one for a single receipt)
  response.ExpenseDocuments?.forEach((document) => {
    // Extract summary fields (business info, totals, etc.)
    document.SummaryFields?.forEach((field) => {
      const fieldType = field.Type?.Text;
      const fieldValue = field.ValueDetection?.Text;

      if (!fieldValue) return;

      const strippedValue = stripNewLines(fieldValue);

      switch (fieldType) {
        case 'VENDOR_NAME':
          processedExpense.business_name = strippedValue;
          break;
        case 'VENDOR_ADDRESS':
          processedExpense.business_location = strippedValue;
          break;
        case 'TAX': {
          // May be more than one tax item, so add the current total to the
          // newest item.
          const currentTax = processedExpense.tax ?? 0;
          processedExpense.tax = currentTax + parseAmount(strippedValue);
          break;
        }
        case 'GRATUITY':
          processedExpense.gratuity = parseAmount(strippedValue);
          break;
        case 'DISCOUNT': {
          // Could be more than one discount, so add the current total to the
          // newest line item.
          const currentDiscount = processedExpense.discount ?? 0;
          processedExpense.discount = Math.abs(
            currentDiscount + parseAmount(strippedValue),
          );
        }
      }
    });

    // Extract line items from tables
    document.LineItemGroups?.forEach((lineItemGroup) => {
      lineItemGroup.LineItems?.forEach((lineItem) => {
        const item: ProcessedExpenseItem = {
          name: 'UNDETERMINED',
          price: 0,
          unitPrice: 0,
          quantity: 1,
        };

        lineItem.LineItemExpenseFields?.forEach((field) => {
          const fieldType = field.Type?.Text;
          const fieldValue = field.ValueDetection?.Text;

          if (!fieldValue) return;

          const strippedValue = stripNewLines(fieldValue);

          switch (fieldType) {
            case 'ITEM':
              item.name = strippedValue;
              break;
            case 'PRICE':
              item.price = parseAmount(strippedValue);
              break;
            case 'UNIT_PRICE':
              item.unitPrice = parseAmount(strippedValue);
              break;
            case 'QUANTITY':
              // If the quantity can't be detected then default to 1
              item.quantity = parseAmount(strippedValue) || 1;
          }
        });

        // If a unit price wasn't detected, then manually calculate it
        if (item.quantity > 1 && item.unitPrice === 0) {
          item.unitPrice = item.price / item.quantity;
        }

        processedExpense.items.push(item);
      });
    });
  });

  return processedExpense;
};

/**
 * Update the db with the new data from the processed image
 */
export const updateBill = async (
  billId: number,
  expense: Omit<ProcessedExpense, 'items'> & { tip: number },
): Promise<number | null> => {
  const db = getDb();
  const res = await db.query(
    `
    UPDATE bill SET 
        business_location = $1,
        business_name = $2,
        image_status = $3,
        tax = $4,
        tip = $5,
        gratuity = $6,
        discount = $7
    WHERE id = $8;
  `,
    [
      expense.business_location,
      expense.business_name,
      'ready',
      expense.tax,
      expense.tip,
      expense.gratuity,
      expense.discount,
      billId,
    ],
  );

  return res.rowCount;
};

/**
 * If image process fails, update the status with an error
 */
export const updateBillWithError = async (
  billId: number,
): Promise<number | null> => {
  const db = getDb();
  const res = await db.query(
    `
      UPDATE bill
      SET image_status = $1
      WHERE id = $2;
    `,
    ['error', billId],
  );

  return res.rowCount;
};

/**
 * Insert the processed bill items into the db
 */
export const createBillItems = async (
  billId: number,
  items: ProcessedExpenseItem[],
): Promise<number | null> => {
  const db = getDb();
  const itemsToInsert: { bill_id: number; name: string; price: number }[] = [];

  // Create a total list of items that need to be inserted taking into
  // consideration that quantity. Make sure the ordering matches the INSERT INTO
  // statement below.
  items.forEach((item) => {
    for (let i = 0; i < item.quantity; i++) {
      itemsToInsert.push({
        bill_id: billId,
        name: item.name,
        // Use the unit price for anything that has quantities greater than one
        price:
          item.quantity > 1 && item.unitPrice ? item.unitPrice : item.price,
      });
    }
  });

  // Add dynamic number of parameterized values
  let count = 1;
  const valueParam = itemsToInsert
    .map(
      (item) =>
        `(${Object.keys(item)
          .map(() => `$${count++}`)
          .join(', ')})`,
    )
    .join(', ');

  const res = await db.query(
    `INSERT INTO line_item(bill_id, name, price) VALUES ${valueParam}`,
    itemsToInsert.map((item) => Object.values(item)).flat(),
  );

  return res.rowCount;
};
