import { execSync } from 'node:child_process';
import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { Pool } from 'pg';

let container: StartedPostgreSqlContainer;

export async function setup() {
  container = await new PostgreSqlContainer('postgres:18').start();

  const dbConfig = {
    DB_HOST: container.getHost(),
    DB_PORT: container.getPort().toString(),
    DB_NAME: container.getDatabase(),
    DB_USER: container.getUsername(),
    DB_PASSWORD: container.getPassword(),
  };

  // Run migrations using the db project's migrate script
  execSync('pnpm migrate', {
    cwd: '../db',
    env: {
      ...process.env,
      ...dbConfig,
    },
    stdio: 'inherit',
  });

  const pool = new Pool({
    host: dbConfig.DB_HOST,
    port: parseInt(dbConfig.DB_PORT),
    database: dbConfig.DB_NAME,
    user: dbConfig.DB_USER,
    password: dbConfig.DB_PASSWORD,
  });

  // Set the migrated database as template
  await pool.query(`ALTER DATABASE ${dbConfig.DB_NAME} IS_TEMPLATE = true`);

  await pool.end();

  // Store container info for teardown and for suite setup
  process.env.TEST_DB_HOST = dbConfig.DB_HOST;
  process.env.TEST_DB_PORT = dbConfig.DB_PORT;
  process.env.TEST_DB_USER = dbConfig.DB_USER;
  process.env.TEST_DB_PASSWORD = dbConfig.DB_PASSWORD;
  process.env.TEST_DB_TEMPLATE = dbConfig.DB_NAME;
}

export async function teardown() {
  if (container) {
    await container.stop();
  }
}
