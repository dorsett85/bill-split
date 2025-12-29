import { afterEach, assert, describe, it } from 'vitest';
import { accessTokenCreateFixture } from '../../../test/fixtures/accessTokenFixture.ts';
import { testPool } from '../../../test/vitest-db-suite-setup.ts';
import { AccessTokenDao } from './AccessTokenDao.ts';

console.log('ci testing');

describe('AccessTokenDao', () => {
  afterEach(async () => {
    await testPool.query(
      `TRUNCATE TABLE ${new AccessTokenDao(testPool).tableName} CASCADE`,
    );
  });

  it('should create and search an access token', async () => {
    const accessTokenDao = new AccessTokenDao(testPool);
    const tokenData = accessTokenCreateFixture();
    const { id } = await accessTokenDao.create(tokenData);

    assert.isNumber(id);

    const tokens = await accessTokenDao.search({
      hashedToken: tokenData.hashedToken,
    });
    assert.equal(tokens.length, 1);
    assert.equal(tokens[0].hashedToken, tokenData.hashedToken);
    assert.equal(tokens[0].id, id);
  });

  it('should update an access token', async () => {
    const accessTokenDao = new AccessTokenDao(testPool);
    const tokenData = accessTokenCreateFixture();
    const { id } = await accessTokenDao.create(tokenData);

    const updateResult = await accessTokenDao.update(id, {
      active: false,
      noOfUses: 5,
    });
    assert.equal(updateResult.count, 1);

    const [token] = await accessTokenDao.search({
      hashedToken: tokenData.hashedToken,
    });
    assert.isFalse(token.active);
    assert.equal(token.noOfUses, 5);
  });

  it('should delete an access token', async () => {
    const accessTokenDao = new AccessTokenDao(testPool);
    const tokenData = accessTokenCreateFixture();
    const { id } = await accessTokenDao.create(tokenData);

    const deleteResult = await accessTokenDao.delete(id);
    assert.equal(deleteResult.count, 1);

    const tokens = await accessTokenDao.search({
      hashedToken: tokenData.hashedToken,
    });
    assert.equal(tokens.length, 0);
  });
});
