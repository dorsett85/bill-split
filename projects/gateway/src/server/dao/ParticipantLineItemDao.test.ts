import { afterEach, assert, describe, it } from 'vitest';
import { billCreateFixture } from '../../../test/fixtures/billFixture.ts';
import { lineItemCreateFixture } from '../../../test/fixtures/lineItemFixture.ts';
import { participantCreateFixture } from '../../../test/fixtures/participantFixture.ts';
import { participantLineItemCreateFixture } from '../../../test/fixtures/participantLineItemFixture.ts';
import { testPool } from '../../../test/vitest-db-suite-setup.ts';
import { BillDao } from './BillDao.ts';
import { LineItemDao } from './LineItemDao.ts';
import { ParticipantDao } from './ParticipantDao.ts';
import { ParticipantLineItemDao } from './ParticipantLineItemDao.ts';

describe('ParticipantLineItemDao', () => {
  afterEach(async () => {
    await testPool.query(
      `TRUNCATE TABLE ${new BillDao(testPool).tableName} CASCADE`,
    );
  });

  it('should create a participant line item', async () => {
    const billDao = new BillDao(testPool);
    const participantDao = new ParticipantDao(testPool);
    const lineItemDao = new LineItemDao(testPool);
    const pliDao = new ParticipantLineItemDao(testPool);

    const { id: billId } = await billDao.create(billCreateFixture());
    const { id: participantId } = await participantDao.create(
      participantCreateFixture({ billId }),
    );
    const { id: lineItemId } = await lineItemDao.create(
      lineItemCreateFixture({ billId }),
    );

    const pliData = participantLineItemCreateFixture({
      participantId,
      lineItemId,
    });
    const { count } = await pliDao.createByLineItemIdAndRebalance(
      pliData.participantId,
      lineItemId,
    );

    const res = await testPool.query(`SELECT * FROM participant_line_item`);

    assert.equal(count, 1);
    assert.equal(res.rowCount, 1);
    assert.equal(res.rows[0].pct_owes, pliData.pctOwes);
  });

  it('should create and rebalance correctly', async () => {
    const billDao = new BillDao(testPool);
    const participantDao = new ParticipantDao(testPool);
    const lineItemDao = new LineItemDao(testPool);
    const pliDao = new ParticipantLineItemDao(testPool);

    const { id: billId } = await billDao.create(billCreateFixture());
    const { id: p1 } = await participantDao.create(
      participantCreateFixture({ billId, name: 'P1' }),
    );
    const { id: p2 } = await participantDao.create(
      participantCreateFixture({ billId, name: 'P2' }),
    );
    const { id: lineItemId } = await lineItemDao.create(
      lineItemCreateFixture({ billId }),
    );

    await pliDao.createByLineItemIdAndRebalance(p1, lineItemId);
    await pliDao.createByLineItemIdAndRebalance(p2, lineItemId);

    const res = await testPool.query(
      `SELECT * FROM participant_line_item WHERE line_item_id = $1 ORDER BY id`,
      [lineItemId],
    );

    assert.equal(res.rowCount, 2);
    assert.equal(res.rows[0].pct_owes, 50);
    assert.equal(res.rows[1].pct_owes, 50);
  });

  it('should delete and rebalance correctly', async () => {
    const billDao = new BillDao(testPool);
    const participantDao = new ParticipantDao(testPool);
    const lineItemDao = new LineItemDao(testPool);
    const pliDao = new ParticipantLineItemDao(testPool);

    const { id: billId } = await billDao.create(billCreateFixture());
    const { id: p1 } = await participantDao.create(
      participantCreateFixture({ billId, name: 'P1' }),
    );
    const { id: p2 } = await participantDao.create(
      participantCreateFixture({ billId, name: 'P2' }),
    );
    const { id: lineItemId } = await lineItemDao.create(
      lineItemCreateFixture({ billId }),
    );

    await pliDao.createByLineItemIdAndRebalance(p1, lineItemId);
    await pliDao.createByLineItemIdAndRebalance(p2, lineItemId);

    // Remove P1
    await pliDao.deleteByLineItemIdsAndRebalance(p1, [lineItemId]);
    const res = await testPool.query(
      `SELECT * FROM participant_line_item WHERE line_item_id = $1`,
      [lineItemId],
    );
    assert.equal(res.rowCount, 1);
    assert.equal(res.rows[0].pct_owes, 100);
    assert.equal(res.rows[0].participant_id, p2);
  });

  it('should delete by participant and rebalance whole bill', async () => {
    const billDao = new BillDao(testPool);
    const participantDao = new ParticipantDao(testPool);
    const lineItemDao = new LineItemDao(testPool);
    const pliDao = new ParticipantLineItemDao(testPool);

    const { id: billId } = await billDao.create(billCreateFixture());
    const { id: p1 } = await participantDao.create(
      participantCreateFixture({ billId, name: 'P1' }),
    );
    const { id: p2 } = await participantDao.create(
      participantCreateFixture({ billId, name: 'P2' }),
    );
    const { id: li1 } = await lineItemDao.create(
      lineItemCreateFixture({ billId, name: 'LI1' }),
    );
    const { id: li2 } = await lineItemDao.create(
      lineItemCreateFixture({ billId, name: 'LI2' }),
    );

    await pliDao.createByLineItemIdAndRebalance(p1, li1);
    await pliDao.createByLineItemIdAndRebalance(p2, li1);
    await pliDao.createByLineItemIdAndRebalance(p1, li2);

    // Remove P1 from bill
    await pliDao.deleteByParticipantIdAndRebalance(p1, billId);

    const res1 = await testPool.query(
      `SELECT * FROM participant_line_item WHERE line_item_id = ANY($1)`,
      [[li1, li2]],
    );
    assert.equal(res1.rowCount, 1);
    assert.equal(res1.rows[0].pct_owes, 100);
    assert.equal(res1.rows[0].participant_id, p2);
  });
});
