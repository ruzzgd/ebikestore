import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, closePool } from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MIGRATIONS_DIR = path.resolve(__dirname, '../../migrations');

export const runMigrations = async () => {
  console.log('[MIGRATION] Starting database migration process...');

  try {
    // 1. Ensure tracking table exists
    await query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        migration_name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Fetch applied migrations
    const [appliedRows] = await query('SELECT migration_name FROM schema_migrations');
    const appliedSet = new Set(appliedRows.map((r) => r.migration_name));

    // 3. Read migration files
    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    let executedCount = 0;

    for (const file of files) {
      if (appliedSet.has(file)) {
        continue;
      }

      console.log(`[MIGRATION] Executing pending migration: ${file}`);
      const filePath = path.join(MIGRATIONS_DIR, file);
      const sqlContent = fs.readFileSync(filePath, 'utf-8');

      // Split multiple SQL statements by semicolon if needed
      const statements = sqlContent
        .split(';')
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt.length > 0);

      for (const statement of statements) {
        await query(statement);
      }

      await query('INSERT INTO schema_migrations (migration_name) VALUES (?)', [file]);
      console.log(`[MIGRATION] Successfully applied: ${file}`);
      executedCount++;
    }

    console.log(`[MIGRATION] Migration complete. Applied ${executedCount} new migration(s).`);
  } catch (error) {
    console.error('[MIGRATION ERROR] Migration failed:', error);
    throw error;
  }
};

// Execute if run directly from command line
if (process.argv[1] && process.argv[1].endsWith('migrate.js')) {
  runMigrations()
    .then(() => {
      closePool();
      process.exit(0);
    })
    .catch(() => {
      closePool();
      process.exit(1);
    });
}
