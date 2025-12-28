import { afterEach, assert, describe, it } from 'vitest';
import { billCreateFixture } from '../../../test/fixtures/billFixture.ts';
import { participantCreateFixture } from '../../../test/fixtures/participantFixture.ts';
import { testPool } from '../../../test/vitest-db-suite-setup.ts';
import { BillDao } from './BillDao.ts';
import { ParticipantDao } from './ParticipantDao.ts';

describe('ParticipantDao', () => {
  afterEach(async () => {
    await testPool.query(
      `TRUNCATE TABLE ${new BillDao(testPool).tableName} CASCADE`,
    );
  });

  it('should create and update a participant', async () => {
    const billDao = new BillDao(testPool);
    const participantDao = new ParticipantDao(testPool);
    const bill = await billDao.create(billCreateFixture());

    // Create a participant
    const participant = await participantDao.create(
      participantCreateFixture({
        billId: bill.id,
      }),
    );

    assert.isNumber(participant.id);

    // Update the participant
    const updateResult = await participantDao.update(participant.id, {
      name: 'Jane Doe',
      billId: bill.id,
    });

    const res = await testPool.query(`SELECT * FROM participant`);

    assert.equal(updateResult.count, 1);
    assert.equal(res.rowCount, 1);
    assert.equal(res.rows[0].name, 'Jane Doe');
  });

  it('should create and delete a participant', async () => {
    const billDao = new BillDao(testPool);
    const participantDao = new ParticipantDao(testPool);
    const bill = await billDao.create(billCreateFixture());

    // Create a participant
    const participant = await participantDao.create(
      participantCreateFixture({
        billId: bill.id,
      }),
    );

    assert.isNumber(participant.id);

    // Update the participant
    const updateResult = await participantDao.deleteBillParticipant(
      participant.id,
      bill.id,
    );

    const res = await testPool.query(`SELECT * FROM participant`);

    assert.equal(updateResult.count, 1);
    assert.equal(res.rowCount, 0);
  });

  it('should handle transactions', async () => {
    const billDao = new BillDao(testPool);
    const participantDao = new ParticipantDao(testPool);

    const bill = await billDao.create(billCreateFixture());

    await participantDao.tx(async (client) => {
      await participantDao.create(
        participantCreateFixture({
          billId: bill.id,
          name: 'Alice',
        }),
        client,
      );
      await participantDao.create(
        participantCreateFixture({
          billId: bill.id,
          name: 'Bob',
        }),
        client,
      );
    });

    const res = await testPool.query(`SELECT * FROM participant`);
    assert.equal(res.rowCount, 2);
  });
});
