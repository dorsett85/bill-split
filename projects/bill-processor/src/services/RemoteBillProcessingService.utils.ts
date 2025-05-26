import { AnalyzeExpenseCommandOutput } from '@aws-sdk/client-textract';
import {
  ProcessedExpense,
  ProcessedExpenseItem,
} from '../types/processedBill.ts';

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
