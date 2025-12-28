import type { BillCreate } from '../../src/server/dto/bill.ts';

export const billCreateFixture = <T extends keyof BillCreate>(
  overrides?: Pick<BillCreate, T>,
): BillCreate => {
  const defaults: BillCreate = {
    name: 'Test Bill',
    businessName: 'Test Business',
    imagePath: 'test.jpg',
    imageStatus: 'ready',
    businessLocation: null,
    gratuity: null,
    tax: null,
    discount: null,
  };

  return { ...defaults, ...overrides };
};
