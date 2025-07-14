import { AnalyzeExpenseCommandOutput } from '@aws-sdk/client-textract';
import {
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

      switch (fieldType) {
        case 'VENDOR_NAME':
          processedExpense.business_name = fieldValue;
          break;
        case 'VENDOR_ADDRESS':
          processedExpense.business_location = fieldValue;
          break;
        case 'TAX':
          processedExpense.tax = parseAmount(fieldValue);
          break;
        case 'GRATUITY':
          processedExpense.gratuity = Number(fieldValue);
      }
    });

    // Extract line items from tables
    document.LineItemGroups?.forEach((lineItemGroup) => {
      lineItemGroup.LineItems?.forEach((lineItem) => {
        const item: ProcessedExpenseItem = {
          name: '',
          price: 0,
          quantity: 1,
        };

        lineItem.LineItemExpenseFields?.forEach((field) => {
          const fieldType = field.Type?.Text;
          const fieldValue = field.ValueDetection?.Text;

          if (!fieldValue) return;

          switch (fieldType) {
            case 'ITEM':
              item.name = fieldValue;
              break;
            case 'PRICE':
              item.price = parseAmount(fieldValue);
              break;
            case 'QUANTITY':
              item.quantity = Number(fieldValue);
          }
        });

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
  expense: Omit<ProcessedExpense, 'items'>,
): Promise<number | null> => {
  const db = getDb();
  const res = await db.query(
    `
    UPDATE bill SET business_location = $1, business_name = $2, image_status = $3, tax = $4, gratuity = $5
    WHERE id = $6;
  `,
    [
      expense.business_location,
      expense.business_name,
      'ready',
      expense.tax,
      expense.gratuity,
      billId,
    ],
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
        price: item.price,
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
