import { Pool, types } from 'pg';
import { afterAll, beforeAll } from 'vitest';

types.setTypeParser(types.builtins.NUMERIC, parseFloat);

let dbName: string;
export let testPool: Pool;

beforeAll(async (suite) => {
  // Create a unique database name for this suite
  dbName = `test_${suite.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}_${Date.now()}`;

  const adminPool = new Pool({
    host: process.env.TEST_DB_HOST,
    port: parseInt(process.env.TEST_DB_PORT!),
    user: process.env.TEST_DB_USER,
    password: process.env.TEST_DB_PASSWORD,
    database: 'postgres', // Connect to default postgres to manage other DBs
  });

  await adminPool.query(
    `CREATE DATABASE ${dbName} TEMPLATE ${process.env.TEST_DB_TEMPLATE}`,
  );
  await adminPool.end();

  testPool = new Pool({
    host: process.env.TEST_DB_HOST,
    port: parseInt(process.env.TEST_DB_PORT!),
    user: process.env.TEST_DB_USER,
    password: process.env.TEST_DB_PASSWORD,
    database: dbName,
  });
});

afterAll(async () => {
  if (testPool) {
    await testPool.end();
  }

  const adminPool = new Pool({
    host: process.env.TEST_DB_HOST,
    port: parseInt(process.env.TEST_DB_PORT!),
    user: process.env.TEST_DB_USER,
    password: process.env.TEST_DB_PASSWORD,
    database: 'postgres',
  });

  // Force disconnect other users and drop database
  await adminPool.query(
    `
    SELECT pg_terminate_backend(pg_stat_activity.pid)
    FROM pg_stat_activity
    WHERE pg_stat_activity.datname = $1
      AND pid <> pg_backend_pid();
  `,
    [dbName],
  );

  await adminPool.query(`DROP DATABASE IF EXISTS ${dbName}`);
  await adminPool.end();
});
