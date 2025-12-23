import { Pool, types } from 'pg';
import { env } from '../config.ts';

types.setTypeParser(types.builtins.NUMERIC, parseFloat);

let pool: Pool;

export const getDb = (): Pool => {
  if (!pool) {
    pool = new Pool({
      database: env.DB_NAME,
      host: env.DB_HOST,
      port: Number(env.DB_PORT),
      user: env.DB_USER,
      password: env.DB_PASSWORD,
    });
  }
  return pool;
};
