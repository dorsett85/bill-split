import type { LineItemCreate } from '../../src/server/dto/lineItem.ts';

export const lineItemCreateFixture = <T extends keyof LineItemCreate>(
  overrides?: Pick<LineItemCreate, T>,
): LineItemCreate => {
  const defaults: LineItemCreate = {
    billId: 0,
    name: 'Steak',
    price: 25.0,
  };

  return { ...defaults, ...overrides };
};
