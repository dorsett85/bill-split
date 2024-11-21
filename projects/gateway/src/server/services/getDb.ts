import { Pool } from 'pg';

const pool = new Pool({
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

export const getDb = (): Pool => pool;
