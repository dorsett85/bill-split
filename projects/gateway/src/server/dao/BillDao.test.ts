import { afterEach, assert, describe, it } from 'vitest';
import { billCreateFixture } from '../../../test/fixtures/billFixture.ts';
import { lineItemCreateFixture } from '../../../test/fixtures/lineItemFixture.ts';
import { participantCreateFixture } from '../../../test/fixtures/participantFixture.ts';
import { testPool } from '../../../test/vitest-db-suite-setup.ts';
import { BillDao } from './BillDao.ts';
import { LineItemDao } from './LineItemDao.ts';
import { ParticipantDao } from './ParticipantDao.ts';
import { ParticipantLineItemDao } from './ParticipantLineItemDao.ts';

describe('BillDao', () => {
  afterEach(async () => {
    await testPool.query(
      `TRUNCATE TABLE ${new BillDao(testPool).tableName} CASCADE`,
    );
  });

  it('should create and read a bill', async () => {
    const billDao = new BillDao(testPool);
    const billData = billCreateFixture();
    const { id } = await billDao.create(billData);

    assert.isNumber(id);

    const bill = await billDao.read(id);
    assert.equal(bill?.name, billData.name);
  });

  it('should read a detailed bill', async () => {
    const billDao = new BillDao(testPool);
    const billData = billCreateFixture({
      tax: 10,
      gratuity: 15,
      discount: 5,
    });
    const { id } = await billDao.create(billData);

    const detailed = await billDao.readDetailed(id);
    assert.equal(detailed?.id, id);
    assert.equal(detailed?.tax, billData.tax);
    assert.equal(detailed?.gratuity, billData.gratuity);
    assert.equal(detailed?.discount, billData.discount);
    assert.isEmpty(detailed?.lineItems);
    assert.isEmpty(detailed?.participants);
  });

  it('should correctly calculate totals and shares for a complex bill', async () => {
    const billDao = new BillDao(testPool);
    const participantDao = new ParticipantDao(testPool);
    const lineItemDao = new LineItemDao(testPool);
    const pliDao = new ParticipantLineItemDao(testPool);

    const billData = billCreateFixture({
      tax: 10,
      gratuity: 20,
      discount: 5,
    });
    const { id: billId } = await billDao.create(billData);

    const { id: p1 } = await participantDao.create(
      participantCreateFixture({ billId, name: 'P1' }),
    );
    const { id: p2 } = await participantDao.create(
      participantCreateFixture({ billId, name: 'P2' }),
    );

    const { id: li1 } = await lineItemDao.create(
      lineItemCreateFixture({ billId, name: 'Item 1', price: 40 }),
    );
    const { id: li2 } = await lineItemDao.create(
      lineItemCreateFixture({ billId, name: 'Item 2', price: 60 }),
    );

    // P1 and P2 share Item 1 (50/50)
    await pliDao.createByLineItemIdAndRebalance(p1, li1);
    await pliDao.createByLineItemIdAndRebalance(p2, li1);

    // Only P2 has Item 2 (100%)
    await pliDao.createByLineItemIdAndRebalance(p2, li2);

    const detailed = await billDao.readDetailed(billId);

    // Raw subtotal = 40 + 60 = 100
    // Discount = 5
    // Subtotal (after discount) = 100 - 5 = 95
    assert.equal(detailed?.subTotal, 95);
    // Total = 100 - 5 + 10 + 20 = 125
    assert.equal(detailed?.total, 125);

    // Check participants' "owes"
    // Raw shares:
    // P1 share = 40 * 0.5 = 20
    // P2 share = (40 * 0.5) + (60 * 1.0) = 80
    // Total raw subtotal = 100

    // Calculation for "owes" (from BillDao.ts):
    // (individual_raw_subtotal * (1 - (discount / raw_subtotal))) +
    // ((individual_raw_subtotal / raw_subtotal) * tax) +
    // ((individual_raw_subtotal / raw_subtotal) * gratuity)

    // P1 owes:
    // (20 * (1 - (5 / 100))) + ((20 / 100) * 10) + ((20 / 100) * 20)
    // (20 * 0.95) + 2 + 4 = 19 + 2 + 4 = 25
    const participant1 = detailed?.participants.find((p) => p.id === p1);
    assert.equal(participant1?.owes, 25);

    // P2 owes:
    // (80 * (1 - (5 / 100))) + ((80 / 100) * 10) + ((80 / 100) * 20)
    // (80 * 0.95) + 8 + 16 = 76 + 8 + 16 = 100
    const participant2 = detailed?.participants.find((p) => p.id === p2);
    assert.equal(participant2?.owes, 100);

    // Total owes (25 + 100) should match Total (125)
    assert.equal(participant1!.owes + participant2!.owes, detailed!.total);

    // Verify line item associations
    const item1 = detailed?.lineItems.find((li) => li.id === li1);
    assert.includeMembers(item1!.participantIds, [p1, p2]);

    const item2 = detailed?.lineItems.find((li) => li.id === li2);
    assert.includeMembers(item2!.participantIds, [p2]);
    assert.lengthOf(item2!.participantIds, 1);
  });
});
