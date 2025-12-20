export interface ProcessedExpenseItem {
  name: string;
  price: number;
  unitPrice: number;
  quantity: number;
}

/**
 * Transformed bill after the image has been processed
 */
export interface ProcessedExpense {
  business_name?: string;
  business_location?: string;
  gratuity?: number;
  tax?: number;
  discount?: number;
  items: ProcessedExpenseItem[];
}
