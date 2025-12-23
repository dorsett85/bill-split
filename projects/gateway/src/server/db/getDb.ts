import { Pool, types } from 'pg';
import { env } from '../config.ts';

types.setTypeParser(types.builtins.NUMERIC, parseFloat);

const pool = new Pool({
  database: env.DB_NAME,
  host: env.DB_HOST,
  port: Number(env.DB_PORT),
  user: env.DB_USER,
  password: env.DB_PASSWORD,
});

export const getDb = (): Pool => pool;
