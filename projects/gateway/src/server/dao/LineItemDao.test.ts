import { assert, describe, it } from 'vitest';
import { billCreateFixture } from '../../../test/fixtures/billFixture.ts';
import { testPool } from '../../../test/vitest-db-suite-setup.ts';
import { BillDao } from './BillDao.ts';
import { LineItemDao } from './LineItemDao.ts';

describe('LineItemDao', () => {
  it('should create a line item', async () => {
    const billDao = new BillDao(testPool);
    const lineItemDao = new LineItemDao(testPool);
    const bill = await billDao.create(billCreateFixture());

    const lineItem = await lineItemDao.create({
      billId: bill.id,
      name: 'Test Item',
      price: 10,
    });

    assert.isNumber(lineItem.id);
  });
});
