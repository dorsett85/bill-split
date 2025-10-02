import { describe, expect, it } from 'vitest';
import { stubbedAnalyzeOutput } from '../data/analyzeExpenseCommandOutput.ts';
import type { ProcessedExpense } from '../types/processedExpense.ts';
import { transformTextractToProcessedBill } from './RemoteBillProcessingService.utils.ts';

describe('transformTextractToProcessedBill', () => {
  it('transforms output to processed bill', () => {
    const actualOutput = transformTextractToProcessedBill(stubbedAnalyzeOutput);

    const expectedOutput: ProcessedExpense = {
      items: [
        { name: 'BROO BROWN ALE', price: 10.99, unitPrice: 0, quantity: 1 },
        { name: 'BOTTLE DEPOSIT', price: 0.3, unitPrice: 0, quantity: 1 },
        { name: 'DRSCL STRAWBERRIES', price: 3.49, unitPrice: 0, quantity: 1 },
        { name: 'OVF OG LG EGGS', price: 2.89, unitPrice: 0, quantity: 1 },
        { name: '365 WHL MLK', price: 4.09, unitPrice: 0, quantity: 1 },
        { name: 'NOOSA HONEY YOGHURT', price: 2.29, unitPrice: 0, quantity: 1 },
        { name: '365 OG ROMAINE BAG', price: 2.69, unitPrice: 0, quantity: 1 },
        {
          name: '365 SALTED CORN CHIPS',
          price: 2.79,
          unitPrice: 0,
          quantity: 1,
        },
        { name: 'PDVG WHITE BAGIT', price: 3.5, unitPrice: 0, quantity: 1 },
        { name: '365 PNBTR BALLS OG', price: 3.99, unitPrice: 0, quantity: 1 },
        {
          name: '365 JMBO PAPER TOWELS',
          price: 1.69,
          unitPrice: 0,
          quantity: 1,
        },
        { name: '365 CHUNKY SALSA', price: 2.69, unitPrice: 0, quantity: 1 },
        { name: 'LACRX GRAPEFRUIT', price: 5.99, unitPrice: 0, quantity: 1 },
        { name: 'BOTTLE DEPOSIT', price: 0.6, unitPrice: 0, quantity: 1 },
        { name: 'PNLNO GRND BEEF', price: 5.99, unitPrice: 0, quantity: 1 },
      ],
      tax: 1.66,
      business_location: 'Bryant Park BPK 1095 6th Ave New York, NY 10036',
      business_name: 'WHOLE FOODS MARKET',
    };
    expect(actualOutput).toStrictEqual(expectedOutput);
  });
});
