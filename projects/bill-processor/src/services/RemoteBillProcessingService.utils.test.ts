import { describe, expect, it } from 'vitest';
import { stubbedAnalyzeOutput } from '../data/analyzeExpenseCommandOutput.ts';
import { ProcessedExpense } from '../types/processedExpense.ts';
import { transformTextractToProcessedBill } from './RemoteBillProcessingService.utils.ts';

describe('transformTextractToProcessedBill', () => {
  it('transforms output to process bill', () => {
    const actualOutput = transformTextractToProcessedBill(stubbedAnalyzeOutput);

    const expectedOutput: ProcessedExpense = {
      items: [
        { name: 'BROO BROWN ALE', price: 10.99, quantity: 1 },
        { name: 'BOTTLE DEPOSIT', price: 0.3, quantity: 1 },
        { name: 'DRSCL STRAWBERRIES', price: 3.49, quantity: 1 },
        { name: 'OVF OG LG EGGS', price: 2.89, quantity: 1 },
        { name: '365 WHL MLK', price: 4.09, quantity: 1 },
        { name: 'NOOSA HONEY YOGHURT', price: 2.29, quantity: 1 },
        { name: '365 OG ROMAINE BAG', price: 2.69, quantity: 1 },
        { name: '365 SALTED CORN CHIPS', price: 2.79, quantity: 1 },
        { name: 'PDVG WHITE BAGIT', price: 3.5, quantity: 1 },
        { name: '365 PNBTR BALLS OG', price: 3.99, quantity: 1 },
        { name: '365 JMBO PAPER TOWELS', price: 1.69, quantity: 1 },
        { name: '365 CHUNKY SALSA', price: 2.69, quantity: 1 },
        { name: 'LACRX GRAPEFRUIT', price: 5.99, quantity: 1 },
        { name: 'BOTTLE DEPOSIT', price: 0.6, quantity: 1 },
        { name: 'PNLNO GRND BEEF', price: 5.99, quantity: 1 },
      ],
      tax: 1.66,
      business_location: 'Bryant Park BPK\n1095 6th Ave\nNew York, NY 10036',
      business_name: 'WHOLE\nFOODS\nMARKET',
    };
    expect(actualOutput).toStrictEqual(expectedOutput);
  });
});
