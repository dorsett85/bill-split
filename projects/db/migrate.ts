import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { Pool, type QueryResult } from 'pg';

// Run this file to run new migrations

const pool = new Pool({
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const MIGRATION_DIR = path.resolve('./migrations');

/**
 * This will read in the sql text file and run the query
 */
const runScript = async (file: string): Promise<QueryResult> => {
  const buffer = await fs.readFile(path.join(MIGRATION_DIR, file));
  return pool.query(buffer.toString());
};

/**
 * This will read in all of our sql migration scripts and run any outstanding
 * ones.
 */
const runMigrations = async () => {
  // Get all the migration files and sort them. This should be automatic given
  // the five digit leading string convention.
  const files = (await fs.readdir(MIGRATION_DIR)).sort();

  for (const file of files) {
    const { name: basename } = path.parse(file);

    // Make sure the initialize script gets run, otherwise we won't have the
    // migration tracking table.
    if (basename === '00000_init') {
      await runScript(file);
      continue;
    }

    // Check for existing migration
    const { rows } = await pool.query(
      `
      SELECT * FROM migration
      WHERE name = $1;
    `,
      [basename],
    );

    if (rows.length === 0) {
      // Run the migration script
      await runScript(file);

      // Finally, add the migration record so we don't run it again
      await pool.query(
        `
        INSERT INTO migration (name)
        VALUES ($1);
      `,
        [basename],
      );

      console.log('Successfully migrated script:', file)
    }
  }
};

void runMigrations().then(() => {
  process.exit(0);
});
