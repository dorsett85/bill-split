import { describe, expect, it } from 'vitest';
import { jaliscoCantinaBillOutput } from '../data/jalisco-cantina-bill.ts';
import { stubbedAnalyzeOutput } from '../data/whole-foods-receipt.ts';
import type { ProcessedExpense } from '../types/processedExpense.ts';
import { transformTextractToProcessedBill } from './RemoteBillProcessingService.utils.ts';

describe('Whole foods bill transform and process', () => {
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

describe('Jalisco Cantina bill transform and process', () => {
  it('transforms output to processed bill', () => {
    const actualOutput = transformTextractToProcessedBill(
      jaliscoCantinaBillOutput,
    );
    const expectedOutput: ProcessedExpense = {
      business_location:
        'Jalisco Cantina Whitefish 510 Wisconsin Ave Whitefish, MT 59037',
      business_name: 'Jalisco Cantina',
      gratuity: 46.5,
      items: [
        {
          name: 'SALSA',
          price: 6.5,
          quantity: 1,
          unitPrice: 0,
        },
        {
          name: 'GUACAMOLE',
          price: 10,
          quantity: 1,
          unitPrice: 0,
        },
        {
          name: 'HOUSE MEX LAGER',
          price: 18,
          quantity: 3,
          unitPrice: 6,
        },
        {
          name: 'YELLOW JACKET',
          price: 34,
          quantity: 2,
          unitPrice: 17,
        },
        {
          name: 'HIBISCUS TEA',
          price: 4,
          quantity: 1,
          unitPrice: 0,
        },
        {
          name: 'HALF ESQUITES',
          price: 17,
          quantity: 2,
          unitPrice: 8.5,
        },
        {
          name: 'CARNITAS',
          price: 17,
          quantity: 1,
          unitPrice: 0,
        },
        {
          name: 'BURRITO',
          price: 17.5,
          quantity: 1,
          unitPrice: 0,
        },
        {
          name: 'BARBACOA',
          price: 7,
          quantity: 1,
          unitPrice: 0,
        },
        {
          name: 'SPECIAL ENTREE',
          price: 43,
          quantity: 1,
          unitPrice: 0,
        },
        {
          name: 'CARNITAS',
          price: 17,
          quantity: 1,
          unitPrice: 0,
        },
        {
          name: 'BURRITO',
          price: 17.5,
          quantity: 1,
          unitPrice: 0,
        },
        {
          name: 'CARNITAS',
          price: 17,
          quantity: 1,
          unitPrice: 0,
        },
        {
          name: 'CRANKY SAM',
          price: 7,
          quantity: 1,
          unitPrice: 0,
        },
      ],
      tax: 6.99,
    };

    expect(actualOutput).toStrictEqual(expectedOutput);
  });
});
